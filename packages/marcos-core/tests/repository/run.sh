#!/usr/bin/env bash
set -euo pipefail

bunx floci >/dev/null 2>&1 &
floci_pid=$!

cleanup() {
	kill "$floci_pid" >/dev/null 2>&1 || true
	wait "$floci_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

for _ in {1..60}; do
	if (echo > /dev/tcp/127.0.0.1/4566) >/dev/null 2>&1; then
		bun test tests/repository
		exit $?
	fi
	if ! kill -0 "$floci_pid" >/dev/null 2>&1; then
		echo 'Floci exited before its AWS endpoint became ready.' >&2
		exit 1
	fi
	sleep 0.25
done

echo 'Floci did not start within 15 seconds' >&2
exit 1
