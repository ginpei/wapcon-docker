const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const docker = require('../index.js')
const functions = docker.functions

describe('back/docker.pullImage()', () => {
	let result
	let status

	const stdoutLineGroups = {
		working: [
			'latest: Pulling from library/wordpress',
			'A00b522d92ff: Pulling fs layer',  // A
			'B0051f247827: Pulling fs layer',  // B
			'C00186f8edb2: Pulling fs layer',  // C
			'A00b522d92ff: Pull complete',     // A: complete
			'B0051f247827: Download complete', // B: in progress (downloaded)
		],
		complete: [
			'B0051f247827: Pull complete',     // B: complete
			'C00186f8edb2: Pull complete',     // C: complete
			'Digest: sha256:832e18fa1b902880e3272e57e1d54caa383d3f5d8d72c194ba7f251a5ab12005',
			'Status: Downloaded newer image for wordpress:latest',
		]
	}

	function sleep(ms) {
		return new Promise(f => setTimeout(f, ms))
	}

	function makeOutput(text) {
		return output = {
			text: text,
			type: 'stdout',
		}
	}

	beforeEach(() => {
		result = undefined
		status = undefined
		sinon.stub(docker.commandRunner, 'run')
	})

	afterEach(() => {
		docker.commandRunner.run.restore()
	})

	it('requires image name', (done) => {
		let called = false

		functions.pullImage('', '')
			.catch((err) => {
				called = true
				expect(called).to.equal(true)
				done()
			})
	})

	describe('in progress callback', () => {
		beforeEach(async () => {
			const stdoutLines = [...stdoutLineGroups.working]

			docker.commandRunner.run
				.withArgs('docker pull wordpress:latest')
				.callsFake(async (command, callback) => {
					for (const text of stdoutLines) {
						callback(makeOutput(text))
					}
				})

			await functions.pullImage('wordpress', 'latest', (_status) => {
				status = _status
			})
		})

		it('gives progress symbols', () => {
			expect(typeof status.COMPLETE).to.equal('symbol')
			expect(typeof status.WORKING).to.equal('symbol')
		})

		it('is not ok yet', () => {
			expect(status.ok).to.equal(false)
		})

		it('contains 3 items', () => {
			expect(status.progress.size).to.equal(3)
		})

		it('mark it complete', () => {
			expect(status.progress.get('A00b522d92ff')).to.equal(status.COMPLETE)
		})

		it('mark it working if it is just download complete', () => {
			expect(status.progress.get('B0051f247827')).to.equal(status.WORKING)
		})

		it('mark it working if it is pulling', () => {
			expect(status.progress.get('C00186f8edb2')).to.equal(status.WORKING)
		})
	})

	describe('when done', () => {
		beforeEach(async () => {
			const stdoutLines = [...stdoutLineGroups.working, ...stdoutLineGroups.complete]

			docker.commandRunner.run
				.withArgs('docker pull wordpress:latest')
				.callsFake(async (command, callback) => {
					for (const text of stdoutLines) {
						callback(makeOutput(text))
					}
				})

			status = await functions.pullImage('wordpress', 'latest')
		})

		it('is ok', () => {
			expect(status.ok).to.equal(true)
		})

		it('contains 3 items', () => {
			expect(status.progress.size).to.equal(3)
		})

		it('each item is marked as complete', () => {
			expect(status.progress.get('A00b522d92ff')).to.equal(status.COMPLETE)
			expect(status.progress.get('B0051f247827')).to.equal(status.COMPLETE)
			expect(status.progress.get('C00186f8edb2')).to.equal(status.COMPLETE)
		})
	})
})
