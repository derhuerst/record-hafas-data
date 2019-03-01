'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const {Readable} = require('stream')
const test = require('tape')
const alphanumericId = require('alphanumeric-id')

const record = require('.')

const VERSION_KEY = 'hafas-delays-version'
const VERSION = require('./package.json').version

const createLevelWithSpies = (onCreate, onBatch) => {
	return function _createDbWithSpies (path, opt, cb) {
		onCreate.apply({}, arguments)

		const args = [memdown(path)].concat(Array.from(arguments).slice(1))
		const db = levelup.apply({}, args)

		const origBatch = db.batch
		db.batch = function batchSpy (ops, cb) {
			onBatch(ops)
			return origBatch.apply(db, arguments)
		}

		db.put(VERSION_KEY, VERSION, (err) => {
			if (err) cb(err)
			else cb(null, db)
		})
	}
}

const createMockMonitor = (onStop) => {
	const monitor = new Readable({
		objectMode: true,
		read: () => {}
	})

	const writeDep = () => {
		monitor.push({
			tripId: alphanumericId(22),
			stop: {type: 'station', id: '1234567'},
			when: new Date(Date.now() + 40 * 1000).toISOString(),
			delay: 30,
			direction: 'one-direction', // haha
			line: {
				type: 'line',
				id: '123',
				name: '123 Line',
				public: true,
				mode: 'train'
			}
		})
	}

	let interval = setInterval(writeDep, 1 * 1000)
	monitor.stop = () => {
		if (interval !== null) {
			clearInterval(interval)
			interval = null
		}
		onStop()
	}

	return monitor
}

test('rejects old versions', (t) => {
	const monitor = createMockMonitor(() => {})
	const db = levelup(memdown('/foo'))
	const level = (path, opt, cb) => {
		setImmediate(cb, null, db)
	}

	db.put('hafas-delays-version', '0.0.0', (err) => {
		if (err) return t.ifError(err)

		const recorder = record('/foo', monitor, level)
		recorder.once('error', (err) => {
			t.ok(err)
			t.equal(err.dbVersion, '0.0.0')
			t.equal(typeof err.expectedVersion, 'string')
			t.ok(err.expectedVersion)

			monitor.stop()
			t.end()
		})
	})
})

test('works', (t) => {
	const onStop = () => t.pass('stop called')
	const monitor = createMockMonitor(onStop)

	const onCreate = path => t.equal(path, '/foo')
	let stopped = false
	const onBatch = (ops) => {
		if (!stopped) {
			recorder.stop()
			stopped = true
		}

		t.ok(Array.isArray(ops))
		t.ok(ops.length > 0)
		for (let op of ops) {
			t.ok(op)
			t.ok(op.type, 'put')
			t.ok(op.value)
		}
		t.end()
	}

	const recorder = record('/foo', monitor, createLevelWithSpies(onCreate, onBatch))
	recorder.on('error', t.ifError)
	// todo: check if emits events
})
