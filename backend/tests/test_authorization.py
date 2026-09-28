"""Cross-user access must always fail with 404 (never leak existence)."""

from __future__ import annotations


def test_user_b_cannot_read_user_a_job(client, user_a, user_b, sample_job):
    response = client.get(f"/api/jobs/{sample_job['id']}", headers=user_b["headers"])
    assert response.status_code == 404


def test_user_b_cannot_update_user_a_job(client, user_a, user_b, sample_job):
    response = client.patch(
        f"/api/jobs/{sample_job['id']}",
        headers=user_b["headers"],
        json={"title": "Hacked"},
    )
    assert response.status_code == 404

    still_original = client.get(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"])
    assert still_original.json()["title"] == "AI Engineer"


def test_user_b_cannot_delete_user_a_job(client, user_a, user_b, sample_job):
    response = client.delete(f"/api/jobs/{sample_job['id']}", headers=user_b["headers"])
    assert response.status_code == 404
    assert client.get(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"]).status_code == 200


def test_job_lists_are_isolated(client, user_a, user_b, sample_job):
    assert client.get("/api/jobs", headers=user_b["headers"]).json()["page_meta"]["total"] == 0
    assert client.get("/api/jobs", headers=user_a["headers"]).json()["page_meta"]["total"] == 1


def test_user_b_cannot_use_user_a_company(client, user_a, user_b):
    company = client.post(
        "/api/companies",
        headers=user_a["headers"],
        json={"name": "Secret Co"},
    ).json()

    response = client.post(
        "/api/jobs",
        headers=user_b["headers"],
        json={"title": "Leak attempt", "company_id": company["id"]},
    )
    assert response.status_code == 400


def test_user_b_cannot_read_user_a_application(client, user_a, user_b, sample_job):
    application = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied"},
    ).json()

    assert (
        client.get(
            f"/api/applications/{application['id']}", headers=user_b["headers"]
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"/api/applications/{application['id']}",
            headers=user_b["headers"],
            json={"status": "rejected"},
        ).status_code
        == 404
    )
    assert (
        client.delete(
            f"/api/applications/{application['id']}", headers=user_b["headers"]
        ).status_code
        == 404
    )


def test_user_b_cannot_read_user_a_resume(client, user_a, user_b):
    resume = client.post(
        "/api/resumes",
        headers=user_a["headers"],
        json={"name": "Mine", "content": "Python, FastAPI, SQL " * 5},
    ).json()

    assert client.get(f"/api/resumes/{resume['id']}", headers=user_b["headers"]).status_code == 404
    assert (
        client.delete(f"/api/resumes/{resume['id']}", headers=user_b["headers"]).status_code
        == 404
    )


def test_user_b_cannot_run_ai_on_user_a_job(client, user_a, user_b, sample_job):
    response = client.post(
        f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_b["headers"]
    )
    assert response.status_code == 404


def test_notes_cannot_target_foreign_entities(client, user_a, user_b, sample_job):
    response = client.post(
        "/api/notes",
        headers=user_b["headers"],
        json={
            "entity_type": "job",
            "entity_id": sample_job["id"],
            "content": "snooping",
        },
    )
    assert response.status_code == 400


def test_unauthenticated_requests_are_rejected(client):
    for method, url in [
        ("get", "/api/jobs"),
        ("get", "/api/applications"),
        ("get", "/api/analytics/dashboard"),
        ("get", "/api/resumes"),
    ]:
        assert getattr(client, method)(url).status_code == 401
