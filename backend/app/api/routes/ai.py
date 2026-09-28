"""AI endpoints.

Every route supports ``?refresh=true`` to force regeneration; otherwise the
cached database record is returned (no AI call, no cost).
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.ai import provider_status
from app.api.deps import CurrentUser, DbSession
from app.core.rate_limit import ai_rate_limit
from app.schemas.ai import (
    AIStatusOut,
    ApplicationSuggestionOut,
    InterviewPrepOut,
    JobAnalysisOut,
    JobMatchOut,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])
guarded = [Depends(ai_rate_limit())]


@router.get("/status", response_model=AIStatusOut, dependencies=guarded)
def ai_status() -> AIStatusOut:
    return AIStatusOut(**provider_status())


@router.post("/jobs/{job_id}/analyze", response_model=JobAnalysisOut, dependencies=guarded)
async def analyze_job(
    job_id: int,
    db: DbSession,
    user: CurrentUser,
    refresh: Annotated[bool, Query()] = False,
) -> JobAnalysisOut:
    record = await AIService(db).analyze_job(user.id, job_id, refresh=refresh)
    return JobAnalysisOut.model_validate(record)


@router.get("/jobs/{job_id}/analysis", response_model=Optional[JobAnalysisOut])
def get_analysis(job_id: int, db: DbSession, user: CurrentUser) -> Optional[JobAnalysisOut]:
    record = AIService(db).get_analysis(user.id, job_id)
    return JobAnalysisOut.model_validate(record) if record else None


@router.post("/jobs/{job_id}/match", response_model=JobMatchOut, dependencies=guarded)
async def match_job(
    job_id: int,
    db: DbSession,
    user: CurrentUser,
    resume_id: Annotated[Optional[int], Query(ge=1)] = None,
    refresh: Annotated[bool, Query()] = False,
) -> JobMatchOut:
    record = await AIService(db).match_job(user.id, job_id, resume_id, refresh=refresh)
    return JobMatchOut.model_validate(record)


@router.get("/jobs/{job_id}/match", response_model=Optional[JobMatchOut])
def get_match(
    job_id: int,
    db: DbSession,
    user: CurrentUser,
    resume_id: Annotated[Optional[int], Query(ge=1)] = None,
) -> Optional[JobMatchOut]:
    record = AIService(db).get_match(user.id, job_id, resume_id)
    return JobMatchOut.model_validate(record) if record else None


@router.post("/jobs/{job_id}/interview-prep", response_model=InterviewPrepOut, dependencies=guarded)
async def interview_prep(
    job_id: int,
    db: DbSession,
    user: CurrentUser,
    resume_id: Annotated[Optional[int], Query(ge=1)] = None,
    refresh: Annotated[bool, Query()] = False,
) -> InterviewPrepOut:
    record = await AIService(db).prepare_interview(user.id, job_id, resume_id, refresh=refresh)
    return InterviewPrepOut.model_validate(record)


@router.get("/jobs/{job_id}/interview-prep", response_model=Optional[InterviewPrepOut])
def get_interview_prep(
    job_id: int,
    db: DbSession,
    user: CurrentUser,
) -> Optional[InterviewPrepOut]:
    record = AIService(db).get_preparation(user.id, job_id)
    return InterviewPrepOut.model_validate(record) if record else None


@router.delete("/jobs/{job_id}/interview-prep", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview_prep(job_id: int, db: DbSession, user: CurrentUser) -> None:
    AIService(db).delete_preparation(user.id, job_id)


@router.post(
    "/jobs/{job_id}/application-suggestions",
    response_model=ApplicationSuggestionOut,
    dependencies=guarded,
)
async def application_suggestions(
    job_id: int,
    db: DbSession,
    user: CurrentUser,
    resume_id: Annotated[Optional[int], Query(ge=1)] = None,
    refresh: Annotated[bool, Query()] = False,
) -> ApplicationSuggestionOut:
    record = await AIService(db).suggest_application(
        user.id, job_id, resume_id, refresh=refresh
    )
    return ApplicationSuggestionOut.model_validate(record)


@router.get("/jobs/{job_id}/application-suggestions", response_model=Optional[ApplicationSuggestionOut])
def get_application_suggestions(
    job_id: int, db: DbSession, user: CurrentUser
) -> Optional[ApplicationSuggestionOut]:
    record = AIService(db).get_suggestions(user.id, job_id)
    return ApplicationSuggestionOut.model_validate(record) if record else None
