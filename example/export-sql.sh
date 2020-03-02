#!/bin/bash
set -e
set -o pipefail

cd $(dirname $0)

rm -f vbb-deps.sqlite
../export-sql.js vbb-deps.ldb | sqlite3 -bail vbb-deps.sqlite
