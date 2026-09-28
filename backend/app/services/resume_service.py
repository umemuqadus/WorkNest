from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequest, NotFound
from app.models.resume import Resume
from app.repositories.resume import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeOut, ResumePatch, ResumeSummary


class ResumeService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = ResumeRepository(session)

    def list(self, user_id: int) -> list[ResumeSummary]:
        resumes = self.repo.list(user_id)
        return [
            ResumeSummary(
                id=resume.id,
                name=resume.name,
                is_default=resume.is_default,
                file_url=resume.file_url,
                preview=" ".join(resume.content.split())[:220],
                created_at=resume.created_at,
                updated_at=resume.updated_at,
            )
            for resume in resumes
        ]

    def get(self, user_id: int, resume_id: int) -> ResumeOut:
        return ResumeOut.model_validate(self.repo.get_for_user(resume_id, user_id))

    def create(self, user_id: int, payload: ResumeCreate) -> ResumeOut:
        if self.repo.count_for(user_id) >= 20:
            raise BadRequest("Resume limit reached (20). Delete one to add another.")

        data = payload.model_dump()
        is_default = data.pop("is_default")
        if is_default or self.repo.count_for(user_id) == 0:
            self.repo.clear_default(user_id)
            is_default = True

        resume = Resume(user_id=user_id, is_default=is_default, **data)
        self.repo.add(resume)
        self.repo.commit()
        self.repo.refresh(resume)
        return ResumeOut.model_validate(resume)

    def update(self, user_id: int, resume_id: int, payload: ResumePatch) -> ResumeOut:
        resume = self.repo.get_for_user(resume_id, user_id)
        data = payload.model_dump(exclude_unset=True)
        if data.pop("is_default", None):
            self.repo.clear_default(user_id, keep_id=resume.id)
            resume.is_default = True
        for key, value in data.items():
            setattr(resume, key, value)
        self.repo.commit()
        self.repo.refresh(resume)
        return ResumeOut.model_validate(resume)

    def set_default(self, user_id: int, resume_id: int) -> ResumeOut:
        resume = self.repo.get_for_user(resume_id, user_id)
        self.repo.clear_default(user_id, keep_id=resume.id)
        resume.is_default = True
        self.repo.commit()
        self.repo.refresh(resume)
        return ResumeOut.model_validate(resume)

    def delete(self, user_id: int, resume_id: int) -> None:
        resume = self.repo.get_for_user(resume_id, user_id)
        was_default = resume.is_default
        self.repo.delete(resume)
        if was_default:
            remaining = self.repo.list(user_id)
            if remaining:
                remaining[0].is_default = True
        self.repo.commit()

    def default(self, user_id: int) -> Resume | None:
        return self.repo.default_for(user_id)
