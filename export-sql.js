#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
	export-hafas-data-as-sql <path-to-leveldb> [event types]
Examples:
	export-hafas-data-as-sql db.ldb departure,stopover >export.sql
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`export-hafas-data-as-sql v${pkg.version}\n`)
	process.exit(0)
}

const {promisify} = require('util')
const pump = require('pump')
const through2 = require('through2')
const level = require('level')
const {sqlSchemas, exportSql, dbPrefixes} = require('./lib/event-types')
// const NAMESPACE = require('./lib/namespace')

const RANGE_END = String.fromCharCode(0xFFFF)

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const pPump = promisify(pump)

// todo: `gt`/`lt` options?
const generateSql = (db, eventType, out) => {
	const schema = sqlSchemas[eventType]
	const toSql = exportSql[eventType]
	const dbPrefix = dbPrefixes[eventType]
	if (!schema || !toSql || !dbPrefix) {
		throw new Error([
			`invalid/unknown event type \`${eventType}\``,
			'export-hafas-data-as-sql only supports',
			Object.keys(sqlSchemas).join('/')
		].join(' '))
	}

	out.write(schema)

	const transformRow = (val, _, cb) => {
		if (!Array.isArray(val)) {
			const err = new Error('DB value is not an array')
			// todo: expose DB key?
			err.val = val
			throw err
		}
		cb(null, toSql(val))
	}

	// todo: expose abort fn
	return pPump(
		db.createValueStream({
			gt: dbPrefix + '-',
			lt: dbPrefix + '-' + RANGE_END
		}),
		through2.obj(transformRow),
		out
	)
}

const pathToLeveldb = argv._[0]
if (!pathToLeveldb) showError('Missing path to the LevelDB.')

const eventTypes = argv._[1]
	? argv._[1].split(/,\s?/)
	: Object.keys(exportSql)
for (const eventType of eventTypes) {
	if (!(eventType in exportSql)) {
		showError([
			'invalid/unknown event type:',
			'export-hafas-data-as-sql only supports',
			Object.keys(exportSql).join('/')
		].join(' '))
	}
}

const db = level(pathToLeveldb, {valueEncoding: 'json'})

db.open().then(() => {
	let p = Promise.resolve()
	// chain all tasks
	eventTypes.forEach((eventType) => {
		p = p.then(() => {
			return generateSql(db, eventType, process.stdout)
		})
	})
	return p
})
.catch(showError)
