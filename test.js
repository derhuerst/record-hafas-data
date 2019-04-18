'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const {Readable} = require('stream')
const test = require('tape')
const alphanumericId = require('alphanumeric-id')

const record = require('.')
const createLastDepPerStopoverStream = require('./last-dep-per-stopover')

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

		cb(null, db)
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

test('works', (t) => {
	const onStop = () => t.pass('stop called')
	const monitor = createMockMonitor(onStop)

	const onCreate = path => t.equal(path, '/foo')
	let stopped = false
	const onBatch = (ops) => {
		t.ok(Array.isArray(ops))
		t.ok(ops.length > 0)
		for (let op of ops) {
			t.ok(op)
			t.equal(op.key.slice(0, 2), '1-', 'namespace in key') // namespace
			t.ok(op.type, 'put')
			t.ok(op.value)
		}

		if (!stopped) {
			stopped = true
			recorder.stop()
			t.end()
		}
	}

	const recorder = record('/foo', monitor, createLevelWithSpies(onCreate, onBatch))
	recorder.on('error', t.ifError)
	// todo: check if emits events
})

test('last-dep-per-stopover works', (t) => {
	const MINUTE = 60
	const HOUR = 60 * MINUTE
	const DAY = 24 * HOUR

	const s = createLastDepPerStopoverStream(10 * HOUR)
	const writeDep = (tQuery, tripId, when, delay) => {
		s.write({
			tripId: tripId,
			stop: {type: 'stop', id: 'one'},
			when,
			delay,
			_tQuery: tQuery
		})
	}

	const onFirst = (dep) => {
		t.deepEqual(dep, {
			tripId: 'a',
			stop: {type: 'stop', id: 'one'},
			when: DAY,
			delay: 0,
			_tQuery: 4 * MINUTE
		})
	}
	const onSecond = (dep) => {
		t.deepEqual(dep, {
			tripId: 'b',
			stop: {type: 'stop', id: 'one'},
			when: DAY + 30,
			delay: 30,
			_tQuery: 3 * MINUTE
		})
	}

	writeDep(1 * MINUTE, 'a', DAY + 30, 30)
	writeDep(1 * MINUTE, 'b', DAY + 10, 10)
	writeDep(2 * MINUTE, 'b', DAY + 20, 20)
	writeDep(3 * MINUTE, 'b', DAY + 30, 30) // b went delayed
	writeDep(4 * MINUTE, 'a', DAY, 0) // a is on time again
	s.end()

	t.plan(2 + 1)
	let chunk = 0
	s.on('data', (dep) => {
		chunk++
		if (chunk === 1) onFirst(dep)
		else if (chunk === 2) onSecond(dep)
		else t.fail('more than 2 departures emitted')
	})
	s.on('end', () => t.pass('stream ended'))
})
