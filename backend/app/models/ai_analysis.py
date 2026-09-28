"""Tables that persist AI generated artefacts (analysis, match, prep, tips).

Storing results means we only pay for an AI call when the user explicitly
asks to (re)generate instead of on every page view.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.resume import Resume


class JobAnalysis(TimestampMixin, Base):
    __tablename__ = "job_analyses"
    __table_args__ = (UniqueConstraint("job_id", name="uq_job_analysis_job"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)

    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_skills: Mapped[list] = mapped_column(JSON, default=list)
    preferred_skills: Mapped[list] = mapped_column(JSON, default=list)
    responsibilities: Mapped[list] = mapped_column(JSON, default=list)
    technologies: Mapped[list] = mapped_column(JSON, default=list)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    soft_skills: Mapped[list] = mapped_column(JSON, default=list)
    seniority: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    experience_required: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    education_required: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    remote_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    job: Mapped["Job"] = relationship(back_populates="analyses")


class JobMatch(TimestampMixin, Base):
    __tablename__ = "job_matches"
    __table_args__ = (UniqueConstraint("job_id", "resume_id", name="uq_job_match_job_resume"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), index=True
    )

    match_score: Mapped[int] = mapped_column(Integer, default=0)
    matched_skills: Mapped[list] = mapped_column(JSON, default=list)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list)
    strengths: Mapped[list] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)
    experience_match: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    job: Mapped["Job"] = relationship(back_populates="matches")
    resume: Mapped["Resume"] = relationship(back_populates="matches")


class InterviewPreparation(TimestampMixin, Base):
    __tablename__ = "interview_preparations"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    resume_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True
    )

    technical_questions: Mapped[list] = mapped_column(JSON, default=list)
    behavioral_questions: Mapped[list] = mapped_column(JSON, default=list)
    role_specific_questions: Mapped[list] = mapped_column(JSON, default=list)
    suggested_answer_points: Mapped[list] = mapped_column(JSON, default=list)
    questions_to_ask: Mapped[list] = mapped_column(JSON, default=list)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ApplicationSuggestion(TimestampMixin, Base):
    __tablename__ = "application_suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    resume_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True
    )

    resume_customization: Mapped[list] = mapped_column(JSON, default=list)
    keywords_to_include: Mapped[list] = mapped_column(JSON, default=list)
    cover_letter_outline: Mapped[list] = mapped_column(JSON, default=list)
    skills_to_highlight: Mapped[list] = mapped_column(JSON, default=list)
    potential_gaps: Mapped[list] = mapped_column(JSON, default=list)
    application_strategy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


__all__ = [
    "JobAnalysis",
    "JobMatch",
    "InterviewPreparation",
    "ApplicationSuggestion",
    "datetime",
]
