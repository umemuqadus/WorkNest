from __future__ import annotations


def test_company_crud(client, user_a):
    headers = user_a["headers"]

    created = client.post(
        "/api/companies", headers=headers, json={"name": "Acme", "industry": "SaaS"}
    )
    assert created.status_code == 201
    company_id = created.json()["id"]

    listed = client.get("/api/companies", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["page_meta"]["total"] == 1
    assert listed.json()["items"][0]["job_count"] == 0

    updated = client.patch(
        f"/api/companies/{company_id}", headers=headers, json={"location": "Lisbon"}
    )
    assert updated.status_code == 200
    assert updated.json()["location"] == "Lisbon"

    assert client.delete(f"/api/companies/{company_id}", headers=headers).status_code == 204
    assert client.get(f"/api/companies/{company_id}", headers=headers).status_code == 404


def test_company_search(client, user_a):
    headers = user_a["headers"]
    client.post("/api/companies", headers=headers, json={"name": "DataWorks"})
    client.post("/api/companies", headers=headers, json={"name": "Cloud Systems"})

    response = client.get("/api/companies", headers=headers, params={"q": "data"})
    assert response.json()["page_meta"]["total"] == 1


def test_company_rejects_invalid_website(client, user_a):
    response = client.post(
        "/api/companies",
        headers=user_a["headers"],
        json={"name": "Bad URL Co", "website": "not a url"},
    )
    assert response.status_code == 422


def test_contact_crud_and_company_link(client, user_a):
    headers = user_a["headers"]
    company = client.post("/api/companies", headers=headers, json={"name": "Acme"}).json()

    created = client.post(
        "/api/contacts",
        headers=headers,
        json={
            "name": "Jane Recruiter",
            "email": "jane@acme.example.com",
            "company_id": company["id"],
            "job_title": "Recruiter",
        },
    )
    assert created.status_code == 201
    assert created.json()["company"]["name"] == "Acme"

    contact_id = created.json()["id"]
    assert (
        client.patch(
            f"/api/contacts/{contact_id}", headers=headers, json={"phone": "+1 555 000"}
        ).status_code
        == 200
    )
    assert client.delete(f"/api/contacts/{contact_id}", headers=headers).status_code == 204


def test_contact_with_unknown_company_rejected(client, user_a):
    response = client.post(
        "/api/contacts",
        headers=user_a["headers"],
        json={"name": "Ghost", "company_id": 9999},
    )
    assert response.status_code == 400


def test_contact_list_filtered_by_company(client, user_a):
    headers = user_a["headers"]
    company = client.post("/api/companies", headers=headers, json={"name": "Acme"}).json()
    client.post("/api/contacts", headers=headers, json={"name": "At Acme", "company_id": company["id"]})
    client.post("/api/contacts", headers=headers, json={"name": "Elsewhere"})

    response = client.get(
        "/api/contacts", headers=headers, params={"company_id": company["id"]}
    )
    assert response.json()["page_meta"]["total"] == 1
    assert response.json()["items"][0]["name"] == "At Acme"


def test_deleting_company_keeps_jobs_but_unlinks_them(client, user_a):
    headers = user_a["headers"]
    company = client.post("/api/companies", headers=headers, json={"name": "Acme"}).json()
    job = client.post(
        "/api/jobs", headers=headers, json={"title": "Role", "company_id": company["id"]}
    ).json()

    assert client.delete(f"/api/companies/{company['id']}", headers=headers).status_code == 204

    surviving = client.get(f"/api/jobs/{job['id']}", headers=headers)
    assert surviving.status_code == 200
    assert surviving.json()["company"] is None
