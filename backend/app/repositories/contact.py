from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.repositories.base import BaseRepository


class ContactRepository(BaseRepository[Contact]):
    model = Contact

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(
        self,
        user_id: int,
        *,
        q: str | None = None,
        company_id: int | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Contact], int]:
        stmt = select(Contact).where(Contact.user_id == user_id)
        if company_id:
            stmt = stmt.where(Contact.company_id == company_id)
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    Contact.name.ilike(pattern),
                    Contact.email.ilike(pattern),
                    Contact.job_title.ilike(pattern),
                )
            )

        total = self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        stmt = stmt.order_by(Contact.name.asc()).limit(limit).offset(offset)
        return list(self.session.scalars(stmt).all()), int(total)
