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
	monitor-hafas … | record-hafas-data <path-to-leveldb>
Supported monitor-hafas-cli events:
	departure, stopover, trip
Examples:
	monitor-hafas vbb-hafas departure stations \\
		900000100001,900000100003 | record-hafas-data vbb-deps.ldb
	monitor-hafas oebb-hafas stopover bbox \\
		52.6 13.3 52.3 13.6 | record-hafas-data oebb-stopovers.ldb
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`record-hafas-data v${pkg.version}\n`)
	process.exit(0)
}

const pump = require('pump')
const {parse} = require('ndjson')
const record = require('.')

const showError = (err) => {
	if (!err) return;
	console.error(err)
	process.exit(1)
}

const pathToLeveldb = argv._[0]
if (!pathToLeveldb) showError('Missing path to the LevelDB.')

pump(
	process.stdin,
	parse(),
	record(pathToLeveldb),
	showError
)
