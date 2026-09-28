"""Aggregation queries powering the dashboard and analytics pages."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.enums import ApplicationStatus, JobStatus
from app.models.interview import Interview
from app.models.job import Job
from app.models.task import Task


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AnalyticsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    # -- counts -------------------------------------------------------
    def job_count(self, user_id: int) -> int:
        return int(
            self.session.scalar(
                select(func.count()).select_from(Job).where(Job.user_id == user_id)
            )
            or 0
        )

    def application_counts(self, user_id: int) -> dict[str, int]:
        stmt = (
            select(Application.status, func.count(Application.id))
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        )
        return {self._key(status): int(count) for status, count in self.session.execute(stmt).all()}

    def job_status_counts(self, user_id: int) -> dict[str, int]:
        stmt = (
            select(Job.status, func.count(Job.id))
            .where(Job.user_id == user_id)
            .group_by(Job.status)
        )
        return {self._key(status): int(count) for status, count in self.session.execute(stmt).all()}

    @staticmethod
    def _key(value) -> str:
        """Enum columns must be keyed by their *value* (``applied`` not ``X.APPLIED``)."""
        return getattr(value, "value", value)

    def interview_count(self, user_id: int, *, upcoming: bool = False) -> int:
        stmt = (
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .where(Application.user_id == user_id)
        )
        if upcoming:
            stmt = stmt.where(Interview.scheduled_at >= _utcnow())
        return int(self.session.scalar(stmt) or 0)

    def upcoming_interviews(self, user_id: int, limit: int = 5) -> list:
        from app.models.company import Company
        from app.models.job import Job

        stmt = (
            select(Interview, Job.title, Company.name)
            .join(Application, Interview.application_id == Application.id)
            .join(Job, Application.job_id == Job.id)
            .outerjoin(Company, Job.company_id == Company.id)
            .where(Application.user_id == user_id, Interview.scheduled_at >= _utcnow())
            .order_by(Interview.scheduled_at.asc())
            .limit(limit)
        )
        return list(self.session.execute(stmt).all())

    # -- time series --------------------------------------------------
    def applications_per_day(self, user_id: int, days: int = 30) -> list[tuple[str, int]]:
        start = _utcnow() - timedelta(days=days)
        created = func.date(Application.created_at)
        stmt = (
            select(created, func.count(Application.id))
            .where(Application.user_id == user_id, Application.created_at >= start)
            .group_by(created)
            .order_by(created)
        )
        rows = list(self.session.execute(stmt).all())
        counts = {str(day): int(count) for day, count in rows}

        series: list[tuple[str, int]] = []
        for offset in range(days, -1, -1):
            day = (_utcnow() - timedelta(days=offset)).date().isoformat()
            series.append((day, counts.get(day, 0)))
        return series

    def applications_per_week(self, user_id: int, weeks: int = 12) -> list[tuple[str, int]]:
        start = _utcnow() - timedelta(weeks=weeks)
        stmt = (
            select(Application.created_at)
            .where(Application.user_id == user_id, Application.created_at >= start)
        )
        buckets: dict[str, int] = {}
        for (created_at,) in self.session.execute(stmt).all():
            if created_at is None:
                continue
            moment = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
            week_start = (moment - timedelta(days=moment.weekday())).date().isoformat()
            buckets[week_start] = buckets.get(week_start, 0) + 1

        series: list[tuple[str, int]] = []
        for offset in range(weeks, -1, -1):
            week = (_utcnow() - timedelta(weeks=offset) - timedelta(days=0)).date()
            week = week - timedelta(days=week.weekday())
            key = week.isoformat()
            series.append((key, buckets.get(key, 0)))
        return series

    def applications_per_month(self, user_id: int, months: int = 12) -> list[tuple[str, int]]:
        start = _utcnow() - timedelta(days=31 * months)
        stmt = (
            select(Application.created_at)
            .where(Application.user_id == user_id, Application.created_at >= start)
        )
        buckets: dict[str, int] = {}
        for (created_at,) in self.session.execute(stmt).all():
            if created_at is None:
                continue
            moment = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
            key = moment.strftime("%Y-%m")
            buckets[key] = buckets.get(key, 0) + 1

        series: list[tuple[str, int]] = []
        cursor = _utcnow().replace(day=1)
        for _ in range(months + 1):
            key = cursor.strftime("%Y-%m")
            series.append((key, buckets.get(key, 0)))
            cursor = (cursor - timedelta(days=1)).replace(day=1)
        series.reverse()
        return series

    # -- breakdowns ---------------------------------------------------
    def group_count(
        self, user_id: int, column, *, label_column=None, filters: list | None = None
    ) -> list[tuple[str, int]]:
        stmt = select(column, func.count(Job.id)).where(Job.user_id == user_id)
        if filters:
            for condition in filters:
                stmt = stmt.where(condition)
        if label_column is not None and label_column is not column:
            stmt = stmt.group_by(column, label_column)
            rows = self.session.execute(stmt).all()
            return [(str(label), int(count)) for label, count in rows]
        stmt = stmt.group_by(column)
        return [(str(key), int(count)) for key, count in self.session.execute(stmt).all()]

    def applications_grouped(self, user_id: int, column) -> list[tuple[str, int]]:
        stmt = (
            select(column, func.count(Application.id))
            .where(Application.user_id == user_id)
            .group_by(column)
        )
        return [(str(key), int(count)) for key, count in self.session.execute(stmt).all()]

    def job_column_grouped(self, user_id: int, column) -> list[tuple[str, int]]:
        stmt = (
            select(column, func.count(Job.id)).where(Job.user_id == user_id).group_by(column)
        )
        return [(str(key), int(count)) for key, count in self.session.execute(stmt).all()]

    # -- conversion metrics -------------------------------------------
    def avg_days_applied_to_interview(self, user_id: int) -> float | None:
        first_interview = (
            select(
                Interview.application_id,
                func.min(Interview.scheduled_at).label("first_interview_at"),
            )
            .group_by(Interview.application_id)
            .subquery()
        )

        bind = self.session.get_bind()
        dialect = bind.dialect.name if bind is not None else ""
        if dialect == "postgresql":
            # EXTRACT(EPOCH ...) yields seconds; convert to days.
            elapsed = (
                func.extract(
                    "epoch",
                    first_interview.c.first_interview_at - Application.applied_at,
                )
                / 86400.0
            )
        else:  # sqlite (tests)
            elapsed = func.julianday(first_interview.c.first_interview_at) - func.julianday(
                Application.applied_at
            )

        stmt = (
            select(func.avg(elapsed))
            .join(first_interview, first_interview.c.application_id == Application.id)
            .where(
                Application.user_id == user_id,
                Application.applied_at.is_not(None),
                first_interview.c.first_interview_at.is_not(None),
            )
        )
        value = self.session.scalar(stmt)
        return round(float(value), 1) if value is not None else None

    def open_task_counts(self, user_id: int) -> tuple[int, int]:
        """(overdue, due within 7 days)"""
        today = _utcnow().date()
        overdue = int(
            self.session.scalar(
                select(func.count())
                .select_from(Task)
                .where(
                    Task.user_id == user_id,
                    Task.completed.is_(False),
                    Task.due_date.is_not(None),
                    Task.due_date < today,
                )
            )
            or 0
        )
        soon = int(
            self.session.scalar(
                select(func.count())
                .select_from(Task)
                .where(
                    Task.user_id == user_id,
                    Task.completed.is_(False),
                    Task.due_date.is_not(None),
                    Task.due_date >= today,
                    Task.due_date <= today + timedelta(days=7),
                )
            )
            or 0
        )
        return overdue, soon

    def recent_applications(self, user_id: int, limit: int = 6) -> list:
        from app.models.company import Company
        from app.models.job import Job

        stmt = (
            select(Application, Job.title, Company.name)
            .join(Job, Application.job_id == Job.id)
            .outerjoin(Company, Job.company_id == Company.id)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc(), Application.id.desc())
            .limit(limit)
        )
        return list(self.session.execute(stmt).all())
