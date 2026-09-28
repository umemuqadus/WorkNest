"""Application lifecycle incl. status history and job status synchronisation."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequest, Conflict, NotFound
from app.models.application import Application, ApplicationStatusHistory
from app.models.enums import ApplicationStatus, JobStatus
from app.models.job import Job
from app.repositories.application import ApplicationRepository, StatusHistoryRepository
from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailOut,
    ApplicationOut,
    ApplicationPatch,
    JobBrief,
    StatusHistoryOut,
)
from app.schemas.common import build_page
from app.schemas.company import CompanyBrief
from app.schemas.interview import InterviewOut

#: Keep the parent job in sync whenever an application status changes.
STATUS_TO_JOB_STATUS: dict[ApplicationStatus, JobStatus] = {
    ApplicationStatus.SAVED: JobStatus.SAVED,
    ApplicationStatus.APPLIED: JobStatus.APPLIED,
    ApplicationStatus.SCREENING: JobStatus.APPLIED,
    ApplicationStatus.INTERVIEW: JobStatus.INTERVIEW,
    ApplicationStatus.OFFER: JobStatus.OFFER,
    ApplicationStatus.REJECTED: JobStatus.REJECTED,
    ApplicationStatus.WITHDRAWN: JobStatus.WITHDRAWN,
}

APPLICATION_STATUSES_WITH_RESPONSE = {
    ApplicationStatus.SCREENING,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ApplicationService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = ApplicationRepository(session)
        self.history = StatusHistoryRepository(session)

    def list(
        self,
        user_id: int,
        *,
        statuses: list[ApplicationStatus] | None = None,
        job_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        rows, total = self.repo.list(
            user_id, statuses=statuses, job_id=job_id, limit=limit, offset=offset
        )
        items = [self._to_out(application) for application in rows]
        return build_page(items, total, limit, offset)

    def get(self, user_id: int, application_id: int) -> ApplicationDetailOut:
        application = self.repo.get_for_user(application_id, user_id)
        base = self._to_out(application)
        detail = ApplicationDetailOut.model_validate(base.model_dump())
        detail.history = [StatusHistoryOut.model_validate(row) for row in self.history.for_application(application.id)]
        detail.interviews = [
            self._interview_out(interview) for interview in application.interviews
        ]
        return detail

    def create(self, user_id: int, payload: ApplicationCreate) -> ApplicationDetailOut:
        job = self.session.get(Job, payload.job_id)
        if job is None or job.user_id != user_id:
            raise BadRequest("Unknown job.", field="job_id")

        if self.repo.find_by_job(job.id) is not None:
            raise Conflict("An application already exists for this job.", field="job_id")

        data = payload.model_dump()
        data.pop("job_id", None)
        status = data.pop("status")
        applied_at = data.pop("applied_at", None)
        application = Application(
            user_id=user_id,
            job_id=job.id,
            status=status,
            applied_at=applied_at or ( _utcnow() if status != ApplicationStatus.SAVED else None),
            **data,
        )
        self.repo.add(application)
        self.session.add(
            ApplicationStatusHistory(
                application_id=application.id, old_status=None, new_status=status
            )
        )
        job.status = STATUS_TO_JOB_STATUS[status]
        self.repo.commit()
        self.repo.refresh(application)
        return self.get(user_id, application.id)

    def update(
        self, user_id: int, application_id: int, payload: ApplicationPatch
    ) -> ApplicationDetailOut:
        application = self.repo.get_for_user(application_id, user_id)
        data = payload.model_dump(exclude_unset=True)
        new_status: ApplicationStatus | None = data.get("status")

        if new_status is not None and new_status != application.status:
            old_status = application.status
            self.session.add(
                ApplicationStatusHistory(
                    application_id=application.id,
                    old_status=old_status,
                    new_status=new_status,
                )
            )
            application.status = new_status
            application.job.status = STATUS_TO_JOB_STATUS[new_status]
            if (
                application.applied_at is None
                and new_status in APPLICATION_STATUSES_WITH_RESPONSE
            ):
                application.applied_at = _utcnow()

        for key, value in data.items():
            setattr(application, key, value)

        self.repo.commit()
        self.repo.refresh(application)
        return self.get(user_id, application.id)

    def delete(self, user_id: int, application_id: int) -> None:
        application = self.repo.get_for_user(application_id, user_id)
        self.repo.delete(application)
        self.repo.commit()

    # -- helpers ------------------------------------------------------
    def _to_out(self, application: Application) -> ApplicationOut:
        out = ApplicationOut.model_validate(application)
        out.job = self._job_brief(application)
        return out

    def _job_brief(self, application: Application) -> JobBrief:
        job = application.job
        brief = JobBrief(
            id=job.id,
            title=job.title,
            location=job.location,
            status=job.status,
            priority=job.priority,
            job_url=job.job_url,
            company=CompanyBrief.model_validate(job.company) if job.company else None,
        )
        return brief

    @staticmethod
    def _interview_out(interview) -> InterviewOut:
        out = InterviewOut.model_validate(interview)
        application = interview.application
        if application and application.job:
            out.job_id = application.job.id
            out.job_title = application.job.title
            out.company_name = (
                application.job.company.name if application.job.company else None
            )
        return out
