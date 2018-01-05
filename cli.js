/* eslint no-console: "off" */

const prompt = require('prompt')
const docker = require('./lib/docker.js')

prompt.start()

const commands = {
	async status() {
		const result = await docker.checkMachineStatus()
		console.log('result', result)
	},

	async start() {
		const result = await docker.startMachine()
		console.log('result', result)
	},

	async stop() {
		const result = await docker.stopMachine()
		console.log('result', result)
	},

	async images() {
		const result = await docker.checkImageStatus()
		console.log('result', result)
	},

	async pull() {
		const imageStatus = await docker.checkImageStatus()

		if (imageStatus.wp) {
			console.log('WordPress is ready.')
		}
		else {
			await docker.pullImage('wordpress', 'latest', (status) => {
				const nAll = status.progress.size
				const nDone = [...status.progress.values()].filter(v => v === status.COMPLETE).length
				console.log(`WordPress: ${nDone}/${nAll}`)
			})
		}

		if (imageStatus.db) {
			console.log('MySQL is ready.')
		}
		else {
			await docker.pullImage('mysql', 'latest', (status) => {
				const nAll = status.progress.size
				const nDone = [...status.progress.values()].filter(v => v === status.COMPLETE).length
				console.log(`MySQL: ${nDone}/${nAll}`)
			})
		}
	},

	async 'remove-images'() {
		console.log('(Note: this "remove-images" is NOT a wapcon-docker\'s command.)')
		await docker.commandRunner.run('docker image rm wordpress:latest mysql:latest')
	},
}

async function ask() {
	console.log()
	console.log('Commands:')
	console.log('- exit')
	Object.keys(commands).forEach((command) => {
		console.log(`- ${command}`)
	})

	prompt.get(['command'], async function(err0, result) {
		if (err0) {
			throw err0
		}

		const userCommand = result.command

		if (userCommand === 'exit' || userCommand === '') {
			console.log('Bye')
		}
		else if (userCommand) {
			try {
				await commands[userCommand]()
			}
			catch (err) {
				console.error(err)
			}
			ask()
		}
		else {
			ask()
		}
	})
}

ask()
