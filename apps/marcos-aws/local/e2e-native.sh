#!/usr/bin/env bash
# CI runner for the apps/marcos e2e tests. Locally use `bun run test:e2e` (Docker) instead.
# Needs Docker for the mock OIDC server and Playwright's Chromium (`bunx playwright install chromium`).
set -euo pipefail
cd "$(dirname "$0")/../../.."

. apps/marcos-aws/local/emulator-native.sh

# Same image and config as the `oidc` service in docker-compose.yml
oidc=$(docker run -d --rm -p 127.0.0.1:9298:8080 \
	-e JSON_CONFIG_PATH=/config/oidc.json \
	-v "$PWD/apps/marcos-aws/local/oidc.json:/config/oidc.json:ro" \
	ghcr.io/navikt/mock-oauth2-server:6.1.5)
trap 'kill $emulator; docker stop "$oidc" >/dev/null' EXIT

for _ in $(seq 30); do
	curl -sf http://127.0.0.1:9298/default/.well-known/openid-configuration >/dev/null && break
	sleep 1
done

bun run e2e:seed
bun run --cwd apps/marcos test:e2e
