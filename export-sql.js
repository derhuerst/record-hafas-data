'use strict'

const _level = require('level')
const pump = require('pump')
const through2 = require('through2')
const {format} = require('sqlstring')
const NAMESPACE = require('./lib/namespace')

// todo: `gt`/`lt` options?
const exportSql = (dbPath, out, tableName = 'delays', level = _level) => {
	const schema = `\
	CREATE TABLE IF NOT EXISTS ${tableName}_${NAMESPACE} (
		id CHARACTER(40) PRIMARY KEY NOT NULL,
		t_query INT NOT NULL,
		stop_id CHARACTER(40) NOT NULL,
		station_id CHARACTER(40),
		"when" INT,
		delay INT,
		line_id CHARACTER(40) NOT NULL,
		line_name CHARACTER(40) NOT NULL,
		trip_id CHARACTER(40) NOT NULL,
		cancelled INT NOT NULL,
		data TEXT NOT NULL
	);`
	// todo
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_t_query_idx
	// 	ON ${TABLE_NAME} (t_query);
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_stop_id_idx
	// 	ON ${TABLE_NAME} (stop_id);
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_station_id_idx
	// 	ON ${TABLE_NAME} (station_id);
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_when_idx
	// 	ON ${TABLE_NAME} ("when");
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_delay_idx
	// 	ON ${TABLE_NAME} (delay);
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_line_name_idx
	// 	ON ${TABLE_NAME} (line_name);
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_trip_id_idx
	// 	ON ${TABLE_NAME} (trip_id);
	// CREATE INDEX IF NOT EXISTS ${TABLE_NAME}_cancelled_idx
	// 	ON ${TABLE_NAME} (cancelled);`
	out.write(schema)

	const write = `
	INSERT INTO ${tableName}_${NAMESPACE}
	(id, t_query, stop_id, station_id, "when", delay, line_id, line_name, trip_id, cancelled, data)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	level(dbPath, {valueEncoding: 'json'}, (err, db) => {
		const onError = (err) => {
			if (err) out.emit('error', err)
		}
		if (err) return onError(err)

		const convert = ([tQuery, dep], _, cb) => {
			cb(null, format(write, [
				dep.tripId, // primary key
				new Date(tQuery),
				dep.stop.id,
				dep.stop.station && dep.stop.station.id || null,
				dep.when ? new Date(dep.when) : null,
				'number' === typeof dep.delay ? dep.delay : null,
				dep.line.id,
				dep.line.name,
				dep.tripId,
				dep.cancelled ? 1 : null,
				JSON.stringify(dep)
			]))
		}

		pump(
			db.createValueStream({
				gt: NAMESPACE + '-',
				lt: NAMESPACE + '-' + String.fromCharCode(0xFFFF)
			}),
			through2.obj(convert),
			out,
			onError
		)
	})

	// todo: expose abort fn
}

module.exports = exportSql
