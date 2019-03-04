'use strict'

const _level = require('level')
const {EventEmitter} = require('events')
const NAMESPACE = require('./lib/namespace')

const record = (dbPath, monitor, level = _level) => {
	const out = new EventEmitter()
	out.stop = () => {}

	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		if (err) return out.emit('error', err)

		monitor.on('error', err => out.emit('error', err))

		let batch = []
		monitor.on('data', (dep) => {
			const tQuery = dep[monitor.tQuery]
			batch.push({
				type: 'put',
				key: [NAMESPACE, dep.line.id, dep.stop.id, tQuery].join('-'),
				value: [tQuery, dep]
			})

			if (batch.length === 10) {
				db.batch(batch, (err) => {
					if (err) out.emit('error', err)
				})
				batch = []
			}
		})

		out.stop = () => {
			monitor.stop()
		}
		monitor.on('stats', (stats) => {
			out.emit('stats', stats)
		})
	})

	return out
}

module.exports = record
