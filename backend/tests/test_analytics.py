from __future__ import annotations


def _seed_pipeline(client, user_a):
    """Create a small but realistic pipeline for dashboard assertions."""
    headers = user_a["headers"]
    company = client.post("/api/companies", headers=headers, json={"name": "Acme"}).json()

    job_ids = []
    for title, status, priority in [
        ("AI Engineer", "saved", "high"),
        ("Backend Engineer", "saved", "medium"),
        ("ML Engineer", "saved", "high"),
    ]:
        job = client.post(
            "/api/jobs",
            headers=headers,
            json={
                "title": title,
                "company_id": company["id"],
                "status": status,
                "priority": priority,
                "source": "LinkedIn",
                "location": "Remote",
            },
        ).json()
        job_ids.append(job["id"])

    for index, (job_id, status) in enumerate(
        [(job_ids[0], "applied"), (job_ids[1], "interview"), (job_ids[2], "rejected")]
    ):
        application = client.post(
            "/api/applications",
            headers=headers,
            json={"job_id": job_id, "status": status, "source": "LinkedIn"},
        ).json()
        if status == "interview":
            client.post(
                "/api/interviews",
                headers=headers,
                json={
                    "application_id": application["id"],
                    "type": "video",
                    "scheduled_at": "2099-01-15T10:00:00Z",
                    "duration": 45,
                    "interviewer": "Recruiter",
                },
            )
    client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Follow up", "due_date": "2099-01-10", "priority": "high"},
    )
    return job_ids


def test_dashboard_returns_real_stats(client, user_a):
    _seed_pipeline(client, user_a)
    response = client.get("/api/analytics/dashboard", headers=user_a["headers"])
    assert response.status_code == 200
    body = response.json()

    stats = body["stats"]
    assert stats["total_jobs"] == 3
    assert stats["total_applications"] == 3
    assert stats["rejected"] == 1
    assert stats["interviews"] == 1
    assert isinstance(stats["response_rate"], float)
    assert stats["avg_applications_per_week"] > 0

    assert len(body["applications_by_status"]) == 3
    assert body["jobs_by_source"][0]["key"] == "LinkedIn"
    assert body["jobs_by_source"][0]["count"] == 3
    assert body["jobs_by_company"][0]["label"] == "Acme"
    assert len(body["recent_applications"]) == 3
    assert len(body["upcoming_interviews"]) == 1
    assert len(body["follow_up_tasks"]) == 1
    # only the high-priority job still open in the pipeline qualifies
    assert len(body["high_priority_jobs"]) == 1
    assert body["high_priority_jobs"][0]["title"] == "AI Engineer"


def test_dashboard_is_empty_for_new_user(client, user_b):
    body = client.get("/api/analytics/dashboard", headers=user_b["headers"]).json()
    assert body["stats"]["total_jobs"] == 0
    assert body["stats"]["total_applications"] == 0
    assert body["recent_applications"] == []


def test_dashboard_series_is_daily(client, user_a):
    _seed_pipeline(client, user_a)
    body = client.get("/api/analytics/dashboard", headers=user_a["headers"]).json()
    assert len(body["applications_over_time"]) == 31  # last 30 days inclusive


def test_analytics_endpoints(client, user_a):
    _seed_pipeline(client, user_a)
    headers = user_a["headers"]

    status_breakdown = client.get("/api/analytics/status", headers=headers).json()
    assert {item["key"] for item in status_breakdown} == {"applied", "interview", "rejected"}

    sources = client.get("/api/analytics/sources", headers=headers).json()
    assert sources[0]["key"] == "LinkedIn"
    assert sources[0]["count"] == 3

    series = client.get("/api/analytics/applications", headers=headers, params={"days": 7}).json()
    assert len(series) == 8

    overview = client.get("/api/analytics/overview", headers=headers).json()
    assert overview["stats"]["total_applications"] == 3
    assert overview["rejection_rate"] == 33.3
    assert overview["interview_conversion_rate"] == 33.3
    assert len(overview["applications_per_week"]) > 0
    assert len(overview["applications_per_month"]) > 0


def test_analytics_requires_auth(client):
    assert client.get("/api/analytics/dashboard").status_code == 401


def test_tasks_and_interviews_list(client, user_a):
    _seed_pipeline(client, user_a)
    headers = user_a["headers"]

    tasks = client.get("/api/tasks", headers=headers).json()
    assert tasks["page_meta"]["total"] == 1

    interviews = client.get("/api/interviews", headers=headers).json()
    assert interviews["page_meta"]["total"] == 1
    assert interviews["items"][0]["job_title"] == "Backend Engineer"
    assert interviews["items"][0]["company_name"] == "Acme"


def test_notes_crud(client, user_a, sample_job):
    headers = user_a["headers"]
    created = client.post(
        "/api/notes",
        headers=headers,
        json={
            "entity_type": "job",
            "entity_id": sample_job["id"],
            "title": "Call",
            "content": "Spoke with the recruiter.",
        },
    )
    assert created.status_code == 201
    note_id = created.json()["id"]

    listed = client.get(
        "/api/notes",
        headers=headers,
        params={"entity_type": "job", "entity_id": sample_job["id"]},
    )
    assert len(listed.json()) == 1

    assert (
        client.patch(
            f"/api/notes/{note_id}", headers=headers, json={"content": "Updated"}
        ).status_code
        == 200
    )
    assert client.delete(f"/api/notes/{note_id}", headers=headers).status_code == 204


def test_global_search(client, user_a, sample_job):
    headers = user_a["headers"]
    client.post("/api/companies", headers=headers, json={"name": "Acme Robotics"})

    response = client.get("/api/search", headers=headers, params={"q": "AI"})
    assert response.status_code == 200
    body = response.json()
    assert any(hit["title"] == "AI Engineer" for hit in body["jobs"])

    companies = client.get("/api/search", headers=headers, params={"q": "Robot"})
    assert any(hit["title"] == "Acme Robotics" for hit in companies.json()["companies"])
