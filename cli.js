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
			try {
				await commands[userCommand]()
			} catch (err) {
				console.error(err);
			}
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

	async pull () {
		await docker.pullImages({ wp: 'latest', db: 'latest' }, ({ type, status }) => {
			const nAll = status.progress.size
			const nComplete = [...status.progress.values()].filter(v => v === status.COMPLETE).length
			console.log(`${type}: ${nComplete}/${nAll}`)
		})
	},
}

ask()
