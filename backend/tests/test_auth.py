from __future__ import annotations


def test_register_returns_token_and_user(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Carol", "email": "carol@example.com", "password": "Secret123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "carol@example.com"
    assert "password" not in str(body).lower() or "password_hash" not in str(body)


def test_register_duplicate_email_conflicts(client, user_a):
    response = client.post(
        "/api/auth/register",
        json={"name": "Alice Two", "email": "alice@example.com", "password": "Secret123"},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "conflict"


def test_register_rejects_weak_password(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Weak", "email": "weak@example.com", "password": "short"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"


def test_register_rejects_password_without_number(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "NoNum", "email": "nonum@example.com", "password": "onlyletters"},
    )
    assert response.status_code == 422


def test_login_with_wrong_password(client, user_a):
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "WrongPass123"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


def test_login_with_unknown_email(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "Whatever123"},
    )
    assert response.status_code == 401
    # identical message: no user enumeration
    assert response.json()["detail"] == "Invalid email or password."


def test_login_success(client, user_a):
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "Password123"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["name"] == "Alice Applicant"


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_rejects_garbage_token(client):
    response = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-token"}
    )
    assert response.status_code == 401


def test_me_returns_profile(client, user_a):
    response = client.get("/api/auth/me", headers=user_a["headers"])
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_update_profile(client, user_a):
    response = client.patch(
        "/api/auth/me",
        headers=user_a["headers"],
        json={"location": "Berlin", "linkedin_url": "https://linkedin.com/in/alice"},
    )
    assert response.status_code == 200
    assert response.json()["location"] == "Berlin"


def test_update_profile_rejects_bad_url(client, user_a):
    response = client.patch(
        "/api/auth/me", headers=user_a["headers"], json={"linkedin_url": "not-a-url"}
    )
    assert response.status_code == 422


def test_change_password_then_login(client, user_a):
    response = client.post(
        "/api/auth/change-password",
        headers=user_a["headers"],
        json={"current_password": "Password123", "new_password": "NewPass456"},
    )
    assert response.status_code == 204

    assert (
        client.post(
            "/api/auth/login",
            json={"email": "alice@example.com", "password": "NewPass456"},
        ).status_code
        == 200
    )
