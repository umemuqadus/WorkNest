from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application, ApplicationStatusHistory
from app.models.enums import ApplicationStatus
from app.models.job import Job
from app.repositories.base import BaseRepository


class ApplicationRepository(BaseRepository[Application]):
    model = Application

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(
        self,
        user_id: int,
        *,
        statuses: list[ApplicationStatus] | None = None,
        job_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Application], int]:
        stmt = select(Application).where(Application.user_id == user_id)
        if statuses:
            stmt = stmt.where(Application.status.in_(statuses))
        if job_id:
            stmt = stmt.where(Application.job_id == job_id)

        total = int(
            self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        )
        rows = (
            self.session.scalars(
                stmt.options(joinedload(Application.job).joinedload(Job.company))
                .order_by(Application.updated_at.desc(), Application.id.desc())
                .limit(limit)
                .offset(offset)
            )
            .all()
        )
        return list(rows), total

    def find_by_job(self, job_id: int) -> Application | None:
        stmt = select(Application).where(Application.job_id == job_id)
        return self.session.scalars(stmt).first()

    def statuses_for_user(self, user_id: int) -> list[ApplicationStatus]:
        stmt = select(Application.status).where(Application.user_id == user_id)
        return list(self.session.scalars(stmt).all())


class StatusHistoryRepository(BaseRepository[ApplicationStatusHistory]):
    model = ApplicationStatusHistory

    def for_application(self, application_id: int) -> list[ApplicationStatusHistory]:
        stmt = (
            select(ApplicationStatusHistory)
            .where(ApplicationStatusHistory.application_id == application_id)
            .order_by(ApplicationStatusHistory.id.desc())
        )
        return list(self.session.scalars(stmt).all())
