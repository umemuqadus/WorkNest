from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequest, NotFound
from app.models.company import Company
from app.models.enums import JobStatus, Priority
from app.models.job import Job
from app.repositories.job import (
    ApplicationBriefRepository,
    JobRepository,
    MatchScoreRepository,
)
from app.schemas.common import build_page
from app.schemas.company import CompanyBrief
from app.schemas.job import JobCreate, JobFilters, JobOut, JobPatch


class JobService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = JobRepository(session)
        self.applications = ApplicationBriefRepository(session)
        self.matches = MatchScoreRepository(session)

    # -- reads --------------------------------------------------------
    def list(self, user_id: int, filters: JobFilters) -> dict:
        jobs, total = self.repo.list(user_id, filters)
        items = self._decorate(jobs)
        return build_page(items, total, filters.limit, filters.offset)

    def get(self, user_id: int, job_id: int) -> JobOut:
        job = self.repo.get_for_user(job_id, user_id)
        return self._decorate([job])[0]

    # -- writes -------------------------------------------------------
    def create(self, user_id: int, payload: JobCreate) -> JobOut:
        data = payload.model_dump()
        company_id = data.pop("company_id", None)
        if company_id is not None:
            self._assert_company(user_id, company_id)
        job = Job(user_id=user_id, company_id=company_id, **data)
        self.repo.add(job)
        self.repo.commit()
        self.repo.refresh(job)
        return self._decorate([job])[0]

    def update(self, user_id: int, job_id: int, payload: JobPatch) -> JobOut:
        job = self.repo.get_for_user(job_id, user_id)
        data = payload.model_dump(exclude_unset=True)
        if "company_id" in data:
            company_id = data.pop("company_id")
            self._assert_company(user_id, company_id)
            job.company_id = company_id
        for key, value in data.items():
            setattr(job, key, value)
        self.repo.commit()
        self.repo.refresh(job)
        return self._decorate([job])[0]

    def update_status(self, user_id: int, job_id: int, status: JobStatus) -> JobOut:
        job = self.repo.get_for_user(job_id, user_id)
        job.status = status
        self.repo.commit()
        self.repo.refresh(job)
        return self._decorate([job])[0]

    def update_priority(self, user_id: int, job_id: int, priority: Priority) -> JobOut:
        job = self.repo.get_for_user(job_id, user_id)
        job.priority = priority
        self.repo.commit()
        self.repo.refresh(job)
        return self._decorate([job])[0]

    def delete(self, user_id: int, job_id: int) -> None:
        job = self.repo.get_for_user(job_id, user_id)
        self.repo.delete(job)
        self.repo.commit()

    def high_priority(self, user_id: int, limit: int = 5) -> list[JobOut]:
        return self._decorate(self.repo.list_high_priority(user_id, limit))

    # -- helpers ------------------------------------------------------
    def _assert_company(self, user_id: int, company_id: int) -> None:
        company = self.session.get(Company, company_id)
        if company is None or company.user_id != user_id:
            raise BadRequest("Unknown company.", field="company_id")

    def _decorate(self, jobs: list[Job]) -> list[JobOut]:
        """Batch-load list-view extras so we never issue N+1 queries."""
        if not jobs:
            return []

        job_ids = [job.id for job in jobs]
        app_map = self.applications.status_by_job_ids(job_ids)
        analysed = self.matches.analysis_job_ids(job_ids)
        best_scores = self.matches.best_scores_by_job_ids(job_ids)
        upcoming = self.matches.upcoming_interview_by_job_ids(job_ids)

        outputs: list[JobOut] = []
        for job in jobs:
            out = JobOut.model_validate(job)
            out.company = CompanyBrief.model_validate(job.company) if job.company else None
            out.has_analysis = job.id in analysed
            application = app_map.get(job.id)
            out.application_id = application.id if application else None
            out.application_status = application.status if application else None
            if job.id in best_scores:
                resume_id, score = best_scores[job.id]
                out.matched_resume_id = resume_id
                out.match_score = score
            out.upcoming_interview_at = upcoming.get(job.id)
            outputs.append(out)
        return outputs
