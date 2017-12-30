const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

const commandRunner = require('./commandRunner.js')

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
function startMachine(event, options = {}) {
	const arg = createArgFromPreferences(options)
	removeOldThemeDirectories(arg.wordpressPath)
	const results = {}
	return startDb(arg)
		.then(result => {
			results.db = result
			return startWordPress(arg)
		})
		.then(result => {
			results.wp = result
			return results
		})
		.catch(error => {
			results.error = error
			return results
		})
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
	fs.readdirSync(themeDirectory).forEach((fname) =>{
		if (fname.startsWith('wapcon-')) {
			fs.rmdirSync(`${themeDirectory}/${fname}`)
		}
	})
}

function stopMachine(event, arg) {
	console.log('stopMachine')
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
function checkImageAvailability(event, { repository, tag }) {
	return commandRunner.run('docker image ls --format {{.Repository}}:{{.Tag}}')
		.then(imageLsResult => {
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
		})
}

/**
 * @param {string} name e.g. `"wordpress"`
 * @param {string} tag e.g. `"latest"`
 * @returns {Promise}
 */
function pullImage(name, tag) {
	return commandRunner.run(`docker pull ${name}:${tag}`)
}

module.exports = {
	checkMachineStatus,
	startMachine,
	stopMachine,
	commandRunner,

	functions: {
		createArgFromPreferences,
		removeOldThemeDirectories,
		checkImageAvailability,
	},
}
