"""Schemas for AI request payloads and AI generated responses.

The ``*Payload`` models are what the AI provider is asked to return; they are
validated before anything is written to the database.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator


class JobAnalysisPayload(BaseModel):
    summary: str = Field(description="2-4 sentence plain language summary")
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    seniority: Optional[str] = None
    employment_type: Optional[str] = None
    remote_type: Optional[str] = None

    @field_validator(
        "required_skills",
        "preferred_skills",
        "responsibilities",
        "keywords",
        "technologies",
        "soft_skills",
        mode="before",
    )
    @classmethod
    def _as_list(cls, value):  # tolerate a model returning a comma string
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value


class JobMatchPayload(BaseModel):
    match_score: int = Field(ge=0, le=100)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    experience_match: Optional[str] = None
    recommendations: list[str] = Field(default_factory=list)
    summary: str

    @field_validator(
        "matched_skills",
        "missing_skills",
        "strengths",
        "weaknesses",
        "recommendations",
        mode="before",
    )
    @classmethod
    def _as_list(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value


class InterviewPrepPayload(BaseModel):
    technical_questions: list[str] = Field(default_factory=list)
    behavioral_questions: list[str] = Field(default_factory=list)
    role_specific_questions: list[str] = Field(default_factory=list)
    suggested_answer_points: list[str] = Field(default_factory=list)
    questions_to_ask: list[str] = Field(default_factory=list)

    @field_validator(
        "technical_questions",
        "behavioral_questions",
        "role_specific_questions",
        "suggested_answer_points",
        "questions_to_ask",
        mode="before",
    )
    @classmethod
    def _as_list(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split("\n") if part.strip()]
        return value


class ApplicationSuggestionPayload(BaseModel):
    resume_customization: list[str] = Field(default_factory=list)
    keywords_to_include: list[str] = Field(default_factory=list)
    cover_letter_outline: list[str] = Field(default_factory=list)
    skills_to_highlight: list[str] = Field(default_factory=list)
    potential_gaps: list[str] = Field(default_factory=list)
    application_strategy: str = ""

    @field_validator(
        "resume_customization",
        "keywords_to_include",
        "cover_letter_outline",
        "skills_to_highlight",
        "potential_gaps",
        mode="before",
    )
    @classmethod
    def _as_list(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split("\n") if part.strip()]
        return value
