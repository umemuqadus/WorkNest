from typing import Annotated, Optional

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.enums import ApplicationStatus
from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailOut,
    ApplicationOut,
    ApplicationPatch,
)
from app.schemas.common import Page
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=Page[ApplicationOut])
def list_applications(
    db: DbSession,
    user: CurrentUser,
    status_filter: Annotated[Optional[list[ApplicationStatus]], Query(alias="status")] = None,
    job_id: Annotated[Optional[int], Query(ge=1)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[ApplicationOut]:
    return ApplicationService(db).list(  # type: ignore[return-value]
        user.id, statuses=status_filter, job_id=job_id, limit=limit, offset=offset
    )


@router.post("", response_model=ApplicationDetailOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate, db: DbSession, user: CurrentUser
) -> ApplicationDetailOut:
    return ApplicationService(db).create(user.id, payload)


@router.get("/{application_id}", response_model=ApplicationDetailOut)
def get_application(
    application_id: int, db: DbSession, user: CurrentUser
) -> ApplicationDetailOut:
    return ApplicationService(db).get(user.id, application_id)


@router.patch("/{application_id}", response_model=ApplicationDetailOut)
def update_application(
    application_id: int, payload: ApplicationPatch, db: DbSession, user: CurrentUser
) -> ApplicationDetailOut:
    return ApplicationService(db).update(user.id, application_id, payload)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: int, db: DbSession, user: CurrentUser) -> None:
    ApplicationService(db).delete(user.id, application_id)
