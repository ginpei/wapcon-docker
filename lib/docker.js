/* eslint no-use-before-define: "off" */

const fs = require('fs')
const path = require('path')

const commandRunner = require('./commandRunner.js')
const pullProgress = {
	complete: Symbol(),
	working: Symbol(),
}

async function checkImageStatus({ wp, db } = {}) {
	const wpResult = await checkImageAvailability({ repository: 'wordpress', tag: wp })
	const dbResult = await checkImageAvailability({ repository: 'mysql', tag: db })

	return {
		db: dbResult.available,
		ok: dbResult.available && wpResult.available,
		wp: wpResult.available,
	}
}

async function pullImages({ wp, db }, callback) {
	const allStatus = { wp: { progress: new Map() }, db: { progress: new Map() } }
	await pullImage('wordpress', wp || 'latest', (status) => {
		allStatus.wp = status
		callback(allStatus)
	})
	await pullImage('mysql', wp || 'latest', (status) => {
		allStatus.db = status
		callback(allStatus)
	})
}

async function pullImage(image, tag, callback) {
	if (!image) {
		throw new Error('Image name is required')
	}

	if (!tag) {
		tag = 'latest'
	}

	const progress = new Map()
	const status = {
		image, progress, tag,
		COMPLETE: pullProgress.complete,
		WORKING: pullProgress.working,
		ok: false,
	}

	const rxFirstLine = /^.+: Pulling from .+$/
	const rxProgressLine = /^(.{12}): (.*)$/
	const rxComplete = /Status: Downloaded newer image for .+:.+/
	const rxUpToDate = /Status: Image is up to date for .+:.+/

	await commandRunner.run(`docker pull ${image}:${tag}`, ({ text }) => {
		for (const line of text.split('\n')) {
			if (rxFirstLine.test(line)) {
				// ignore
			}
			else if (rxComplete.test(line) || rxUpToDate.test(line)) {
				status.ok = true
			}
			else {
				const [, id, message] = rxProgressLine.exec(line) || []
				if (id) {
					const progressStatus = message === 'Pull complete' ? pullProgress.complete : pullProgress.working
					progress.set(id, progressStatus)
				}
			}

			if (typeof callback === 'function') {
				callback(status)
			}
		}
	})

	return status
}

/**
 * Check if machines are ready.
 * @returns {Promise}
 * @example
 * docker.checkMachineStatus()
 *   .then((status) => {
 *     console.log(status.ok)
 *
 *     console.log(status.db)
 *     console.log(status.wp)
 *   })
 */
function checkMachineStatus() {
	return commandRunner.run('docker container ls --format {{.Names}} --filter name=wapcon-')
		.then(({ code, result }) => {
			const status = {}

			if (code !== 0) {
				throw new Error(`Failed in code ${code}. Docker isn't up?`)
			}

			if (result.length > 0) {
				const firstOutput = result.find(v => v.type === 'stdout')
				if (firstOutput) {
					const lines = firstOutput.text.split('\n')
					status.db = lines.some(v => v === 'wapcon-db')
					status.wp = lines.some(v => v === 'wapcon-wp')
				}
			}

			status.db = status.db || false
			status.wp = status.wp || false

			status.ok =status.db && status.wp
			return status
		})
}

/**
 * Boot docker containers.
 * @param {Event} event
 * @param {object} options
 * @param {string} options.databasePath
 * @param {string} options.wordpressPath
 * @param {Array} options.themeList
 */
async function startMachine(event, options = {}) {
	const imagesStatus = await checkImageStatus({ wp: options.wpTag, db: options.dbTag })
	if (!imagesStatus.ok) {
		throw new Error('Machines are not ready.')  // need to run pullImages() before
	}

	const arg = createArgFromPreferences(options)
	removeOldThemeDirectories(arg.wordpressPath)

	const results = {
		db: await startDb(arg),
		wp: await startWordPress(arg),
	}
	return results
}

function createArgFromPreferences(preferences) {
	const arg = {
		databasePath: preferences.databasePath && path.resolve(preferences.databasePath),
		wordpressPath: preferences.wordpressPath && path.resolve(preferences.wordpressPath),
	}

	if (preferences.themeList) {
		arg.themeVolumeOptions = preferences.themeList.reduce((array, theme) => {
			const hostPath = path.resolve(theme.path)  // TODO validate
			const containerPath = `/var/www/html/wp-content/themes/wapcon-${theme.id}`
			array.push('-v')
			array.push(`${hostPath}:${containerPath}`)
			return array
		}, [])
	}

	return arg
}

function removeOldThemeDirectories(wordpressPath) {
	if (!wordpressPath) {
		return
	}

	const themeDirectory = `${wordpressPath}/wp-content/themes`
	fs.readdirSync(themeDirectory).forEach((fname) => {
		if (fname.startsWith('wapcon-')) {
			fs.rmdirSync(`${themeDirectory}/${fname}`)
		}
	})
}

function stopMachine(event, arg) {
	return Promise.all([
		stopDb(),
		stopWordPress(),
	])
}

function startDb({ databasePath }) {
	// TODO wait until DB is actually ready
	const command = [
		'docker run',
		'-d',
		'--rm',
		'--name wapcon-db',
		'--env-file ./machine-env',
		databasePath ? `-v ${databasePath}:/var/lib/mysql` : '',
		'mysql',
	].join(' ')
	return commandRunner.run(command)
}

function stopDb() {
	const command = 'docker stop wapcon-db'
	return commandRunner.run(command)
}

function startWordPress({ wordpressPath, themeVolumeOptions }) {
	const command = [
		'docker',
		'run',
		'-d',
		'--rm',
		'--name', 'wapcon-wp',
		'--link', 'wapcon-db:db',
		'--env-file', './machine-env',
		'-p', '80:80',
		wordpressPath ? `-v ${wordpressPath}:/var/www/html` : '',
		...(themeVolumeOptions ? themeVolumeOptions : []),
		'wordpress',
	]
	return commandRunner.run(command)
}

function stopWordPress() {
	const command = 'docker stop wapcon-wp'
	return commandRunner.run(command)
}

/**
 * @param {Array (string)} options.targets e.g. `['mysql:latest', 'wordpress:latest']`
 * @returns {Promise}
 * @example
 * const targets = ['mysql:latest', 'wordpress:latest']
 * checkImageAvailability(targets)
 *   .then(details => {
 *     const available = details.every(v => v.available)
 *     console.log('# OK?', available)
 *   })
 */
async function checkImageAvailability({ repository, tag = 'latest' }) {
	const imageLsResult = await commandRunner.run('docker image ls --format {{.Repository}}:{{.Tag}}')

	const availableImages = imageLsResult.result
		.filter(data => data.type === 'stdout')
		.map(data => data.text.split('\n'))
		.reduce((allLines, lines) => allLines.concat(lines), [])
		.filter(line => line)

	return {
		available: availableImages.includes(`${repository}:${tag}`),
		repository,
		tag,
	}
}

module.exports = {
	checkImageStatus,
	checkMachineStatus,
	startMachine,
	stopMachine,
	pullImages,
	commandRunner,

	functions: {
		createArgFromPreferences,
		removeOldThemeDirectories,
		checkImageAvailability,
		pullImage,
	},
}
