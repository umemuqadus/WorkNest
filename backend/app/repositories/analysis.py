"""Persistence for AI artefacts (analysis, match, prep, suggestions)."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ai_analysis import (
    ApplicationSuggestion,
    InterviewPreparation,
    JobAnalysis,
    JobMatch,
)
from app.repositories.base import BaseRepository


class AnalysisRepository(BaseRepository[JobAnalysis]):
    model = JobAnalysis

    def for_job(self, job_id: int) -> Optional[JobAnalysis]:
        return self.session.scalars(
            select(JobAnalysis).where(JobAnalysis.job_id == job_id)
        ).first()


class MatchRepository(BaseRepository[JobMatch]):
    model = JobMatch

    def for_job_and_resume(self, job_id: int, resume_id: int) -> Optional[JobMatch]:
        return self.session.scalars(
            select(JobMatch).where(
                JobMatch.job_id == job_id, JobMatch.resume_id == resume_id
            )
        ).first()

    def for_resume(self, resume_id: int) -> list[JobMatch]:
        return list(
            self.session.scalars(select(JobMatch).where(JobMatch.resume_id == resume_id)).all()
        )


class PreparationRepository(BaseRepository[InterviewPreparation]):
    model = InterviewPreparation

    def latest_for_job(self, job_id: int) -> Optional[InterviewPreparation]:
        stmt = (
            select(InterviewPreparation)
            .where(InterviewPreparation.job_id == job_id)
            .order_by(InterviewPreparation.updated_at.desc())
            .limit(1)
        )
        return self.session.scalars(stmt).first()


class SuggestionRepository(BaseRepository[ApplicationSuggestion]):
    model = ApplicationSuggestion

    def for_job(self, job_id: int) -> Optional[ApplicationSuggestion]:
        stmt = (
            select(ApplicationSuggestion)
            .where(ApplicationSuggestion.job_id == job_id)
            .order_by(ApplicationSuggestion.updated_at.desc())
            .limit(1)
        )
        return self.session.scalars(stmt).first()
