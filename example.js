'use strict'

const createDbHafas = require('db-hafas')
const createMonitor = require('hafas-monitor-departures')
const recordDelays = require('.')

const stations = [ // array of station ids
	'8000147', // Hamburg-Harburg
	'8000170' // Ulm Hbf
]
const interval = 2 * 1000 // 20s
const duration = 10 // each time, fetch departures for the next 10 min

const dbHafas = createDbHafas('hafas-record-delays example')
const monitor = createMonitor(dbHafas, stations, {interval, duration})

const recorder = recordDelays('example.ldb', monitor)
recorder.on('error', console.error)
recorder.on('stats', console.log)
