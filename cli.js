var prompt = require('prompt')
var docker = require('./lib/docker.js')

prompt.start()

async function ask() {
	console.log()
	console.log('Commands:')
	console.log('- exit')
	Object.keys(commands).forEach((command) => {
		console.log(`- ${command}`)
	})

	prompt.get(['command'], async function (err, result) {
		const userCommand = result.command

		if (userCommand === 'exit') {
			console.log('Bye')
		}
		else if (userCommand) {
			await commands[userCommand]()
			ask()
		}
		else {
			ask()
		}
	})
}

const commands = {
	async status () {
		const result = await docker.checkMachineStatus()
		console.log('result', result)
	},

	async start () {
		const result = await docker.startMachine()
		console.log('result', result)
	},

	async stop () {
		const result = await docker.stopMachine()
		console.log('result', result)
	},
}

ask()
