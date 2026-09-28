from __future__ import annotations

from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.job import Job
from app.models.task import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    model = Task

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(
        self,
        user_id: int,
        *,
        completed: bool | None = None,
        overdue_before: date | None = None,
        due_before: date | None = None,
        q: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Task], int]:
        stmt = select(Task).where(Task.user_id == user_id)
        if completed is not None:
            stmt = stmt.where(Task.completed.is_(completed))
        if overdue_before:
            stmt = stmt.where(Task.due_date.is_not(None), Task.due_date < overdue_before)
        if due_before:
            stmt = stmt.where(Task.due_date.is_not(None), Task.due_date <= due_before)
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))

        total = int(self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
        rows = (
            self.session.scalars(
                stmt.options(joinedload(Task.job).joinedload(Job.company))
                .order_by(Task.completed.asc(), Task.due_date.is_(None), Task.due_date.asc())
                .limit(limit)
                .offset(offset)
            )
            .all()
        )
        return list(rows), total

    def upcoming(self, user_id: int, limit: int = 5) -> list[Task]:
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).date()
        stmt = (
            select(Task)
            .where(
                Task.user_id == user_id,
                Task.completed.is_(False),
                Task.due_date.is_not(None),
                Task.due_date >= today,
            )
            .order_by(Task.due_date.asc())
            .limit(limit)
        )
        return list(self.session.scalars(stmt).all())
