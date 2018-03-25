'use strict'

const {EventEmitter} = require('events')
const level = require('level')
const monitor = require('hafas-monitor-departures')

const record = (hafas, dbPath, stations, interval) => {
	const out = new EventEmitter()
	out.stop = () => {}

	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		if (err) {
			out.emit('error', err)
			return
		}

		const deps = monitor(hafas, stations, interval)
		deps.on('error', err => out.emit('error'))

		let batch = []
		deps.on('data', (dep) => {
			const t = Math.round(new Date(dep.when) / 1000)
			batch.push({
				type: 'put',
				key: [dep.line.id, dep.station.id, t].join('-'),
				value: JSON.stringify(dep)
			})

			if (batch.length === 10) {
				db.batch(batch, (err) => {
					if (err) out.emit('error', err)
				})
				batch = []
			}
		})

		out.stop = () => {
			deps.stop()
		}
		deps.on('stats', (stats) => {
			out.emit('stats', stats)
		})
	})

	return out
}

module.exports = record
