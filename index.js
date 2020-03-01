'use strict'

const _level = require('level')
const {Writable} = require('stream')
const DATA_VERSION = require('./lib/data-version')
const pkg = require('./package.json')

// event type -> fn dbCommand(tQuery, data)
const EVENT_TYPES = Object.assign(Object.create(null), {
	departure: (tQuery, dep) => ({
		type: 'put',
		key: [
			DATA_VERSION, 'dep',
			dep.line.id, // todo: what if `dep.line` is falsy?
			dep.stop.id, // todo: what if `dep.stop` is falsy?
			tQuery
		].join('-'),
		value: [tQuery, dep]
	}),
	stopover: (tQuery, st) => ({
		type: 'put',
		key: [
			DATA_VERSION, 'stpvr',
			st.tripId,
			st.stop.id, // todo: what if `st.stop` is falsy?
			tQuery
		].join('-'),
		value: [tQuery, st]
	}),
	trip: (tQuery, trip) => ({
		type: 'put',
		key: [
			DATA_VERSION, 'trip',
			trip.id,
			tQuery
		].join('-'),
		value: [tQuery, trip]
	}),
})

const record = (dbPath, opt = {}) => {
	const {
		level,
		valueEncoding,
	} = {
		level: _level,
		valueEncoding: 'json',
		...opt
	}

	const pDb = new Promise((resolve, reject) => {
		level(dbPath, {valueEncoding}, (err, db) => {
			if (err) reject(err)
			else resolve(db)
		})
	})

	let batch = []
	const writeRow = (row) => {
		if (!Array.isArray(row)) {
			const err = new Error('invalid input data: each row must be an array')
			err.row = row
			throw err
		}
		const [dataVersion, evType, data, tQuery] = row

		if (dataVersion !== DATA_VERSION) {
			const err = new Error([
				'incompatible data version:',
				`${pkg.name} only supports ${DATA_VERSION},`,
				`input data has ${dataVersion}`
			].join(' '))
			err.row = row
			throw err
		}

		const dbCommand = EVENT_TYPES[evType]
		if (!dbCommand) {
			const err = new Error([
				'incompatible event type:',
				`${pkg.name} only supports ${Object.keys(EVENT_TYPES).join('/')},`,
				`input data has ${evType}`
			].join(' '))
			err.row = row
			throw err
		}

		if (!Number.isInteger(tQuery)) {
			const err = new Error('tQuery (row[3]) must be an integer')
			err.row = row
			throw err
		}

		const cmd = dbCommand(tQuery, data)
		batch.push(cmd)
		if (batch.length >= 10) {
			const _batch = batch
			pDb.then((db) => {
				db.batch(_batch, (err) => {
					if (err) out.destroy(err)
				})
			})
			batch = []
		}
	}

	const out = new Writable({
		objectMode: true,
		write: (row, _, cb) => {
			writeRow(row)
			cb()
		},
		writev: (chunks, cb) => {
			for (const {chunk: row} of chunks) writeRow(row)
			cb()
		},
		final: (cb) => {
			db.close(cb)
		}
	})
	pDb.catch(err => out.destroy(err))

	return out
}

record.EVENT_TYPES = Object.keys(EVENT_TYPES)
module.exports = record
