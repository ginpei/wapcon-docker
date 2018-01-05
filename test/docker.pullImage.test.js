const chaiAsPromised = require('chai-as-promised')
const expect = require('chai').expect
const sinon = require('sinon')

const docker = require('../index.js')

require('chai').use(chaiAsPromised)

describe('back/docker.pullImage()', () => {
	let status

	const stdoutLineGroups = {
		working: [
			'latest: Pulling from library/wordpress',
			'A00b522d92ff: Pulling fs layer',  // A
			'B0051f247827: Pulling fs layer',  // B
			'C00186f8edb2: Pulling fs layer',  // C
			'A00b522d92ff: Pull complete',     // A: complete
			'B0051f247827: Download complete', // B: in progress (downloaded)
		].join('\n'),
		complete: [
			'B0051f247827: Pull complete',     // B: complete
			'C00186f8edb2: Pull complete',     // C: complete
			'Digest: sha256:832e18fa1b902880e3272e57e1d54caa383d3f5d8d72c194ba7f251a5ab12005',
			'Status: Downloaded newer image for wordpress:latest',
		].join('\n'),
	}

	function makeOutput(text) {
		return {
			text: text,
			type: 'stdout',
		}
	}

	beforeEach(() => {
		status = undefined
		sinon.stub(docker.commandRunner, 'run')
	})

	afterEach(() => {
		docker.commandRunner.run.restore()
	})

	it('requires image name', async () => {
		await expect(docker.pullImage('', '')).to.eventually.rejectedWith(Error)
	})

	describe('in progress callback', () => {
		beforeEach(async () => {
			docker.commandRunner.run
				.withArgs('docker pull wordpress:latest')
				.callsFake((command, callback) => {
					callback(makeOutput(stdoutLineGroups.working))
				})

			await docker.pullImage('wordpress', 'latest', (_status) => {
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
			docker.commandRunner.run
				.withArgs('docker pull wordpress:latest')
				.callsFake((command, callback) => {
					callback(makeOutput(stdoutLineGroups.working))
					callback(makeOutput(stdoutLineGroups.complete))
				})

			status = await docker.pullImage('wordpress', 'latest')
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
