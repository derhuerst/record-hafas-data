#!/bin/bash
set -e
set -o pipefail

expected_hash="fb8ad7465f6a3c8272c5bccec454c1d3be3e3654"

cd $(dirname $0)

echo 'importing into test.ldb'
rm -rf test.ldb
cat ../example/vbb-deps.ndjson \
	| ../record.js test.ldb -e departure,stopover

echo 'exporting SQL from test.ldb, importing into test.sqlite'
rm -f test.sqlite
../export-sql.js test.ldb \
	| sqlite3 -bail test.sqlite

hash="$(shasum test.sqlite | cut -d' ' -f1)"
[[ "$hash" = "$expected_hash" ]] && exit 0
echo "unexpected test.sqlite hash: $hash"
exit 1
