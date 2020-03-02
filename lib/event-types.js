'use strict'

const {format: formatSql} = require('sqlstring')
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

const V = DATA_VERSION
const sqlSchemas = Object.assign(Object.create(null), {
	departure: `
CREATE TABLE IF NOT EXISTS departures_${V} (
	id CHARACTER(40) PRIMARY KEY NOT NULL,
	t_query INT NOT NULL,
	stop_id CHARACTER(40) NOT NULL,
	station_id CHARACTER(40),
	"when" INT,
	planned_when INT,
	delay INT,
	line_id CHARACTER(40) NOT NULL,
	line_name CHARACTER(40) NOT NULL,
	trip_id CHARACTER(40) NOT NULL,
	cancelled,
	data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS departures_${V}_t_query_idx
	ON departures_${V} (t_query);
CREATE INDEX IF NOT EXISTS departures_${V}_stop_id_idx
	ON departures_${V} (stop_id);
CREATE INDEX IF NOT EXISTS departures_${V}_station_id_idx
	ON departures_${V} (station_id);
CREATE INDEX IF NOT EXISTS departures_${V}_when_idx
	ON departures_${V} ("when");
CREATE INDEX IF NOT EXISTS departures_${V}_planned_when_idx
	ON departures_${V} (planned_when);
CREATE INDEX IF NOT EXISTS departures_${V}_delay_idx
	ON departures_${V} (delay);
CREATE INDEX IF NOT EXISTS departures_${V}_line_name_idx
	ON departures_${V} (line_name);
CREATE INDEX IF NOT EXISTS departures_${V}_trip_id_idx
	ON departures_${V} (trip_id);
CREATE INDEX IF NOT EXISTS departures_${V}_cancelled_idx
	ON departures_${V} (cancelled);
`,
	// todo: stopover, trip
})

const WRITE_DEPARTURE = `
INSERT INTO departures_${V} (
	id,
	t_query,
	stop_id,
	station_id,
	"when",
	planned_when,
	delay,
	line_id,
	line_name,
	trip_id,
	cancelled,
	data
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (id) DO UPDATE SET
	t_query = excluded.t_query,
	stop_id = excluded.stop_id,
	station_id = excluded.station_id,
	"when" = excluded."when",
	planned_when = excluded.planned_when,
	delay = excluded.delay,
	line_id = excluded.line_id,
	line_name = excluded.line_name,
	trip_id = excluded.trip_id,
	cancelled = excluded.cancelled,
	data = excluded.data
;` // todo: option for `ON CONFLICT IGNORE` & `ON CONFLICT FAIL`?

const exportSql = Object.assign(Object.create(null), {
	departure: ([tQuery, dep]) => {
		return formatSql(WRITE_DEPARTURE, [
			dep.stop.id + '-' + dep.tripId, // primary key
			new Date(tQuery),
			dep.stop.id,
			dep.stop.station && dep.stop.station.id || null,
			dep.when ? new Date(dep.when) : null,
			dep.planned_when ? new Date(dep.plannedWhen) : null,
			'number' === typeof dep.delay ? dep.delay : null,
			dep.line.id,
			dep.line.name,
			dep.tripId,
			dep.cancelled ? 1 : null,
			JSON.stringify(dep)
		])
	},
	// todo: stopover, trip
})

module.exports = {
	dbPrefixes,
	recordCommands,
	sqlSchemas,
	exportSql,
}
