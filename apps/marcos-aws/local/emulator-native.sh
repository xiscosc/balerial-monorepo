#!/usr/bin/env bash
# Source this: installs the AWS Emulator from AWS's Debian package if missing, starts it on 9297 in the
# background, stops it when the calling script exits, and waits until it is healthy.
# Used in CI instead of the Docker image from docker-compose.yml.

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
