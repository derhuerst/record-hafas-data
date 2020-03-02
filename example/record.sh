#!/bin/bash
set -e
set -o pipefail

cd $(dirname $0)

# ./node_modules/.bin/monitor-hafas ./vbb-hafas.js departure,stopover \
# 	stations 900000100001,900000100003
# ./node_modules/.bin/monitor-hafas ./vbb-hafas.js stopover,position \
# 	bbox 52.6 13.3 52.3 13.6

rm -rf vbb-deps.ldb
cat ./vbb-deps.ndjson | ../record.js vbb-deps.ldb -e departure,stopover
