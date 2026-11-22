#!/usr/bin/env bash
set -euo pipefail

repo="repos/$GITHUB_REPOSITORY"
comments="$repo/issues/$PR_NUMBER/comments"
marker="<!-- ci-test-report:$GITHUB_WORKFLOW -->"

existing=$(gh api --paginate "$comments?per_page=100" | jq -sc --arg marker "$marker" '
	[.[][] | select(.user.login == "github-actions[bot]" and (.body // "" | startswith($marker)))]
	| last // {}')
existing_run=$(jq -r '
	(.body // "") | split("\n")[1] // ""
	| [capture("^<!-- run: (?<number>[0-9]+) -->$").number | tonumber][0] // 0' <<< "$existing")
if (( existing_run > GITHUB_RUN_NUMBER )); then
	exit 0
fi

current_pr=$(gh api "$repo/pulls/$PR_NUMBER" --jq '[.state, .head.sha] | join(" ")')
if [[ "$current_pr" != "open $COMMIT" ]]; then
	exit 0
fi

comment_id=$(jq -r '.id // empty' <<< "$existing")
if [[ -n "$comment_id" ]]; then
	method=PATCH
	endpoint="$repo/issues/comments/$comment_id"
else
	method=POST
	endpoint="$comments"
fi

{
	printf '%s\n<!-- run: %s -->\n\n' "$marker" "$GITHUB_RUN_NUMBER"
	cat "$GITHUB_STEP_SUMMARY"
} | jq -Rs '{body: .}' | gh api --method "$method" "$endpoint" --input - > /dev/null
