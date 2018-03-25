'use strict'

const {EventEmitter} = require('events')
const _level = require('level')

const record = (dbPath, monitor, level = _level) => {
	const out = new EventEmitter()
	out.stop = () => {}

	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		if (err) {
			out.emit('error', err)
			return
		}

		monitor.on('error', err => out.emit('error'))

		let batch = []
		monitor.on('data', (dep) => {
			const t = Math.round(new Date(dep.when) / 1000)
			batch.push({
				type: 'put',
				key: [dep.line.id, dep.station.id, t].join('-'),
				value: dep
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
