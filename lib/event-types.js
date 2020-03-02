'use strict'

const DATA_VERSION = require('./data-version')

// event type -> fn dbCommand(tQuery, data)
const dbPrefixes = Object.assign(Object.create(null), {
	departure: DATA_VERSION + '-dep',
	stopover: DATA_VERSION + '-stpvr',
	trip: DATA_VERSION + '-trip',
})

// event type -> fn dbCommand(tQuery, data)
const recordCommands = Object.assign(Object.create(null), {
	departure: (tQuery, dep) => ({
		type: 'put',
		key: [
			dbPrefixes.departure,
			dep.line.id, // todo: what if `dep.line` is falsy?
			dep.stop.id, // todo: what if `dep.stop` is falsy?
			tQuery
		].join('-'),
		value: [tQuery, dep]
	}),
	stopover: (tQuery, st) => ({
		type: 'put',
		key: [
			dbPrefixes.stopover,
			st.tripId,
			st.stop.id, // todo: what if `st.stop` is falsy?
			tQuery
		].join('-'),
		value: [tQuery, st]
	}),
	trip: (tQuery, trip) => ({
		type: 'put',
		key: [
			dbPrefixes.trip,
			trip.id,
			tQuery
		].join('-'),
		value: [tQuery, trip]
	}),
})

module.exports = {
	dbPrefixes,
	recordCommands,
}
