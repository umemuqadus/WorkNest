from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    model = Resume

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(self, user_id: int) -> list[Resume]:
        stmt = (
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.is_default.desc(), Resume.updated_at.desc())
        )
        return list(self.session.scalars(stmt).all())

    def default_for(self, user_id: int) -> Resume | None:
        stmt = (
            select(Resume)
            .where(Resume.user_id == user_id, Resume.is_default.is_(True))
            .order_by(Resume.updated_at.desc())
            .limit(1)
        )
        return self.session.scalars(stmt).first()

    def count_for(self, user_id: int) -> int:
        return int(
            self.session.scalar(
                select(func.count()).select_from(Resume).where(Resume.user_id == user_id)
            )
            or 0
        )

    def clear_default(self, user_id: int, keep_id: int | None = None) -> None:
        stmt = select(Resume).where(Resume.user_id == user_id, Resume.is_default.is_(True))
        for resume in self.session.scalars(stmt).all():
            if keep_id is None or resume.id != keep_id:
                resume.is_default = False
        self.session.flush()
