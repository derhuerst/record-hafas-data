#!/usr/bin/env node
'use strict'

const _level = require('level')
const pump = require('pump')
const through = require('through2')
const {stringify} = require('ndjson')
const NAMESPACE = require('./lib/namespace')

// todo: `gt`/`lt` options?
const exportNdjson = (dbPath, out, level = _level) => {
	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		const onError = (err) => {
			if (err) out.emit('error', err)
		}
		if (err) return onError(err)

		pump(
			db.createValueStream({
				gt: NAMESPACE + '-',
				lt: NAMESPACE + '-' + String.fromCharCode(0xFFFF)
			}),
			through.obj((val, _, cb) => cb(null, val[1])),
			stringify(),
			out,
			onError
		)
	})
}

module.exports = exportNdjson
