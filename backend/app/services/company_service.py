from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFound
from app.models.company import Company
from app.repositories.company import CompanyRepository
from app.schemas.common import build_page
from app.schemas.company import CompanyCreate, CompanyOut, CompanyPatch


class CompanyService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = CompanyRepository(session)

    def list(self, user_id: int, *, q: str | None, limit: int, offset: int) -> dict:
        companies, total = self.repo.list(user_id, q=q, limit=limit, offset=offset)
        items = [self._to_out(company) for company in companies]
        return build_page(items, total, limit, offset)

    def get(self, user_id: int, company_id: int) -> CompanyOut:
        company = self.repo.get_for_user(company_id, user_id)
        return self._to_out(company)

    def create(self, user_id: int, payload: CompanyCreate) -> CompanyOut:
        company = Company(user_id=user_id, **payload.model_dump())
        self.repo.add(company)
        self.repo.commit()
        self.repo.refresh(company)
        return self._to_out(company)

    def update(self, user_id: int, company_id: int, payload: CompanyPatch) -> CompanyOut:
        company = self.repo.get_for_user(company_id, user_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(company, key, value)
        self.repo.commit()
        self.repo.refresh(company)
        return self._to_out(company)

    def delete(self, user_id: int, company_id: int) -> None:
        company = self.repo.get_for_user(company_id, user_id)
        self.repo.delete(company)
        self.repo.commit()

    def _to_out(self, company: Company) -> CompanyOut:
        out = CompanyOut.model_validate(company)
        job_count, contact_count = self.repo.has_dependencies(company)
        out.job_count = job_count
        out.contact_count = contact_count
        return out
