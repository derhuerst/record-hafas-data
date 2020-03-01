'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const test = require('tape')

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

// todo
