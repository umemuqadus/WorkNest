"""AI endpoints: structured output, caching, graceful failure."""

from __future__ import annotations

import pytest

from app.services import ai_service as ai_service_module


def test_ai_status_reports_provider(client):
    body = client.get("/api/ai/status").json()
    assert body["provider"] == "mock"
    assert body["configured"] is True
    assert body["fallback"] is False


def test_analyze_job_returns_structured_json(client, user_a, sample_job):
    response = client.post(
        f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["summary"]
    assert isinstance(body["required_skills"], list)
    assert len(body["required_skills"]) > 0
    assert "fastapi" in [skill.lower() for skill in body["required_skills"]]
    assert body["provider"] == "mock"


def test_analysis_is_cached_and_not_recomputed(client, user_a, sample_job):
    first = client.post(
        f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
    ).json()

    class ExplodingProvider:
        name = "boom"

        async def complete(self, request):  # pragma: no cover - must not run
            raise AssertionError("provider should not be called for a cached analysis")

    original = ai_service_module.resolve_provider
    ai_service_module.resolve_provider = lambda: (ExplodingProvider(), False)
    try:
        cached = client.post(
            f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
        ).json()
    finally:
        ai_service_module.resolve_provider = original

    assert cached["id"] == first["id"]
    assert cached["created_at"] == first["created_at"]

    # explicit GET returns the persisted record without touching the provider
    fetched = client.get(
        f"/api/ai/jobs/{sample_job['id']}/analysis", headers=user_a["headers"]
    ).json()
    assert fetched["summary"] == first["summary"]


def test_refresh_regenerates_analysis(client, user_a, sample_job):
    first = client.post(
        f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
    ).json()
    refreshed = client.post(
        f"/api/ai/jobs/{sample_job['id']}/analyze",
        headers=user_a["headers"],
        params={"refresh": "true"},
    ).json()
    assert refreshed["id"] == first["id"]


def test_analysis_without_description_is_rejected(client, user_a):
    job = client.post(
        "/api/jobs", headers=user_a["headers"], json={"title": "No description"}
    ).json()
    response = client.post(
        f"/api/ai/jobs/{job['id']}/analyze", headers=user_a["headers"]
    )
    assert response.status_code == 400
    assert response.json()["field"] == "description"


def test_match_requires_a_resume(client, user_a, sample_job):
    response = client.post(
        f"/api/ai/jobs/{sample_job['id']}/match", headers=user_a["headers"]
    )
    assert response.status_code == 400


def test_resume_match_returns_score_and_skills(client, user_a, sample_job):
    headers = user_a["headers"]
    client.post(
        "/api/resumes",
        headers=headers,
        json={
            "name": "Main",
            "content": (
                "Python FastAPI SQL Docker engineer with 4 years experience. "
                "Built REST APIs and data pipelines. Missing Kubernetes."
            ),
        },
    )

    response = client.post(f"/api/ai/jobs/{sample_job['id']}/match", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert 0 <= body["match_score"] <= 100
    assert isinstance(body["matched_skills"], list)
    assert isinstance(body["missing_skills"], list)
    assert body["summary"]
    # resume skills must actually overlap the job requirements
    assert "python" in [s.lower() for s in body["matched_skills"]]


def test_match_cache_returns_same_record(client, user_a, sample_job):
    headers = user_a["headers"]
    client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "Main", "content": "Python FastAPI SQL Docker engineer."},
    )
    first = client.post(f"/api/ai/jobs/{sample_job['id']}/match", headers=headers).json()
    second = client.post(f"/api/ai/jobs/{sample_job['id']}/match", headers=headers).json()
    assert first["id"] == second["id"]

    fetched = client.get(
        f"/api/ai/jobs/{sample_job['id']}/match", headers=headers
    ).json()
    assert fetched["match_score"] == first["match_score"]


def test_interview_preparation(client, user_a, sample_job):
    headers = user_a["headers"]
    client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "Main", "content": "Python FastAPI SQL Docker engineer."},
    )
    response = client.post(
        f"/api/ai/jobs/{sample_job['id']}/interview-prep", headers=headers
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["technical_questions"]) > 0
    assert len(body["behavioral_questions"]) > 0
    assert len(body["questions_to_ask"]) > 0

    # persisted => readable later without another AI call
    cached = client.get(
        f"/api/ai/jobs/{sample_job['id']}/interview-prep", headers=headers
    ).json()
    assert cached["id"] == body["id"]


def test_application_suggestions(client, user_a, sample_job):
    headers = user_a["headers"]
    client.post(
        "/api/resumes",
        headers=headers,
        json={"name": "Main", "content": "Python FastAPI SQL engineer."},
    )
    response = client.post(
        f"/api/ai/jobs/{sample_job['id']}/application-suggestions", headers=headers
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["keywords_to_include"]) > 0
    assert len(body["cover_letter_outline"]) >= 3
    assert body["application_strategy"]


def test_ai_invalid_json_returns_controlled_error(client, user_a, sample_job):
    class GarbageProvider:
        name = "garbage"

        async def complete(self, request):
            return "definitely not json"

    ai_service_module.resolve_provider = lambda: (GarbageProvider(), False)
    try:
        response = client.post(
            f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
        )
    finally:
        from app.ai.factory import resolve_provider as original

        ai_service_module.resolve_provider = original

    assert response.status_code == 502
    assert response.json()["code"] == "ai_invalid_response"
    assert "Traceback" not in response.text


def test_ai_provider_outage_is_graceful(client, user_a, sample_job):
    from app.core.exceptions import AIUnavailable

    class DownProvider:
        name = "down"

        async def complete(self, request):
            raise AIUnavailable("The AI provider could not be reached.")

    original = ai_service_module.resolve_provider
    ai_service_module.resolve_provider = lambda: (DownProvider(), False)
    try:
        response = client.post(
            f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
        )
    finally:
        ai_service_module.resolve_provider = original

    assert response.status_code == 503
    assert response.json()["code"] == "ai_unavailable"


def test_ai_rejects_schema_violations(client, user_a, sample_job):
    class BadSchemaProvider:
        name = "bad-schema"

        async def complete(self, request):
            # valid JSON, invalid schema (match_score out of range on analysis task)
            return '{"required_skills": "not-a-list", "summary": 12345}'

    original = ai_service_module.resolve_provider
    ai_service_module.resolve_provider = lambda: (BadSchemaProvider(), False)
    try:
        response = client.post(
            f"/api/ai/jobs/{sample_job['id']}/analyze", headers=user_a["headers"]
        )
    finally:
        ai_service_module.resolve_provider = original

    assert response.status_code == 502
