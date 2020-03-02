# record-hafas-data

**CLI tool to record data from [`monitor-hafas-cli@2`](https://github.com/derhuerst/monitor-hafas-cli) into a [LevelDB](http://leveldb.org).**

[![npm version](https://img.shields.io/npm/v/record-hafas-data.svg)](https://www.npmjs.com/package/record-hafas-data)
[![build status](https://api.travis-ci.org/derhuerst/record-hafas-data.svg?branch=master)](https://travis-ci.org/derhuerst/record-hafas-data)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/record-hafas-data.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

```shell
npm install record-hafas-data
```


## Usage

```
Usage:
	monitor-hafas … | record-hafas-data <path-to-leveldb>
Supported monitor-hafas-cli events:
	departure, stopover, trip
Examples:
	monitor-hafas vbb-hafas departure stations \
		900000100001,900000100003 | record-hafas-data vbb-deps.ldb
	monitor-hafas oebb-hafas stopover bbox \
		52.6 13.3 52.3 13.6 | record-hafas-data oebb-stopovers.ldb
```

```
Usage:
	export-hafas-data-as-sql <path-to-leveldb> [event types]
Examples:
	export-hafas-data-as-sql db.ldb departure,stopover >export.sql
```


## Related

- [`monitor-hafas-cli`](https://github.com/derhuerst/monitor-hafas-cli) – Monitor any HAFAS endpoint from the command line.


## Contributing

If you have a question or have difficulties using `record-hafas-data`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/record-hafas-data/issues).
