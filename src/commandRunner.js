const spawn = require('child_process').spawn

function noop(){}

/**
 * @param {string} command
 * @param {function} [callback] Callback for each output group.
 * @returns {Promise}
 */
function run(command, callback = noop) {
	const [entry, ...commandArgs] = command instanceof Array ? command : command.split(' ')
	const sCommand = entry + ' ' + commandArgs.join(' ')
	console.log('$', sCommand)

	return new Promise((resolve, reject) => {
		const result = [
			{
				text: sCommand,
				type: 'command',
			},
		]

		const cmd = spawn(entry, commandArgs)

		cmd.stdout.on('data', data => {
			const output = {
				text: data.toString(),
				type: 'stdout',
			}
			result.push(output)
			callback(output)
		})

		cmd.stderr.on('data', data => {
			const text = data.toString()
			console.log('ERR', text);
			const output = {
				text: text,
				type: 'stderr',
			}
			result.push(output)
			callback(output)
		})

		cmd.on('error', error => {
			// error object cannot be passed to the renderer thread
			reject({
				message: error.message,
				original: error,  // will be empty object `{}`
				stack: error.stack,
			})
		})

		cmd.on('close', code => {
			resolve({ code, result })
		})
	})
}

module.exports = {
	run,
}
