'use strict'

const _level = require('level')
const {Writable} = require('stream')
const {recordCommands} = require('./lib/event-types')
const DATA_VERSION = require('./lib/data-version')
const pkg = require('./package.json')

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
				`incompatible data version \`${dataVersion}\``,
				`${pkg.name} only supports ${DATA_VERSION},`
			].join(' '))
			err.row = row
			throw err
		}

		const dbCommand = recordCommands[evType]
		if (!dbCommand) {
			const err = new Error([
				`incompatible event type \`${evType}\``,
				`${pkg.name} only supports ${Object.keys(recordCommands).join('/')},`
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

record.EVENT_TYPES = Object.keys(recordCommands)
module.exports = record
