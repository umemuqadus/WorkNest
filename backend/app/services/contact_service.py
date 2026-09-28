from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequest, NotFound
from app.models.contact import Contact
from app.repositories.contact import ContactRepository
from app.schemas.common import build_page
from app.schemas.contact import ContactCreate, ContactOut, ContactPatch


class ContactService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = ContactRepository(session)

    def list(
        self,
        user_id: int,
        *,
        q: str | None,
        company_id: int | None,
        limit: int,
        offset: int,
    ) -> dict:
        contacts, total = self.repo.list(
            user_id, q=q, company_id=company_id, limit=limit, offset=offset
        )
        contacts = self._load_companies(contacts)
        items = [self._to_out(contact) for contact in contacts]
        return build_page(items, total, limit, offset)

    def get(self, user_id: int, contact_id: int) -> ContactOut:
        contact = self.repo.get_for_user(contact_id, user_id)
        self._load_companies([contact])
        return self._to_out(contact)

    def create(self, user_id: int, payload: ContactCreate) -> ContactOut:
        data = payload.model_dump()
        self._assert_company(user_id, data.get("company_id"))
        contact = Contact(user_id=user_id, **data)
        self.repo.add(contact)
        self.repo.commit()
        self.repo.refresh(contact)
        self._load_companies([contact])
        return self._to_out(contact)

    def update(self, user_id: int, contact_id: int, payload: ContactPatch) -> ContactOut:
        contact = self.repo.get_for_user(contact_id, user_id)
        data = payload.model_dump(exclude_unset=True)
        if "company_id" in data:
            self._assert_company(user_id, data.get("company_id"))
        for key, value in data.items():
            setattr(contact, key, value)
        self.repo.commit()
        self.repo.refresh(contact)
        self._load_companies([contact])
        return self._to_out(contact)

    def delete(self, user_id: int, contact_id: int) -> None:
        contact = self.repo.get_for_user(contact_id, user_id)
        self.repo.delete(contact)
        self.repo.commit()

    def _assert_company(self, user_id: int, company_id: int | None) -> None:
        if company_id is None:
            return
        from app.models.company import Company

        company = self.session.get(Company, company_id)
        if company is None or company.user_id != user_id:
            raise BadRequest("Unknown company.", field="company_id")

    def _load_companies(self, contacts: list[Contact]) -> list[Contact]:
        for contact in contacts:
            _ = contact.company  # trigger load
        return contacts

    def _to_out(self, contact: Contact) -> ContactOut:
        from app.schemas.company import CompanyBrief

        out = ContactOut.model_validate(contact)
        out.company = (
            CompanyBrief.model_validate(contact.company) if contact.company else None
        )
        return out
