from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.resume import ResumeCreate, ResumeOut, ResumePatch, ResumeSummary
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("", response_model=list[ResumeSummary])
def list_resumes(db: DbSession, user: CurrentUser) -> list[ResumeSummary]:
    return ResumeService(db).list(user.id)


@router.post("", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
def create_resume(payload: ResumeCreate, db: DbSession, user: CurrentUser) -> ResumeOut:
    return ResumeService(db).create(user.id, payload)


@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume(resume_id: int, db: DbSession, user: CurrentUser) -> ResumeOut:
    return ResumeService(db).get(user.id, resume_id)


@router.patch("/{resume_id}", response_model=ResumeOut)
def update_resume(
    resume_id: int, payload: ResumePatch, db: DbSession, user: CurrentUser
) -> ResumeOut:
    return ResumeService(db).update(user.id, resume_id, payload)


@router.post("/{resume_id}/default", response_model=ResumeOut)
def set_default_resume(resume_id: int, db: DbSession, user: CurrentUser) -> ResumeOut:
    return ResumeService(db).set_default(user.id, resume_id)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: int, db: DbSession, user: CurrentUser) -> None:
    ResumeService(db).delete(user.id, resume_id)
