"""Global search across jobs, companies, contacts and applications."""

from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.company import Company
from app.models.contact import Contact
from app.models.job import Job
from app.schemas.common import ORMModel
from app.schemas.company import CompanyBrief
from app.utils.text import truncate


class SearchHit(ORMModel):
    type: str
    id: int
    title: str
    subtitle: str = ""
    url: str = ""


class SearchService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def search(self, user_id: int, q: str, limit: int = 5) -> dict[str, list[SearchHit]]:
        term = (q or "").strip()
        if not term:
            return {"jobs": [], "companies": [], "contacts": [], "applications": []}
        pattern = f"%{term}%"

        jobs = self.session.scalars(
            select(Job)
            .where(
                Job.user_id == user_id,
                or_(Job.title.ilike(pattern), Job.location.ilike(pattern)),
            )
            .options(joinedload(Job.company))
            .limit(limit)
        ).all()

        companies = self.session.scalars(
            select(Company).where(
                Company.user_id == user_id,
                or_(
                    Company.name.ilike(pattern),
                    Company.industry.ilike(pattern),
                    Company.location.ilike(pattern),
                ),
            ).limit(limit)
        ).all()

        contacts = self.session.scalars(
            select(Contact).where(
                Contact.user_id == user_id,
                or_(Contact.name.ilike(pattern), Contact.email.ilike(pattern)),
            ).limit(limit)
        ).all()

        applications = self.session.scalars(
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .where(
                Application.user_id == user_id,
                or_(Job.title.ilike(pattern), Application.referral.ilike(pattern)),
            )
            .options(joinedload(Application.job).joinedload(Job.company))
            .limit(limit)
        ).all()

        return {
            "jobs": [
                SearchHit(
                    type="job",
                    id=job.id,
                    title=job.title,
                    subtitle=job.company.name if job.company else (job.location or ""),
                    url=f"/jobs/{job.id}",
                )
                for job in jobs
            ],
            "companies": [
                SearchHit(
                    type="company",
                    id=company.id,
                    title=company.name,
                    subtitle=company.industry or company.location or "",
                    url=f"/companies/{company.id}",
                )
                for company in companies
            ],
            "contacts": [
                SearchHit(
                    type="contact",
                    id=contact.id,
                    title=contact.name,
                    subtitle=truncate(contact.notes or contact.job_title or ""),
                    url="/contacts",
                )
                for contact in contacts
            ],
            "applications": [
                SearchHit(
                    type="application",
                    id=application.id,
                    title=application.job.title,
                    subtitle=application.status.value.replace("_", " ").title(),
                    url=f"/jobs/{application.job_id}",
                )
                for application in applications
            ],
        }
