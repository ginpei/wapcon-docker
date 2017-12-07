const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const docker = require('../index.js')
const functions = docker.functions

describe('back/docker', () => {
	describe('createArgFromPreferences()', () => {
		let result

		beforeEach(() => {
			const resolveStub = sinon.stub(path, 'resolve')
			resolveStub.withArgs('user/db').returns('/path/to/wapcon/user/db')
			resolveStub.withArgs('user/wp').returns('/path/to/wapcon/user/wp')
			resolveStub.withArgs('~/my-great-theme').returns('/home/foo/my-great-theme')

			result = functions.createArgFromPreferences({
				databasePath: 'user/db',
				themeList: [
					{ id: '123', path: '~/my-great-theme' },
				],
				wordpressPath: 'user/wp',
			})
		})

		afterEach(() => {
			path.resolve.restore()
		})

		it('returns resolved db path', () => {
			expect(result.databasePath).to.equal('/path/to/wapcon/user/db')
		})

		it('returns resolved wp path', () => {
			expect(result.wordpressPath).to.equal('/path/to/wapcon/user/wp')
		})

		it('returns `-v` options', () => {
			expect(result.themeVolumeOptions.length).to.equal(2)
			expect(result.themeVolumeOptions[0]).to.equal('-v')
			expect(result.themeVolumeOptions[1]).to.equal('/home/foo/my-great-theme:/var/www/html/wp-content/themes/wapcon-123')
		})
	})

	describe('removeOldThemeDirectories()', () => {
		let rmdirSyncSpy

		beforeEach(() => {
			sinon.stub(fs, 'readdirSync')
				.withArgs('/path/to/wp/wp-content/themes').returns(['.', '..', 'twentyfifteen', 'wapcon-0', 'wapcon-1'])
			rmdirSyncSpy = sinon.spy()
			sinon.stub(fs, 'rmdirSync')
				.callsFake(rmdirSyncSpy)

			functions.removeOldThemeDirectories('/path/to/wp')
		})

		afterEach(() => {
			fs.readdirSync.restore()
			fs.rmdirSync.restore()
		})

		it('removes directories created by ownself', () => {
			expect(rmdirSyncSpy.callCount).to.equal(2)
			expect(rmdirSyncSpy.calledWith('/path/to/wp/wp-content/themes/wapcon-0')).to.equal(true)
			expect(rmdirSyncSpy.calledWith('/path/to/wp/wp-content/themes/wapcon-1')).to.equal(true)
		})
	})

	describe('checkImageAvailability()', () => {
		const event = {}
		let result

		beforeEach(() => {
			sinon.stub(docker.commandRunner, 'run')

			docker.commandRunner.run
				.withArgs('docker image ls --format {{.Repository}}:{{.Tag}}')
				.returns(Promise.resolve({
					result: [
						{ type: 'stdout', text: 'mysql:latest\nwordpress:latest' },
					],
				}))
		})

		afterEach(() => {
			docker.commandRunner.run.restore()
		})

		it('returns availability for an available image', (done) => {
			const options = {
				repository: 'wordpress',
				tag: 'latest',
			}
			functions.checkImageAvailability(event, options)
				.then(({ available, repository, tag }) => {
					expect(available).to.equal(true)
					expect(repository).to.equal('wordpress')
					expect(tag).to.equal('latest')
					done()
				})
		})

		it('returns availability for an unavailable repository', (done) => {
			const options = {
				repository: 'WordPress',
				tag: 'latest',
			}
			functions.checkImageAvailability(event, options)
				.then(({ available, repository, tag }) => {
					expect(available).to.equal(false)
					expect(repository).to.equal('WordPress')
					expect(tag).to.equal('latest')
					done()
				})
		})

		it('returns availability for an unavailable tag', (done) => {
			const options = {
				repository: 'wordpress',
				tag: '0.0.0',
			}
			functions.checkImageAvailability(event, options)
				.then(({ available, repository, tag }) => {
					expect(available).to.equal(false)
					expect(repository).to.equal('wordpress')
					expect(tag).to.equal('0.0.0')
					done()
				})
		})
	})
})
