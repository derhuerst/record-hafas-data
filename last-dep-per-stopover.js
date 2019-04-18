'use strict'

const {Transform} = require('stream')

const DAY = 24 * 60 * 60 * 1000

const createLastDepPerStopoverStream = (trackStopoversFor = 5 * DAY) => {
	const lastDeps = new Map() // by tripId-stationId

	const onDep = (dep) => {
		const {tripId, _tQuery} = dep
		const stopId = dep.stop.id
		if (!tripId || !stopId || !_tQuery) return null // todo

		const sig = tripId + '-' + stopId
		const otherDep = lastDeps.get(sig)
		// todo: what if the latest version of a departure doesn't have a delay anymore,
		// but previous versions have?
		if (otherDep === undefined || _tQuery > otherDep._tQuery) lastDeps.set(sig, dep)

		// if (otherDep === undefined) lastDeps.set(sig, dep)
		// else {
		// 	const d = _tQuery - otherDep._tQuery
		// 	if (d > trackStopoversFor) out.push(otherDep)
		// 	lastDeps.set(sig, dep)
		// }

		// if (++i % 10000 === 0) prune(dep._tQuery)
	}

	// const prune = (t) => {
	// 	for (const [_, dep] of lastDeps.entries()) out.push(dep)
	// }

	const out = new Transform({
		objectMode: true,
		write: (dep, _, cb) => {
			onDep(dep)
			cb()
		},
		writev: (deps, _, cb) => {
			for (let i = 0; i < deps.length; i++) onDep(deps[i])
			cb()
		},
		flush: (cb) => {
			for (const [_, dep] of lastDeps.entries()) out.push(dep)
			cb()
		}
	})
	return out
}

module.exports = createLastDepPerStopoverStream
