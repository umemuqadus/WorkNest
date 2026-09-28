from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.ai_analysis import JobAnalysis, JobMatch
from app.models.application import Application
from app.models.job import Job
from app.schemas.job import JobFilters
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    model = Job

    #: whitelisted ``sort`` values -> column
    SORTABLE = {
        "created_at": Job.created_at,
        "updated_at": Job.updated_at,
        "title": Job.title,
        "status": Job.status,
        "priority": Job.priority,
        "deadline": Job.deadline,
        "date_posted": Job.date_posted,
    }

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(self, user_id: int, filters: JobFilters) -> tuple[list[Job], int]:
        stmt = select(Job).where(Job.user_id == user_id)

        if filters.q:
            pattern = f"%{filters.q.strip()}%"
            stmt = stmt.where(
                or_(
                    Job.title.ilike(pattern),
                    Job.location.ilike(pattern),
                    Job.description.ilike(pattern),
                    Job.source.ilike(pattern),
                )
            )
        stmt = self._apply_in(Job.status, filters.status, stmt)
        stmt = self._apply_in(Job.priority, filters.priority, stmt)
        stmt = self._apply_in(Job.remote_type, filters.remote_type, stmt)
        stmt = self._apply_in(Job.employment_type, filters.employment_type, stmt)
        if filters.company_id:
            stmt = stmt.where(Job.company_id == filters.company_id)
        if filters.date_from:
            stmt = stmt.where(Job.created_at >= filters.date_from)
        if filters.date_to:
            stmt = stmt.where(Job.created_at <= filters.date_to)

        total = int(
            self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        )
        stmt = stmt.options(joinedload(Job.company))

        column = self.SORTABLE.get(filters.sort, Job.created_at)
        direction = column.desc() if filters.order.lower() == "desc" else column.asc()
        rows = self.session.scalars(
            stmt.order_by(direction).limit(filters.limit).offset(filters.offset)
        ).all()
        return list(rows), total

    def list_high_priority(self, user_id: int, limit: int = 5) -> list[Job]:
        from app.models.enums import JobStatus, Priority

        stmt = (
            select(Job)
            .where(
                Job.user_id == user_id,
                Job.priority == Priority.HIGH,
                Job.status.in_([JobStatus.SAVED, JobStatus.APPLYING, JobStatus.APPLIED]),
            )
            .order_by(Job.deadline.is_(None), Job.deadline.asc())
            .limit(limit)
        )
        return list(self.session.scalars(stmt).all())

    def list_with_job(self, job_id: int) -> Job:
        stmt = select(Job).where(Job.id == job_id).options(joinedload(Job.company))
        return self.session.scalars(stmt).one()


class ApplicationBriefRepository(BaseRepository[Application]):
    """Small helper used by the job list decorator."""

    model = Application

    def status_by_job_ids(self, job_ids: list[int]) -> dict[int, Application]:
        if not job_ids:
            return {}
        stmt = select(Application).where(Application.job_id.in_(job_ids))
        return {app.job_id: app for app in self.session.scalars(stmt).all()}


class MatchScoreRepository(BaseRepository[JobMatch]):
    model = JobMatch

    def best_scores_by_job_ids(self, job_ids: list[int]) -> dict[int, tuple[int, int]]:
        """job_id -> (best score, resume_id)"""
        if not job_ids:
            return {}
        stmt = (
            select(JobMatch.job_id, JobMatch.resume_id, JobMatch.match_score)
            .where(JobMatch.job_id.in_(job_ids))
            .order_by(JobMatch.match_score.desc())
        )
        best: dict[int, tuple[int, int]] = {}
        for job_id, resume_id, score in self.session.execute(stmt).all():
            best.setdefault(int(job_id), (int(resume_id), int(score)))
        return best

    def analysis_job_ids(self, job_ids: list[int]) -> set[int]:
        if not job_ids:
            return set()
        stmt = select(JobAnalysis.job_id).where(JobAnalysis.job_id.in_(job_ids))
        return {int(value) for value in self.session.scalars(stmt).all()}

    def upcoming_interview_by_job_ids(self, job_ids: list[int]) -> dict[int, datetime]:
        if not job_ids:
            return {}
        from app.models.interview import Interview

        now = datetime.now(timezone.utc)
        stmt = (
            select(Application.job_id, func.min(Interview.scheduled_at))
            .join(Interview, Interview.application_id == Application.id)
            .where(Application.job_id.in_(job_ids), Interview.scheduled_at >= now)
            .group_by(Application.job_id)
        )
        return {int(job_id): when for job_id, when in self.session.execute(stmt).all()}
