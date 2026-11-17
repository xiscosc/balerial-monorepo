#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

paths=(packages/marcos-core packages/balerial-dynamo packages/balerial-s3 apps/marcos-aws/local bun.lock package.json)
previous="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -n "$previous" ] && git cat-file -e "$previous^{commit}" 2>/dev/null &&
	git diff --quiet "$previous" HEAD -- "${paths[@]}"; then
	echo "marcos-core unchanged since $previous, skipping tests"
	exit 0
fi

if ! command -v aws-emulator >/dev/null; then
	dnf install -y "https://downloads.aws.com/aws-emulator/packages/aws-emulator/LTS/latest/aws-emulator-$(uname -m).rpm"
fi

aws-emulator -p 9297 --auth off --telemetry off &
emulator=$!
trap 'kill $emulator' EXIT

for _ in $(seq 30); do
	curl -sfk https://127.0.0.1:9297/__admin/health >/dev/null && break
	sleep 1
done

bun --env-file=packages/marcos-core/.env.test apps/marcos-aws/local/seed.ts
bun run --cwd packages/marcos-core test
