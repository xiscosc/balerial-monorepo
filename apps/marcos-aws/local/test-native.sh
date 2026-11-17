#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

if ! command -v aws-emulator >/dev/null; then
	package=$(mktemp --suffix=.deb)
	curl -fsSLo "$package" "https://downloads.aws.com/aws-emulator/packages/aws-emulator/LTS/latest/aws-emulator_$(dpkg --print-architecture).deb"
	sudo apt-get install -y "$package"
fi

aws-emulator -p 9297 --auth off --telemetry off &
emulator=$!
trap 'kill $emulator' EXIT

for _ in $(seq 30); do
	curl -sfk https://127.0.0.1:9297/__admin/health >/dev/null && break
	sleep 1
done

set -a
. packages/marcos-core/.env.test
set +a

bun apps/marcos-aws/local/seed.ts
bun run --cwd packages/marcos-core test
