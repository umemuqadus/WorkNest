from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.interview import InterviewCreate, InterviewOut, InterviewPatch
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("", response_model=Page[InterviewOut])
def list_interviews(
    db: DbSession,
    user: CurrentUser,
    upcoming: Annotated[bool, Query(alias="upcoming")] = False,
    date_from: Annotated[Optional[datetime], Query(alias="from")] = None,
    date_to: Annotated[Optional[datetime], Query(alias="to")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[InterviewOut]:
    return InterviewService(db).list(  # type: ignore[return-value]
        user.id,
        upcoming_only=upcoming,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=InterviewOut, status_code=status.HTTP_201_CREATED)
def create_interview(payload: InterviewCreate, db: DbSession, user: CurrentUser) -> InterviewOut:
    return InterviewService(db).create(user.id, payload)


@router.get("/{interview_id}", response_model=InterviewOut)
def get_interview(interview_id: int, db: DbSession, user: CurrentUser) -> InterviewOut:
    return InterviewService(db).get(user.id, interview_id)


@router.patch("/{interview_id}", response_model=InterviewOut)
def update_interview(
    interview_id: int, payload: InterviewPatch, db: DbSession, user: CurrentUser
) -> InterviewOut:
    return InterviewService(db).update(user.id, interview_id, payload)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(interview_id: int, db: DbSession, user: CurrentUser) -> None:
    InterviewService(db).delete(user.id, interview_id)
