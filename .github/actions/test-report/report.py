import html
import json
import os
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path


def playwright_results(path, problems):
    report = json.loads(path.read_text(encoding="utf-8"))

    def read_suite(suite, parents):
        for spec in suite.get("specs", []):
            for test in spec["tests"]:
                status = {"unexpected": "Failed", "flaky": "Flaky"}.get(test["status"])
                if status:
                    title = " › ".join([*parents, spec["title"]])
                    project = f"[{test['projectName']}] " if test.get("projectName") else ""
                    location = f"{spec['file']}:{spec['line']}"
                    problems[status].append(f"{project}{title} ({location})")
        for child in suite.get("suites", []):
            titles = [*parents, child["title"]] if child.get("title") else parents
            read_suite(child, titles)

    for suite in report["suites"]:
        read_suite(suite, [])
    stats = report["stats"]
    return {
        "Passed": stats["expected"],
        "Failed": stats["unexpected"],
        "Flaky": stats["flaky"],
        "Skipped": stats["skipped"],
    }


def junit_results(files, problems):
    counts = dict.fromkeys(("Passed", "Failed", "Flaky", "Skipped"), 0)
    for path in files:
        for test in ET.parse(path).iter("testcase"):
            tags = {child.tag for child in test}
            if tags & {"failure", "error", "rerunFailure", "rerunError"}:
                status = "Failed"
            elif tags & {"flakyFailure", "flakyError"}:
                status = "Flaky"
            elif "skipped" in tags:
                status = "Skipped"
            else:
                status = "Passed"
            counts[status] += 1
            if status in problems:
                title = " › ".join(filter(None, (test.get("classname"), test.get("name"))))
                location = ":".join(filter(None, (test.get("file"), test.get("line"))))
                problems[status].append(f"{title} ({location})" if location else title)
    return counts


def markdown(text):
    return re.sub(r"([\\`*_\[\]~])", r"\\\1", html.escape(text, quote=False))


def compact(text, limit):
    text = " ".join(text.split())
    return text if len(text) <= limit else f"{text[:limit - 1]}…"


def details(tests, limit, formatter):
    lines = [f"- {formatter(test)}" for test in tests[:limit]]
    if len(tests) > limit:
        lines.append(f"- {len(tests) - limit} more")
    return lines


def main():
    env = os.environ
    path = Path(env["RESULTS_PATH"])
    problems = {"Failed": [], "Flaky": []}
    counts = None
    note = ""
    if env["RESULTS_FORMAT"] == "playwright" and path.is_file():
        counts = playwright_results(path, problems)
    elif env["RESULTS_FORMAT"] == "junit":
        files = sorted(path.glob("*.xml"))
        if files:
            counts = junit_results(files, problems)
            if len(files) == 1:
                note = f"Only the {files[0].stem} suite produced a report."

    status = env["STATUS"]
    if status == "success" and counts and counts["Flaky"]:
        result = "⚠️ Passed with flaky tests"
    else:
        result = {"success": "✅ Passed", "failure": "❌ Failed", "cancelled": "⏹ Cancelled"}[status]
    if counts is None:
        note = "No test results available. See the workflow run for details."
    elif status == "failure" and not counts["Failed"]:
        note = " ".join(filter(None, (note, "See the workflow run for the failing step.")))

    title = f"{env['SUITE']} · {result}"
    branch = compact(env["BRANCH"], 150)
    context = f"{branch} · {env['COMMIT'][:7]}"
    if env["AUTHOR"]:
        context += f" · {env['AUTHOR']}"
    if env.get("STARTED_AT"):
        minutes, seconds = divmod(int(time.time()) - int(env["STARTED_AT"]), 60)
        context += f" · {minutes}m {seconds:02d}s"
    if env["PR_NUMBER"]:
        pr_title = compact(env["PR_TITLE"], 200)
        context += f"\nPR #{env['PR_NUMBER']} · {pr_title}"

    links = [("View run", env["RUN_URL"])]
    if env["PR_URL"]:
        links.append(("View pull request", env["PR_URL"]))
    if env["ARTIFACT_URL"]:
        links.append(("Download Playwright report", env["ARTIFACT_URL"]))

    summary = [f"## {title}", "", markdown(context).replace("\n", "  \n"), ""]
    slack_sections = [context]
    if counts is not None:
        summary.extend([
            "| Passed | Failed | Flaky | Skipped |",
            "| ---: | ---: | ---: | ---: |",
            "| " + " | ".join(map(str, counts.values())) + " |",
            "",
        ])
        slack_sections.append(" · ".join(f"{count} {name.lower()}" for name, count in counts.items()))
    if note:
        summary.extend([note, ""])
        slack_sections.append(note)
    for status, tests in problems.items():
        if tests:
            heading = f"{status} tests ({len(tests)})"
            summary.extend([f"### {heading}", "", *details(tests, 50, lambda test: markdown(compact(test, 500))), ""])
            slack_sections.append("\n".join([heading, *details(tests, 4, lambda test: compact(test, 240))]))
    summary.append(" · ".join(f"[{label}]({url})" for label, url in links))
    with Path(env["GITHUB_STEP_SUMMARY"]).open("a", encoding="utf-8") as output:
        output.write("\n".join(summary) + "\n")

    buttons = [
        {"type": "button", "text": {"type": "plain_text", "text": label}, "url": url}
        for label, url in links
    ]
    blocks = [{"type": "header", "text": {"type": "plain_text", "text": title}}]
    blocks.extend({"type": "section", "text": {"type": "plain_text", "text": text}} for text in slack_sections)
    blocks.append({"type": "actions", "elements": buttons})
    print(json.dumps({"text": "\n".join([title, *slack_sections]), "mrkdwn": False, "blocks": blocks}))


if __name__ == "__main__":
    main()
