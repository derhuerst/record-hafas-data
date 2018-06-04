'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const {Readable} = require('stream')
const test = require('tape')

const record = require('.')

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
		return db
	}
}

const createMockMonitor = (onStop) => {
	const monitor = new Readable({
		objectMode: true,
		read: () => {}
	})

	const writeDep = () => {
		monitor.push({
			station: {type: 'station', id: '1234567'},
			when: new Date(Date.now() + 5 * 1000).toISOString(),
			delay: 2,
			direction: 'one-direction', // haha
			line: {
				type: 'line',
				id: '123',
				name: '123 Line',
				public: true,
				mode: 'train'
			},
			trip: Math.round(Math.random() * 30000) + ''
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
