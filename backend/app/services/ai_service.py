"""AI orchestration: prompt -> provider -> validate -> persist (cached).

Nothing here calls the provider on a page load; results are read from the
database unless the user explicitly asks to (re)generate.
"""

from __future__ import annotations

import logging
from typing import TypeVar

from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from app.ai import (
    build_interview_prep_request,
    build_job_analysis_request,
    build_match_request,
    build_suggestions_request,
    extract_json,
    resolve_provider,
)
from app.ai.base import AIRequest
from app.core.exceptions import AIInvalidResponse, BadRequest, NotFound
from app.models.ai_analysis import (
    ApplicationSuggestion,
    InterviewPreparation,
    JobAnalysis,
    JobMatch,
)
from app.models.job import Job
from app.models.resume import Resume
from app.repositories.analysis import (
    AnalysisRepository,
    MatchRepository,
    PreparationRepository,
    SuggestionRepository,
)
from app.repositories.job import JobRepository
from app.repositories.resume import ResumeRepository

logger = logging.getLogger(__name__)

PayloadT = TypeVar("PayloadT", bound=BaseModel)


class AIService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.jobs = JobRepository(session)
        self.resumes = ResumeRepository(session)
        self.analyses = AnalysisRepository(session)
        self.matches = MatchRepository(session)
        self.preparations = PreparationRepository(session)
        self.suggestions = SuggestionRepository(session)

    # -- analysis -----------------------------------------------------
    def get_analysis(self, user_id: int, job_id: int) -> JobAnalysis | None:
        job = self.jobs.get_for_user(job_id, user_id)
        return self.analyses.for_job(job.id)

    async def analyze_job(
        self, user_id: int, job_id: int, *, refresh: bool = False
    ) -> JobAnalysis:
        job = self.jobs.get_for_user(job_id, user_id)
        if not (job.description or "").strip():
            raise BadRequest(
                "This job has no description to analyse. Add the job description first.",
                field="description",
            )

        existing = self.analyses.for_job(job.id)
        if existing is not None and not refresh:
            return existing

        request = build_job_analysis_request(
            job_title=job.title,
            company_name=job.company.name if job.company else "",
            description=job.description or "",
            location=job.location or "",
        )
        from app.schemas.ai_payloads import JobAnalysisPayload

        payload, provider_name, raw = await self._generate(request, JobAnalysisPayload)

        if existing is None:
            existing = JobAnalysis(job_id=job.id)
            self.session.add(existing)

        existing.summary = payload.summary
        existing.required_skills = payload.required_skills
        existing.preferred_skills = payload.preferred_skills
        existing.responsibilities = payload.responsibilities
        existing.technologies = payload.technologies
        existing.keywords = payload.keywords
        existing.soft_skills = payload.soft_skills
        existing.seniority = payload.seniority
        existing.experience_required = payload.experience_required
        existing.education_required = payload.education_required
        existing.employment_type = payload.employment_type
        existing.remote_type = payload.remote_type
        existing.provider = provider_name
        existing.raw_response = raw
        self.session.commit()
        self.session.refresh(existing)
        return existing

    # -- matching -----------------------------------------------------
    def get_match(
        self, user_id: int, job_id: int, resume_id: int | None = None
    ) -> JobMatch | None:
        job = self.jobs.get_for_user(job_id, user_id)
        resume = self._resolve_resume(user_id, resume_id)
        return self.matches.for_job_and_resume(job.id, resume.id)

    async def match_job(
        self, user_id: int, job_id: int, resume_id: int | None = None, *, refresh: bool = False
    ) -> JobMatch:
        job = self.jobs.get_for_user(job_id, user_id)
        resume = self._resolve_resume(user_id, resume_id)

        existing = self.matches.for_job_and_resume(job.id, resume.id)
        if existing is not None and not refresh:
            return existing

        request = build_match_request(
            job_title=job.title,
            company_name=job.company.name if job.company else "",
            description=job.description or "",
            resume_content=resume.content,
        )
        from app.schemas.ai_payloads import JobMatchPayload

        payload, provider_name, raw = await self._generate(request, JobMatchPayload)

        if existing is None:
            existing = JobMatch(job_id=job.id, resume_id=resume.id)
            self.session.add(existing)

        existing.match_score = payload.match_score
        existing.matched_skills = payload.matched_skills
        existing.missing_skills = payload.missing_skills
        existing.strengths = payload.strengths
        existing.weaknesses = payload.weaknesses
        existing.experience_match = payload.experience_match
        existing.recommendations = payload.recommendations
        existing.summary = payload.summary
        existing.provider = provider_name
        existing.raw_response = raw
        self.session.commit()
        self.session.refresh(existing)
        return existing

    # -- interview prep ------------------------------------------------
    def get_preparation(self, user_id: int, job_id: int) -> InterviewPreparation | None:
        job = self.jobs.get_for_user(job_id, user_id)
        return self.preparations.latest_for_job(job.id)

    async def prepare_interview(
        self, user_id: int, job_id: int, resume_id: int | None = None, *, refresh: bool = False
    ) -> InterviewPreparation:
        job = self.jobs.get_for_user(job_id, user_id)
        resume = self._resolve_resume(user_id, resume_id, required=False)

        existing = self.preparations.latest_for_job(job.id)
        if existing is not None and not refresh:
            return existing

        request = build_interview_prep_request(
            job_title=job.title,
            company_name=job.company.name if job.company else "",
            description=job.description or "",
            resume_content=resume.content if resume else "",
        )
        from app.schemas.ai_payloads import InterviewPrepPayload

        payload, provider_name, raw = await self._generate(request, InterviewPrepPayload)

        record = existing or InterviewPreparation(
            job_id=job.id, resume_id=resume.id if resume else None
        )
        if existing is None:
            self.session.add(record)

        record.technical_questions = payload.technical_questions
        record.behavioral_questions = payload.behavioral_questions
        record.role_specific_questions = payload.role_specific_questions
        record.suggested_answer_points = payload.suggested_answer_points
        record.questions_to_ask = payload.questions_to_ask
        record.provider = provider_name
        record.raw_response = raw
        self.session.commit()
        self.session.refresh(record)
        return record

    def update_preparation(self, user_id: int, job_id: int, data: dict) -> InterviewPreparation:
        record = self.get_preparation(user_id, job_id)
        if record is None:
            raise NotFound("No saved interview preparation for this job.")
        for key, value in data.items():
            if value is not None:
                setattr(record, key, value)
        self.session.commit()
        self.session.refresh(record)
        return record

    def delete_preparation(self, user_id: int, job_id: int) -> None:
        record = self.get_preparation(user_id, job_id)
        if record is None:
            raise NotFound("No saved interview preparation for this job.")
        self.session.delete(record)
        self.session.commit()

    # -- application suggestions --------------------------------------
    def get_suggestions(self, user_id: int, job_id: int) -> ApplicationSuggestion | None:
        job = self.jobs.get_for_user(job_id, user_id)
        return self.suggestions.for_job(job.id)

    async def suggest_application(
        self, user_id: int, job_id: int, resume_id: int | None = None, *, refresh: bool = False
    ) -> ApplicationSuggestion:
        job = self.jobs.get_for_user(job_id, user_id)
        resume = self._resolve_resume(user_id, resume_id, required=False)

        existing = self.suggestions.for_job(job.id)
        if existing is not None and not refresh:
            return existing

        request = build_suggestions_request(
            job_title=job.title,
            company_name=job.company.name if job.company else "",
            description=job.description or "",
            resume_content=resume.content if resume else "",
        )
        from app.schemas.ai_payloads import ApplicationSuggestionPayload

        payload, provider_name, raw = await self._generate(request, ApplicationSuggestionPayload)

        record = existing or ApplicationSuggestion(
            job_id=job.id, resume_id=resume.id if resume else None
        )
        if existing is None:
            self.session.add(record)

        record.resume_customization = payload.resume_customization
        record.keywords_to_include = payload.keywords_to_include
        record.cover_letter_outline = payload.cover_letter_outline
        record.skills_to_highlight = payload.skills_to_highlight
        record.potential_gaps = payload.potential_gaps
        record.application_strategy = payload.application_strategy
        record.provider = provider_name
        record.raw_response = raw
        self.session.commit()
        self.session.refresh(record)
        return record

    # -- internals -----------------------------------------------------
    def _resolve_resume(
        self, user_id: int, resume_id: int | None, *, required: bool = True
    ) -> Resume | None:
        if resume_id is not None:
            resume = self.resumes.get_for_user(resume_id, user_id)
            if resume is None:
                raise BadRequest("Unknown resume.", field="resume_id")
            return resume

        default = self.resumes.default_for(user_id)
        if default is None:
            candidates = self.resumes.list(user_id)
            default = candidates[0] if candidates else None
        if default is None and required:
            raise BadRequest("Create a resume before running this analysis.")
        return default

    async def _generate(self, request: AIRequest, payload_model: type[PayloadT]):
        """Call the provider, validate JSON, retry once with a correction prompt."""
        provider, _fallback = resolve_provider()

        try:
            raw = await provider.complete(request)
        except Exception:
            logger.exception("AI provider call failed for task=%s", request.task)
            raise

        data = extract_json(raw)
        if data is None:
            logger.warning("AI returned unparseable output for task=%s - retrying", request.task)
            raw_retry = await provider.complete(request.correction(raw))
            data = extract_json(raw_retry)
            if data is None:
                raise AIInvalidResponse(
                    "The AI response could not be read. Please try again."
                )
            raw = raw_retry

        try:
            payload = payload_model.model_validate(data)
        except ValidationError as exc:
            logger.warning("AI response failed validation for task=%s: %s", request.task, exc.errors()[:3])
            raise AIInvalidResponse(
                "The AI response was incomplete. Please try again."
            ) from exc

        return payload, provider.name, raw
