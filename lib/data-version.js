'use strict'

const semverMajor = require('semver/functions/major')
const pkg = require('../package.json')

const DATA_VERSION = semverMajor(pkg.version)

module.exports = DATA_VERSION
