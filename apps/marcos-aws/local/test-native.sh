#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

. apps/marcos-aws/local/emulator-native.sh

set -a
. packages/marcos-core/.env.test
set +a

bun apps/marcos-aws/local/seed.ts
if [[ -n ${1:-} ]]; then
	mkdir -p "$1"
	cd packages/marcos-core
	bun test test/read --reporter=junit --reporter-outfile="$1/read.xml"
	bun test test/write --reporter=junit --reporter-outfile="$1/write.xml"
else
	bun run --cwd packages/marcos-core test
fi
