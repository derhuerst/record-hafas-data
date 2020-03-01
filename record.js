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
todo
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`record-hafas-data v${pkg.version}\n`)
	process.exit(0)
}

// todo
