from __future__ import annotations


def test_create_application(client, user_a, sample_job):
    response = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied", "source": "LinkedIn"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "applied"
    assert body["job"]["title"] == "AI Engineer"
    assert body["applied_at"] is not None
    # initial history entry
    assert len(body["history"]) == 1
    assert body["history"][0]["old_status"] is None
    assert body["history"][0]["new_status"] == "applied"


def test_creating_application_syncs_job_status(client, user_a, sample_job):
    client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied"},
    )
    job = client.get(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"]).json()
    assert job["status"] == "applied"
    assert job["application_status"] == "applied"


def test_duplicate_application_conflicts(client, user_a, sample_job):
    payload = {"job_id": sample_job["id"], "status": "saved"}
    assert client.post("/api/applications", headers=user_a["headers"], json=payload).status_code == 201
    second = client.post("/api/applications", headers=user_a["headers"], json=payload)
    assert second.status_code == 409


def test_application_for_unknown_job_is_rejected(client, user_a):
    response = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": 4242, "status": "applied"},
    )
    assert response.status_code == 400


def test_status_change_records_history(client, user_a, sample_job):
    application = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied"},
    ).json()

    response = client.patch(
        f"/api/applications/{application['id']}",
        headers=user_a["headers"],
        json={"status": "screening"},
    )
    assert response.status_code == 200
    history = response.json()["history"]
    assert len(history) == 2
    assert history[0]["new_status"] == "screening"
    assert history[0]["old_status"] == "applied"


def test_kanban_flow_updates_history_and_job_status(client, user_a, sample_job):
    application = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "saved"},
    ).json()

    for stage, expected_job_status in [
        ("applied", "applied"),
        ("screening", "applied"),
        ("interview", "interview"),
        ("offer", "offer"),
    ]:
        response = client.patch(
            f"/api/applications/{application['id']}",
            headers=user_a["headers"],
            json={"status": stage},
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == stage

        job = client.get(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"]).json()
        assert job["status"] == expected_job_status

    detail = client.get(
        f"/api/applications/{application['id']}", headers=user_a["headers"]
    ).json()
    assert len(detail["history"]) == 5  # initial + 4 transitions


def test_rejection_rate_flows_to_dashboard(client, user_a, sample_job):
    application = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied"},
    ).json()
    client.patch(
        f"/api/applications/{application['id']}",
        headers=user_a["headers"],
        json={"status": "rejected"},
    )

    dashboard = client.get("/api/analytics/dashboard", headers=user_a["headers"]).json()
    assert dashboard["stats"]["rejected"] == 1
    job = client.get(f"/api/jobs/{sample_job['id']}", headers=user_a["headers"]).json()
    assert job["status"] == "rejected"


def test_list_applications_filter_by_status(client, user_a, sample_job):
    client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied"},
    )
    response = client.get(
        "/api/applications",
        headers=user_a["headers"],
        params={"status": "applied"},
    )
    assert response.json()["page_meta"]["total"] == 1

    response = client.get(
        "/api/applications",
        headers=user_a["headers"],
        params={"status": "offer"},
    )
    assert response.json()["page_meta"]["total"] == 0


def test_delete_application(client, user_a, sample_job):
    application = client.post(
        "/api/applications",
        headers=user_a["headers"],
        json={"job_id": sample_job["id"], "status": "applied"},
    ).json()
    response = client.delete(
        f"/api/applications/{application['id']}", headers=user_a["headers"]
    )
    assert response.status_code == 204
    assert (
        client.get(
            f"/api/applications/{application['id']}", headers=user_a["headers"]
        ).status_code
        == 404
    )
