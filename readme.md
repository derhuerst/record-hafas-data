# hafas-record-delays

[![Greenkeeper badge](https://badges.greenkeeper.io/derhuerst/hafas-record-delays.svg)](https://greenkeeper.io/)

**Record delays from [`hafas-monitor-departures`](https://github.com/derhuerst/hafas-monitor-departures) into a [LevelDB](http://leveldb.org).**

[![npm version](https://img.shields.io/npm/v/hafas-record-delays.svg)](https://www.npmjs.com/package/hafas-record-delays)
[![build status](https://api.travis-ci.org/derhuerst/hafas-record-delays.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-record-delays)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-record-delays.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

```shell
npm install hafas-record-delays
```


## Usage

```js
const recordDelays = require('hafas-record-delays')

const monitor = … // create hafas-monitor-departures stream somehow

const recorder = recordDelays('path/to/level-db.ldb', monitor)
recorder.on('error', console.error)
recorder.on('stats', console.log)
```

The `stats` event comes from [`hafas-monitor-departures`](https://github.com/derhuerst/hafas-monitor-departures).


## Contributing

If you have a question or have difficulties using `hafas-record-delays`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-record-delays/issues).
