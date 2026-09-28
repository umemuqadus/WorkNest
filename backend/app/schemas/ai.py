"""API response shapes for AI endpoints (cached records from the database)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.schemas.common import ORMModel


class JobAnalysisOut(ORMModel):
    id: int
    job_id: int
    summary: Optional[str] = None
    required_skills: list = []
    preferred_skills: list = []
    responsibilities: list = []
    technologies: list = []
    keywords: list = []
    soft_skills: list = []
    seniority: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    employment_type: Optional[str] = None
    remote_type: Optional[str] = None
    provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobMatchOut(ORMModel):
    id: int
    job_id: int
    resume_id: int
    match_score: int
    matched_skills: list = []
    missing_skills: list = []
    strengths: list = []
    weaknesses: list = []
    experience_match: Optional[str] = None
    recommendations: list = []
    summary: Optional[str] = None
    provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InterviewPrepOut(ORMModel):
    id: int
    job_id: int
    resume_id: Optional[int] = None
    technical_questions: list = []
    behavioral_questions: list = []
    role_specific_questions: list = []
    suggested_answer_points: list = []
    questions_to_ask: list = []
    provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InterviewPrepPatch(ORMModel):
    technical_questions: Optional[list] = None
    behavioral_questions: Optional[list] = None
    role_specific_questions: Optional[list] = None
    suggested_answer_points: Optional[list] = None
    questions_to_ask: Optional[list] = None


class ApplicationSuggestionOut(ORMModel):
    id: int
    job_id: int
    resume_id: Optional[int] = None
    resume_customization: list = []
    keywords_to_include: list = []
    cover_letter_outline: list = []
    skills_to_highlight: list = []
    potential_gaps: list = []
    application_strategy: Optional[str] = None
    provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AIStatusOut(ORMModel):
    """Lets the UI know whether AI features are usable without exposing keys."""

    provider: str
    configured: bool
    fallback: bool = False
