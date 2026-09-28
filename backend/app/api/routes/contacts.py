from typing import Annotated, Optional

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.contact import ContactCreate, ContactOut, ContactPatch
from app.services.contact_service import ContactService

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=Page[ContactOut])
def list_contacts(
    db: DbSession,
    user: CurrentUser,
    q: Annotated[Optional[str], Query(max_length=200)] = None,
    company_id: Annotated[Optional[int], Query(ge=1)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[ContactOut]:
    return ContactService(db).list(  # type: ignore[return-value]
        user.id, q=q, company_id=company_id, limit=limit, offset=offset
    )


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: DbSession, user: CurrentUser) -> ContactOut:
    return ContactService(db).create(user.id, payload)


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(contact_id: int, db: DbSession, user: CurrentUser) -> ContactOut:
    return ContactService(db).get(user.id, contact_id)


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: int, payload: ContactPatch, db: DbSession, user: CurrentUser
) -> ContactOut:
    return ContactService(db).update(user.id, contact_id, payload)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: DbSession, user: CurrentUser) -> None:
    ContactService(db).delete(user.id, contact_id)
