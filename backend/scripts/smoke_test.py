#!/usr/bin/env python
"""Quick end-to-end smoke test against a running backend (default :8000)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
FAILURES: list[str] = []


def call(method: str, path: str, body=None, token: str | None = None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{BASE}{path}", data=data, method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as exc:
        payload = exc.read()
        try:
            return exc.code, json.loads(payload or b"{}")
        except json.JSONDecodeError:
            return exc.code, {"raw": payload[:200].decode(errors="ignore")}


def check(label: str, condition: bool, extra="") -> None:
    mark = "PASS" if condition else "FAIL"
    print(f"[{mark}] {label} {extra}")
    if not condition:
        FAILURES.append(label)


def main() -> None:
    status, body = call("GET", "/health")
    check("GET /health", status == 200 and body.get("status") == "ok")

    status, body = call("GET", "/api/jobs")
    check("unauthenticated /api/jobs -> 401", status == 401)

    status, body = call(
        "POST",
        "/api/auth/login",
        {"email": "demo@example.com", "password": "Demo123!"},
    )
    check("login demo user", status == 200, f"status={status}")
    if status != 200:
        print(body)
        return
    token = body["access_token"]

    status, me = call("GET", "/api/auth/me", token=token)
    check("GET /api/auth/me", status == 200 and me["email"] == "demo@example.com")

    status, jobs = call("GET", "/api/jobs?limit=5", token=token)
    check("GET /api/jobs", status == 200 and jobs["page_meta"]["total"] > 0,
          f"total={jobs.get('page_meta', {}).get('total')}")

    job_id = jobs["items"][0]["id"]

    status, created = call(
        "POST", "/api/jobs", {"title": "Smoke Test Role", "status": "saved"}, token
    )
    check("POST /api/jobs", status == 201, f"status={status}")
    smoke_id = created.get("id")

    status, patched = call(
        "PATCH", f"/api/jobs/{smoke_id}", {"priority": "high"}, token
    )
    check("PATCH /api/jobs/{id}", status == 200 and patched.get("priority") == "high")

    status, app = call(
        "POST",
        "/api/applications",
        {"job_id": smoke_id, "status": "applied"},
        token,
    )
    check("POST /api/applications", status == 201, f"status={status}")
    application_id = app.get("id")

    status, moved = call(
        "PATCH", f"/api/applications/{application_id}", {"status": "interview"}, token
    )
    check(
        "PATCH application status (kanban)",
        status == 200 and moved["status"] == "interview" and len(moved["history"]) == 2,
    )

    status, analysis = call("POST", f"/api/ai/jobs/{job_id}/analyze", {}, token)
    check("POST /api/ai/jobs/{id}/analyze", status == 200 and analysis.get("summary"),
          f"provider={analysis.get('provider')}")
    status, cached = call("GET", f"/api/ai/jobs/{job_id}/analysis", token=token)
    check("cached analysis returned", status == 200 and cached.get("summary"))

    status, match = call("POST", f"/api/ai/jobs/{job_id}/match", {}, token)
    check(
        "POST /api/ai/jobs/{id}/match",
        status == 200 and 0 <= match.get("match_score", -1) <= 100,
        f"score={match.get('match_score')}",
    )

    status, prep = call("POST", f"/api/ai/jobs/{job_id}/interview-prep", {}, token)
    check(
        "POST /api/ai/jobs/{id}/interview-prep",
        status == 200 and prep.get("technical_questions"),
    )

    status, tips = call(
        "POST", f"/api/ai/jobs/{job_id}/application-suggestions", {}, token
    )
    check("POST application-suggestions", status == 200 and tips.get("cover_letter_outline"))

    status, dash = call("GET", "/api/analytics/dashboard", token=token)
    check(
        "GET /api/analytics/dashboard",
        status == 200 and dash["stats"]["total_jobs"] > 0,
        f"jobs={dash.get('stats', {}).get('total_jobs')}",
    )

    status, overview = call("GET", "/api/analytics/overview", token=token)
    check("GET /api/analytics/overview", status == 200)

    for path in ["/api/analytics/status", "/api/analytics/sources", "/api/analytics/applications"]:
        status, _ = call("GET", path, token=token)
        check(f"GET {path}", status == 200)

    status, results = call("GET", "/api/search?q=AI", token=token)
    check("GET /api/search", status == 200 and "jobs" in results)

    status, companies = call("GET", "/api/companies", token=token)
    check("GET /api/companies", status == 200 and companies["page_meta"]["total"] >= 4)

    status, contacts = call("GET", "/api/contacts", token=token)
    check("GET /api/contacts", status == 200 and contacts["page_meta"]["total"] >= 3)

    status, resumes = call("GET", "/api/resumes", token=token)
    check("GET /api/resumes", status == 200 and len(resumes) >= 2)

    status, interviews = call("GET", "/api/interviews", token=token)
    check("GET /api/interviews", status == 200 and interviews["page_meta"]["total"] >= 2)

    status, tasks = call("GET", "/api/tasks", token=token)
    check("GET /api/tasks", status == 200 and tasks["page_meta"]["total"] >= 3)

    # second user cannot touch the first user's job
    status, other = call(
        "POST", "/api/auth/register",
        {"name": "Other User", "email": "smoke-other@example.com", "password": "Other1234"},
        )
    if status == 409:
        status, other = call(
            "POST", "/api/auth/login",
            {"email": "smoke-other@example.com", "password": "Other1234"},
        )
    other_token = other["access_token"]
    status, _ = call("GET", f"/api/jobs/{job_id}", token=other_token)
    check("cross-user job access -> 404", status == 404, f"status={status}")

    # cleanup smoke artifacts
    call("DELETE", f"/api/applications/{application_id}", token=token)
    call("DELETE", f"/api/jobs/{smoke_id}", token=token)

    print()
    if FAILURES:
        print(f"{len(FAILURES)} check(s) FAILED: {FAILURES}")
        sys.exit(1)
    print("All smoke checks passed.")


if __name__ == "__main__":
    main()
