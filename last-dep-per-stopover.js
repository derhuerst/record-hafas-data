'use strict'

const keepLastOfStreakStream = require('find-streaks/stream')

const DAY = 24 * 60 * 60 * 1000

const createLastDepPerStopoverStream = (trackStopoversFor = 5 * DAY) => {
	const bucket = ({tripId, stop}) => {
		if (!tripId || !stop || !stop.id) return null // todo
		return tripId + '-' + stop.id
	}

	const monotonic = dep => dep._tQuery

	return keepLastOfStreakStream(DAY, bucket, monotonic)
}

module.exports = createLastDepPerStopoverStream
