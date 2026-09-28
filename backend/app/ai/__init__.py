"""AI provider abstraction and orchestration helpers."""

from app.ai.base import AIProvider, AIRequest
from app.ai.factory import provider_status, resolve_provider
from app.ai.parser import extract_json
from app.ai.prompts import (
    build_interview_prep_request,
    build_job_analysis_request,
    build_match_request,
    build_suggestions_request,
)

__all__ = [
    "AIProvider",
    "AIRequest",
    "resolve_provider",
    "provider_status",
    "extract_json",
    "build_job_analysis_request",
    "build_match_request",
    "build_interview_prep_request",
    "build_suggestions_request",
]
