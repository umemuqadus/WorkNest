from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.company import Company
from app.models.contact import Contact
from app.models.job import Job
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    model = Company

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list(
        self,
        user_id: int,
        *,
        q: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Company], int]:
        stmt = select(Company).where(Company.user_id == user_id)
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    Company.name.ilike(pattern),
                    Company.industry.ilike(pattern),
                    Company.location.ilike(pattern),
                )
            )

        total = self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        stmt = stmt.order_by(Company.name.asc()).limit(limit).offset(offset)
        return list(self.session.scalars(stmt).all()), int(total)

    def counts_by_company(self, user_id: int) -> list[tuple[str, int]]:
        stmt = (
            select(Company.name, func.count(Job.id))
            .outerjoin(Job, Job.company_id == Company.id)
            .where(Company.user_id == user_id)
            .group_by(Company.id, Company.name)
            .order_by(func.count(Job.id).desc())
        )
        return [(str(name), int(count)) for name, count in self.session.execute(stmt).all()]

    def has_dependencies(self, company: Company) -> tuple[int, int]:
        job_count = self.session.scalar(
            select(func.count()).select_from(Job).where(Job.company_id == company.id)
        )
        contact_count = self.session.scalar(
            select(func.count()).select_from(Contact).where(Contact.company_id == company.id)
        )
        return int(job_count or 0), int(contact_count or 0)

    def with_counts(self, company: Company) -> tuple[int, int]:
        return self.has_dependencies(company)
