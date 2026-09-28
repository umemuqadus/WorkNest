"""Dashboard + analytics aggregation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.company import Company
from app.models.enums import ApplicationStatus, JobStatus
from app.models.job import Job
from app.repositories.analytics import AnalyticsRepository
from app.repositories.job import JobRepository
from app.repositories.task import TaskRepository
from app.schemas.analytics import (
    AnalyticsOverviewOut,
    BreakdownItem,
    DashboardOut,
    HighPriorityJobItem,
    RecentApplicationItem,
    SeriesPoint,
    StatBlock,
    TaskItem,
    UpcomingInterviewItem,
)
from app.utils.text import humanize


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AnalyticsService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = AnalyticsRepository(session)
        self.jobs = JobRepository(session)
        self.tasks = TaskRepository(session)

    # -- dashboard ----------------------------------------------------
    def dashboard(self, user_id: int) -> DashboardOut:
        stats = self.stats(user_id)
        app_counts = self.repo.application_counts(user_id)
        job_counts = self.repo.job_status_counts(user_id)

        by_status = self.status_breakdown(user_id)
        by_source = self._job_breakdown(user_id, Job.source)  # "jobs by source" chart
        by_company = self._company_breakdown(user_id)

        conversion = [
            BreakdownItem(
                key="saved",
                label="Saved",
                count=job_counts.get(JobStatus.SAVED.value, 0),
            ),
            BreakdownItem(
                key="applied",
                label="Applied",
                count=app_counts.get(ApplicationStatus.APPLIED.value, 0)
                + app_counts.get(ApplicationStatus.SCREENING.value, 0),
            ),
            BreakdownItem(
                key="interview",
                label="Interview",
                count=app_counts.get(ApplicationStatus.INTERVIEW.value, 0),
            ),
            BreakdownItem(
                key="offer",
                label="Offer",
                count=app_counts.get(ApplicationStatus.OFFER.value, 0),
            ),
        ]

        daily = [
            SeriesPoint(key=day, count=count)
            for day, count in self.repo.applications_per_day(user_id, days=30)
        ]

        recent = [
            RecentApplicationItem(
                id=application.id,
                job_id=application.job_id,
                status=application.status,
                applied_at=application.applied_at,
                created_at=application.created_at,
                job_title=title,
                company_name=company,
            )
            for application, title, company in self.repo.recent_applications(user_id)
        ]

        upcoming = [
            UpcomingInterviewItem(
                id=interview.id,
                application_id=interview.application_id,
                job_title=title,
                company_name=company,
                type=interview.type.value,
                scheduled_at=interview.scheduled_at,
                duration=interview.duration,
                interviewer=interview.interviewer,
                meeting_url=interview.meeting_url,
            )
            for interview, title, company in self.repo.upcoming_interviews(user_id, limit=5)
        ]

        today = _utcnow().date()
        follow_ups = [
            TaskItem(
                id=task.id,
                title=task.title,
                due_date=task.due_date,
                priority=task.priority,
                completed=task.completed,
                overdue=bool(task.due_date and task.due_date < today),
                job_title=task.job.title if task.job else None,
            )
            for task in self.tasks.upcoming(user_id, limit=6)
        ]

        high_priority = [
            HighPriorityJobItem(
                id=job.id,
                title=job.title,
                status=job.status,
                priority=job.priority,
                company_name=job.company.name if job.company else None,
                deadline=job.deadline,
            )
            for job in self.jobs.list_high_priority(user_id, limit=6)
        ]

        return DashboardOut(
            stats=stats,
            applications_over_time=daily,
            applications_by_status=by_status,
            jobs_by_source=by_source,
            jobs_by_company=by_company,
            interview_conversion=conversion,
            activity=daily,
            recent_applications=recent,
            upcoming_interviews=upcoming,
            follow_up_tasks=follow_ups,
            high_priority_jobs=high_priority,
        )

    # -- stats --------------------------------------------------------
    def stats(self, user_id: int) -> StatBlock:
        app_counts = self.repo.application_counts(user_id)
        job_counts = self.repo.job_status_counts(user_id)
        total_apps = sum(app_counts.values())
        total_jobs = sum(job_counts.values())

        responded = sum(
            app_counts.get(status.value, 0)
            for status in (
                ApplicationStatus.SCREENING,
                ApplicationStatus.INTERVIEW,
                ApplicationStatus.OFFER,
                ApplicationStatus.REJECTED,
            )
        )
        offers = app_counts.get(ApplicationStatus.OFFER.value, 0)
        reached_interview = app_counts.get(ApplicationStatus.INTERVIEW.value, 0) + offers
        overdue, _soon = self.repo.open_task_counts(user_id)

        first_created = self.session.scalar(
            select(func.min(Application.created_at)).where(Application.user_id == user_id)
        )
        weeks = 1.0
        if first_created is not None:
            if first_created.tzinfo is None:
                first_created = first_created.replace(tzinfo=timezone.utc)
            weeks = max(1.0, (_utcnow() - first_created).days / 7)

        return StatBlock(
            total_jobs=total_jobs,
            total_applications=total_apps,
            interviews=self.repo.interview_count(user_id),
            upcoming_interviews=self.repo.interview_count(user_id, upcoming=True),
            offers=offers,
            rejected=app_counts.get(ApplicationStatus.REJECTED.value, 0),
            overdue_tasks=overdue,
            response_rate=_rate(responded, total_apps),
            interview_rate=_rate(reached_interview, total_apps),
            offer_rate=_rate(offers, total_apps),
            avg_applications_per_week=round(total_apps / weeks, 1),
        )

    # -- analytics page ----------------------------------------------
    def overview(self, user_id: int) -> AnalyticsOverviewOut:
        stats = self.stats(user_id)
        app_counts = self.repo.application_counts(user_id)
        total_apps = sum(app_counts.values())

        responded = sum(
            app_counts.get(status.value, 0)
            for status in (
                ApplicationStatus.SCREENING,
                ApplicationStatus.INTERVIEW,
                ApplicationStatus.OFFER,
                ApplicationStatus.REJECTED,
            )
        )
        interviewed = (
            app_counts.get(ApplicationStatus.INTERVIEW.value, 0) + stats.offers
        )

        return AnalyticsOverviewOut(
            stats=stats,
            applications_per_week=[
                SeriesPoint(key=key, count=count)
                for key, count in self.repo.applications_per_week(user_id)
            ],
            applications_per_month=[
                SeriesPoint(key=key, count=count)
                for key, count in self.repo.applications_per_month(user_id)
            ],
            status_breakdown=self.status_breakdown(user_id),
            source_breakdown=self.source_breakdown(user_id),
            location_breakdown=self._job_breakdown(user_id, Job.location),
            job_type_breakdown=self._job_breakdown(user_id, Job.employment_type),
            avg_days_to_interview=self.repo.avg_days_applied_to_interview(user_id),
            rejection_rate=_rate(app_counts.get(ApplicationStatus.REJECTED.value, 0), total_apps),
            response_rate=_rate(responded, total_apps),
            interview_conversion_rate=_rate(interviewed, total_apps),
            offer_conversion_rate=_rate(stats.offers, total_apps),
        )

    def applications_series(self, user_id: int, days: int = 30) -> list[SeriesPoint]:
        return [
            SeriesPoint(key=day, count=count)
            for day, count in self.repo.applications_per_day(user_id, days=days)
        ]

    def status_breakdown(self, user_id: int) -> list[BreakdownItem]:
        counts = self.repo.application_counts(user_id)
        return [
            BreakdownItem(key=key, label=humanize(key), count=counts.get(key, 0))
            for key in [status.value for status in ApplicationStatus]
            if counts.get(key, 0) > 0
        ]

    def source_breakdown(self, user_id: int) -> list[BreakdownItem]:
        rows = [
            (key, count)
            for key, count in self.repo.applications_grouped(user_id, Application.source)
            if key not in ("None", "none")
        ]
        return _sorted_breakdown(rows)

    # -- helpers ------------------------------------------------------
    def _job_breakdown(self, user_id: int, column) -> list[BreakdownItem]:
        rows = [
            (key, count)
            for key, count in self.repo.job_column_grouped(user_id, column)
            if key not in ("None", "none")
        ]
        return _sorted_breakdown(rows)

    def _company_breakdown(self, user_id: int) -> list[BreakdownItem]:
        stmt = (
            select(Company.name, func.count(Job.id))
            .outerjoin(Job, Job.company_id == Company.id)
            .where(Company.user_id == user_id)
            .group_by(Company.id, Company.name)
            .order_by(func.count(Job.id).desc())
        )
        rows = [(name, int(count)) for name, count in self.session.execute(stmt).all()]
        return _sorted_breakdown(rows)


def _rate(numerator: int, denominator: int) -> float:
    if not denominator:
        return 0.0
    return round((numerator / denominator) * 100, 1)


def _sorted_breakdown(rows: list[tuple[str, int]]) -> list[BreakdownItem]:
    items = [
        BreakdownItem(key=key or "unknown", label=humanize(key), count=count)
        for key, count in rows
        if count > 0
    ]
    return sorted(items, key=lambda item: -item.count)
