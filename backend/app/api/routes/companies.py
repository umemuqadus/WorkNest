from typing import Annotated, Optional

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.company import CompanyCreate, CompanyOut, CompanyPatch
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=Page[CompanyOut])
def list_companies(
    db: DbSession,
    user: CurrentUser,
    q: Annotated[Optional[str], Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[CompanyOut]:
    return CompanyService(db).list(user.id, q=q, limit=limit, offset=offset)  # type: ignore[return-value]


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: DbSession, user: CurrentUser) -> CompanyOut:
    return CompanyService(db).create(user.id, payload)


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: DbSession, user: CurrentUser) -> CompanyOut:
    return CompanyService(db).get(user.id, company_id)


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int, payload: CompanyPatch, db: DbSession, user: CurrentUser
) -> CompanyOut:
    return CompanyService(db).update(user.id, company_id, payload)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: DbSession, user: CurrentUser) -> None:
    CompanyService(db).delete(user.id, company_id)
