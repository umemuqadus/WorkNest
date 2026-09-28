from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.interview import Interview
from app.models.job import Job
from app.repositories.base import BaseRepository


class InterviewRepository(BaseRepository[Interview]):
    model = Interview

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(
        self,
        user_id: int,
        *,
        upcoming_only: bool = False,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Interview], int]:
        from app.models.application import Application

        stmt = (
            select(Interview)
            .join(Application, Interview.application_id == Application.id)
            .where(Application.user_id == user_id)
        )
        if upcoming_only:
            stmt = stmt.where(Interview.scheduled_at >= datetime.now(timezone.utc))
        if from_date:
            stmt = stmt.where(Interview.scheduled_at >= from_date)
        if to_date:
            stmt = stmt.where(Interview.scheduled_at <= to_date)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(self.session.scalar(count_stmt) or 0)

        rows = (
            self.session.scalars(
                stmt.options(joinedload(Interview.application).joinedload(Application.job))
                .order_by(Interview.scheduled_at.asc(), Interview.id.asc())
                .limit(limit)
                .offset(offset)
            )
            .all()
        )
        return list(rows), total

    def get_owned(self, interview_id: int, user_id: int) -> Interview | None:
        from app.models.application import Application

        stmt = (
            select(Interview)
            .join(Application, Interview.application_id == Application.id)
            .where(Interview.id == interview_id, Application.user_id == user_id)
        )
        return self.session.scalars(stmt).first()

    def search_text(self, user_id: int, q: str) -> list[Interview]:
        from app.models.application import Application

        pattern = f"%{q.strip()}%"
        stmt = (
            select(Interview)
            .join(Application, Interview.application_id == Application.id)
            .where(
                Application.user_id == user_id,
                or_(Interview.interviewer.ilike(pattern), Interview.location.ilike(pattern)),
            )
            .limit(20)
        )
        return list(self.session.scalars(stmt).all())
