'use strict'

const _level = require('level')
const {EventEmitter} = require('events')
const NAMESPACE = require('./lib/namespace')

const record = (dbPath, monitor, level = _level) => {
	const out = new EventEmitter()
	// todo: fix race condition (calling code vs level)
	out.stop = () => {}

	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		if (err) return out.emit('error', err)

		let batch = []
		const onDeparture = (dep) => {
			const tQuery = dep[monitor.tQuery]
			batch.push({
				type: 'put',
				key: [NAMESPACE, dep.line.id, dep.stop.id, tQuery].join('-'),
				value: [tQuery, dep]
			})

			if (batch.length >= 10) {
				db.batch(batch, (err) => {
					if (err) out.emit('error', err)
				})
				batch = []
			}
		}

		const onStats = (stats) => {
			out.emit('stats', stats)
		}

		monitor.on('error', err => out.emit('error', err))
		monitor.on('departure', onDeparture)
		monitor.on('stats', onStats)
		out.stop = () => {
			monitor.removeListener('departure', onDeparture)
			monitor.removeListener('stats', onStats)
		}
	})

	return out
}

module.exports = record
