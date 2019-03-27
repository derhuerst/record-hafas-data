'use strict'

const {EventEmitter} = require('events')
const _level = require('level')
const {diff} = require('semver')

const VERSION_KEY = 'hafas-delays-version'
const VERSION = require('./package.json').version

const isCompatibleVersion = dbVersion => {
	const bump = diff(dbVersion, VERSION)
	return bump === null || ['minor', 'patch'].includes(bump)
}

// todo: move to an npm lib
const ensureCorrectVersion = (db, cb) => {
	db.get(VERSION_KEY, (err, dbVersion) => {
		if (err && !err.notFound) return cb(err)
		if (err && err.notFound) return db.put(VERSION_KEY, VERSION, cb)
		dbVersion = dbVersion.toString('utf8')

		// hafas-record-delays <= 1.0.1 didn't put a version
		if (err && err.notFound) {
			err = null
			dbVersion = '0.0.0'
		}
		if (!isCompatibleVersion(dbVersion)) {
			const err = new Error(`DB version ${dbVersion} is incompatible with version ${VERSION}`)
			err.dbVersion = dbVersion
			err.expectedVersion = VERSION
			return cb(err)
		}
		cb()
	})
}

const openDb = (level, dbPath, cb) => {
	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		if (err) return cb(err)
		ensureCorrectVersion(db, (err) => {
			if (err) {
				db.close()
				cb(err, db)
			}
			else cb(null, db)
		})
	})
}

const record = (dbPath, monitor, level = _level) => {
	const out = new EventEmitter()
	out.stop = () => {}

	openDb(level, dbPath, (err, db) => {
		if (err) return out.emit('error', err)

		monitor.on('error', err => out.emit('error', err))

		let batch = []
		monitor.on('data', (dep) => {
			const t = Math.round(new Date(dep.when) / 1000)
			batch.push({
				type: 'put',
				key: [dep.line.id, dep.stop.id, t].join('-'),
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
