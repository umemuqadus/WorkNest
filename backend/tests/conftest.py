"""Shared pytest fixtures.

The suite runs on an in-memory SQLite database so it needs no external
services; the production schema is PostgreSQL.
"""

from __future__ import annotations

import os

# Must be set before any app module is imported.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["AI_PROVIDER"] = "mock"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.rate_limit import limiter  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
import app.models  # noqa: F401,E402  (registers every model on Base.metadata)
from app.main import app as fastapi_app  # noqa: E402

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)

TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def db_session():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    session = TestingSession()
    limiter.reset()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture()
def user_a(client):
    """Registered user A with auth headers."""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alice Applicant",
            "email": "alice@example.com",
            "password": "Password123",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return {
        "headers": {"Authorization": f"Bearer {body['access_token']}"},
        "user": body["user"],
    }


@pytest.fixture()
def user_b(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Bob Builder",
            "email": "bob@example.com",
            "password": "Password456",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return {
        "headers": {"Authorization": f"Bearer {body['access_token']}"},
        "user": body["user"],
    }


@pytest.fixture()
def sample_job(client, user_a):
    response = client.post(
        "/api/jobs",
        headers=user_a["headers"],
        json={
            "title": "AI Engineer",
            "description": (
                "Build LLM features with Python and FastAPI. "
                "Requirements: 3+ years of Python, SQL and Docker. "
                "AWS experience is preferred."
            ),
            "location": "Remote",
            "remote_type": "remote",
            "employment_type": "full_time",
            "salary_min": 120000,
            "salary_max": 160000,
            "source": "LinkedIn",
            "status": "saved",
            "priority": "high",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()
