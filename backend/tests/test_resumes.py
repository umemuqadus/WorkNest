from __future__ import annotations


def test_first_resume_becomes_default(client, user_a):
    response = client.post(
        "/api/resumes",
        headers=user_a["headers"],
        json={"name": "Main", "content": "Python and FastAPI engineer with 4 years experience."},
    )
    assert response.status_code == 201
    assert response.json()["is_default"] is True


def test_second_resume_is_not_default(client, user_a):
    headers = user_a["headers"]
    client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "Main", "content": "Python and FastAPI engineer."},
    )
    second = client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "Data", "content": "Data engineering with SQL and Airflow."},
    )
    assert second.json()["is_default"] is False

    listed = client.get("/api/resumes", headers=headers).json()
    defaults = [item for item in listed if item["is_default"]]
    assert len(defaults) == 1


def test_set_default_moves_flag(client, user_a):
    headers = user_a["headers"]
    first = client.post(
        "/api/resumes", headers=headers, json={"name": "A", "content": "Python developer."}
    ).json()
    second = client.post(
        "/api/resumes", headers=headers, json={"name": "B", "content": "SQL developer."}
    ).json()

    response = client.post(f"/api/resumes/{second['id']}/default", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_default"] is True

    first_now = client.get(f"/api/resumes/{first['id']}", headers=headers).json()
    assert first_now["is_default"] is False


def test_update_and_delete_resume(client, user_a):
    headers = user_a["headers"]
    resume = client.post(
        "/api/resumes", headers=headers, json={"name": "Old", "content": "Python, SQL."}
    ).json()

    updated = client.patch(
        f"/api/resumes/{resume['id']}", headers=headers, json={"name": "New"}
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "New"

    assert client.delete(f"/api/resumes/{resume['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/resumes/{resume['id']}", headers=headers).status_code == 404


def test_resume_requires_content(client, user_a):
    response = client.post(
        "/api/resumes", headers=user_a["headers"], json={"name": "Empty", "content": "hi"}
    )
    assert response.status_code == 422


def test_deleting_default_promotes_another(client, user_a):
    headers = user_a["headers"]
    first = client.post(
        "/api/resumes", headers=headers, json={"name": "A", "content": "Python developer."}
    ).json()
    second = client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "B", "content": "SQL developer.", "is_default": True},
    ).json()

    assert client.delete(f"/api/resumes/{second['id']}", headers=headers).status_code == 204
    remaining = client.get(f"/api/resumes/{first['id']}", headers=headers).json()
    assert remaining["is_default"] is True


def test_resume_list_shows_preview_not_full_text(client, user_a):
    headers = user_a["headers"]
    client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "Main", "content": "x" * 500},
    )
    listed = client.get("/api/resumes", headers=headers).json()
    assert len(listed[0]["preview"]) < 500
