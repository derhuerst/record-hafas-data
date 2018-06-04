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

		monitor.on('error', err => out.emit('error', err))

		let batch = []
		monitor.on('data', (dep) => {
			if (!dep.station || !dep.station.id) {
				out.emit('error', new Error('invalid dep: missing dep.station.id'))
				return
			}
			if (!dep.journeyId) {
				out.emit('error', new Error('invalid dep: missing dep.journeyId'))
				return
			}

			const t = Math.round(new Date(dep.when) / 1000)
			batch.push({
				type: 'put',
				key: [
					dep.station.id,
					dep.journeyId
				].join(':'),
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
