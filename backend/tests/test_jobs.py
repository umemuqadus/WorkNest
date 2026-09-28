from __future__ import annotations


def test_create_job(client, user_a):
    payload = {
        "title": "Backend Engineer",
        "location": "Berlin",
        "status": "saved",
        "priority": "medium",
        "salary_min": 80000,
        "salary_max": 110000,
    }
    response = client.post("/api/jobs", headers=user_a["headers"], json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Backend Engineer"
    assert body["status"] == "saved"
    assert body["has_analysis"] is False


def test_create_job_requires_title(client, user_a):
    response = client.post("/api/jobs", headers=user_a["headers"], json={"location": "X"})
    assert response.status_code == 422


def test_create_job_rejects_invalid_enum(client, user_a):
    response = client.post(
        "/api/jobs",
        headers=user_a["headers"],
        json={"title": "X", "status": "not_a_status"},
    )
    assert response.status_code == 422


def test_create_job_rejects_invalid_salary_range(client, user_a):
    response = client.post(
        "/api/jobs",
        headers=user_a["headers"],
        json={"title": "X", "salary_min": 200, "salary_max": 100},
    )
    assert response.status_code == 422
    assert "salary_max" in str(response.json()).lower() or "greater than" in response.text


def test_create_job_rejects_bad_url(client, user_a):
    response = client.post(
        "/api/jobs",
        headers=user_a["headers"],
        json={"title": "X", "job_url": "ftp://example.com"},
    )
    assert response.status_code == 422


def test_list_jobs_and_search(client, user_a):
    for title in ["AI Engineer", "Data Engineer"]:
        client.post("/api/jobs", headers=user_a["headers"], json={"title": title})

    response = client.get("/api/jobs", headers=user_a["headers"])
    assert response.status_code == 200
    assert response.json()["page_meta"]["total"] == 2

    filtered = client.get(
        "/api/jobs", headers=user_a["headers"], params={"q": "AI "}
    )
    assert filtered.json()["page_meta"]["total"] == 1
    assert filtered.json()["items"][0]["title"] == "AI Engineer"


def test_filter_jobs_by_status_and_priority(client, user_a):
    client.post(
        "/api/jobs",
        headers=user_a["headers"],
        json={"title": "High one", "status": "applied", "priority": "high"},
    )
    client.post(
        "/api/jobs",
        headers=user_a["headers"],
        json={"title": "Low one", "status": "saved", "priority": "low"},
    )

    response = client.get(
        "/api/jobs", headers=user_a["headers"], params={"status": "applied"}
    )
    assert response.json()["page_meta"]["total"] == 1
    assert response.json()["items"][0]["title"] == "High one"

    response = client.get(
        "/api/jobs", headers=user_a["headers"], params={"priority": "low"}
    )
    assert response.json()["page_meta"]["total"] == 1


def test_update_job(client, user_a, sample_job):
    response = client.patch(
        f"/api/jobs/{sample_job['id']}",
        headers=user_a["headers"],
        json={"title": "Senior AI Engineer", "salary_max": 190000},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Senior AI Engineer"
    assert response.json()["salary_max"] == 190000


def test_update_job_status_endpoint(client, user_a, sample_job):
    response = client.patch(
        f"/api/jobs/{sample_job['id']}/status",
        headers=user_a["headers"],
        json={"status": "applied"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "applied"


def test_update_job_priority_endpoint(client, user_a, sample_job):
    response = client.patch(
        f"/api/jobs/{sample_job['id']}/priority",
        headers=user_a["headers"],
        json={"priority": "low"},
    )
    assert response.status_code == 200
    assert response.json()["priority"] == "low"


def test_delete_job(client, user_a, sample_job):
    response = client.delete(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"])
    assert response.status_code == 204
    assert client.get(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"]).status_code == 404


def test_get_missing_job_returns_404(client, user_a):
    assert client.get("/api/jobs/9999", headers=user_a["headers"]).status_code == 404


def test_sorting_jobs(client, user_a):
    client.post("/api/jobs", headers=user_a["headers"], json={"title": "B job"})
    client.post("/api/jobs", headers=user_a["headers"], json={"title": "A job"})

    response = client.get(
        "/api/jobs",
        headers=user_a["headers"],
        params={"sort": "title", "order": "asc"},
    )
    titles = [item["title"] for item in response.json()["items"]]
    assert titles == sorted(titles)


def test_pagination(client, user_a):
    for i in range(5):
        client.post("/api/jobs", headers=user_a["headers"], json={"title": f"Job {i}"})

    response = client.get(
        "/api/jobs", headers=user_a["headers"], params={"limit": 2, "offset": 0}
    )
    body = response.json()
    assert len(body["items"]) == 2
    assert body["page_meta"]["total"] == 5
    assert body["page_meta"]["pages"] == 3
