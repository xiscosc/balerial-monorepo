#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

. apps/marcos-aws/local/emulator-native.sh

set -a
. packages/marcos-core/.env.test
set +a

bun apps/marcos-aws/local/seed.ts
bun run --cwd packages/marcos-core test
