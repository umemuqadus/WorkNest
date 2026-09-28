from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequest, NotFound
from app.models.application import Application
from app.models.interview import Interview
from app.models.job import Job
from app.repositories.interview import InterviewRepository
from app.schemas.common import build_page
from app.schemas.interview import InterviewCreate, InterviewOut, InterviewPatch


class InterviewService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = InterviewRepository(session)

    def list(
        self,
        user_id: int,
        *,
        upcoming_only: bool = False,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        rows, total = self.repo.list(
            user_id,
            upcoming_only=upcoming_only,
            from_date=date_from,
            to_date=date_to,
            limit=limit,
            offset=offset,
        )
        items = [self._to_out(row) for row in rows]
        return build_page(items, total, limit, offset)

    def get(self, user_id: int, interview_id: int) -> InterviewOut:
        interview = self.repo.get_owned(interview_id, user_id)
        if interview is None:
            raise NotFound("interview not found.")
        return self._to_out(interview)

    def create(self, user_id: int, payload: InterviewCreate) -> InterviewOut:
        application = self.session.get(Application, payload.application_id)
        if application is None or application.user_id != user_id:
            raise BadRequest("Unknown application.", field="application_id")

        data = payload.model_dump()
        interview = Interview(**data)
        self.session.add(interview)
        self.session.flush()
        self.session.commit()
        self.session.refresh(interview)
        return self._to_out(interview)

    def update(self, user_id: int, interview_id: int, payload: InterviewPatch) -> InterviewOut:
        interview = self.repo.get_owned(interview_id, user_id)
        if interview is None:
            raise NotFound("interview not found.")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(interview, key, value)
        self.session.commit()
        self.session.refresh(interview)
        return self._to_out(interview)

    def delete(self, user_id: int, interview_id: int) -> None:
        interview = self.repo.get_owned(interview_id, user_id)
        if interview is None:
            raise NotFound("interview not found.")
        self.session.delete(interview)
        self.session.commit()

    def _to_out(self, interview: Interview) -> InterviewOut:
        out = InterviewOut.model_validate(interview)
        application = interview.application
        if application is not None:
            job: Job | None = application.job
            if job is not None:
                out.job_id = job.id
                out.job_title = job.title
                out.company_name = job.company.name if job.company else None
        return out
