"""Seed realistic demo data.

Run with::

    python -m app.db.seed            # add demo data if missing
    python -m app.db.seed --reset    # wipe demo user first, then re-seed
"""

from __future__ import annotations

import sys
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import (
    Application,
    ApplicationStatusHistory,
    Company,
    Contact,
    Interview,
    InterviewResult,
    InterviewType,
    Job,
    Note,
    NoteEntityType,
    Priority,
    RemoteType,
    EmploymentType,
    JobStatus,
    ApplicationStatus,
    Resume,
    Task,
    User,
)

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "Demo123!"

JOB_SEEDS = [
    {
        "title": "AI Engineer",
        "company": "AI Labs",
        "location": "San Francisco, CA",
        "remote_type": RemoteType.HYBRID,
        "employment_type": EmploymentType.FULL_TIME,
        "salary_min": 160000,
        "salary_max": 210000,
        "source": "LinkedIn",
        "status": JobStatus.INTERVIEW,
        "priority": Priority.HIGH,
        "days_ago": 24,
        "description": (
            "AI Labs is looking for an AI Engineer to build production LLM features.\n"
            "Responsibilities:\n"
            "Design and build RAG pipelines over large document corpora.\n"
            "Ship evaluation harnesses for prompt and model quality.\n"
            "Collaborate with product and platform teams to launch AI features.\n"
            "Requirements:\n"
            "3+ years of experience in backend or machine learning engineering.\n"
            "Strong Python, FastAPI and SQL skills.\n"
            "Hands on experience with LLMs, embeddings and vector databases.\n"
            "Experience with Docker, AWS and CI/CD is preferred.\n"
            "Bachelor's degree in Computer Science or equivalent.\n"
            "Nice to have: LangChain, LLamaIndex, pgvector, Kubernetes."
        ),
    },
    {
        "title": "Machine Learning Engineer",
        "company": "DataWorks",
        "location": "Remote - US",
        "remote_type": RemoteType.REMOTE,
        "employment_type": EmploymentType.FULL_TIME,
        "salary_min": 150000,
        "salary_max": 195000,
        "source": "Company Site",
        "status": JobStatus.APPLIED,
        "priority": Priority.HIGH,
        "days_ago": 16,
        "description": (
            "DataWorks is hiring a Machine Learning Engineer to own forecasting models.\n"
            "Responsibilities:\n"
            "Build, train and deploy models for demand forecasting.\n"
            "Design feature pipelines with Airflow and Spark.\n"
            "Monitor model quality and drive iterative improvements.\n"
            "Requirements:\n"
            "4+ years of experience in machine learning engineering.\n"
            "Solid Python, pandas, NumPy and scikit-learn or PyTorch.\n"
            "Production SQL and data warehouse experience.\n"
            "MLOps, Docker and Kubernetes experience is preferred.\n"
            "Master's degree is a plus."
        ),
    },
    {
        "title": "Backend Engineer",
        "company": "Cloud Systems",
        "location": "Austin, TX",
        "remote_type": RemoteType.HYBRID,
        "employment_type": EmploymentType.FULL_TIME,
        "salary_min": 130000,
        "salary_max": 170000,
        "source": "Referral",
        "status": JobStatus.APPLIED,
        "priority": Priority.MEDIUM,
        "days_ago": 11,
        "description": (
            "Cloud Systems is growing its platform team.\n"
            "Responsibilities:\n"
            "Build and maintain microservices in Python and Go.\n"
            "Improve API reliability, observability and latency.\n"
            "Review code and mentor junior engineers.\n"
            "Requirements:\n"
            "2+ years building web backends.\n"
            "Strong Python, FastAPI or Django, PostgreSQL and Redis.\n"
            "Docker and Kubernetes exposure.\n"
            "Excellent communication and teamwork.\n"
            "Experience with gRPC and Kafka is preferred."
        ),
    },
    {
        "title": "Generative AI Engineer",
        "company": "TechCorp",
        "location": "New York, NY",
        "remote_type": RemoteType.ONSITE,
        "employment_type": EmploymentType.CONTRACT,
        "salary_min": 140000,
        "salary_max": 180000,
        "source": "LinkedIn",
        "status": JobStatus.OFFER,
        "priority": Priority.HIGH,
        "days_ago": 34,
        "description": (
            "TechCorp is looking for a Generative AI Engineer for a 12 month contract.\n"
            "Responsibilities:\n"
            "Prototype and ship generative AI experiences.\n"
            "Build retrieval augmented generation services.\n"
            "Own prompt evaluation and safety reviews.\n"
            "Requirements:\n"
            "3+ years of software engineering experience.\n"
            "Python, FastAPI and experience with OpenAI or Gemini APIs.\n"
            "Understanding of embeddings, chunking and vector search.\n"
            "Prompt engineering and evaluation experience is preferred.\n"
            "Bachelor's degree required."
        ),
    },
    {
        "title": "Python Developer",
        "company": "DataWorks",
        "location": "Remote - EU",
        "remote_type": RemoteType.REMOTE,
        "employment_type": EmploymentType.PART_TIME,
        "salary_min": 80000,
        "salary_max": 110000,
        "source": "Job Board",
        "status": JobStatus.REJECTED,
        "priority": Priority.LOW,
        "days_ago": 45,
        "description": (
            "DataWorks needs a part time Python Developer for data tooling.\n"
            "Responsibilities:\n"
            "Develop internal ETL tooling and reporting scripts.\n"
            "Maintain REST APIs consumed by analytics teams.\n"
            "Requirements:\n"
            "1+ years of Python experience.\n"
            "SQL and pandas knowledge.\n"
            "Clear written communication in English.\n"
            "Experience with Airflow is a nice to have."
        ),
    },
    {
        "title": "Senior Data Engineer",
        "company": "Cloud Systems",
        "location": "Remote - US",
        "remote_type": RemoteType.REMOTE,
        "employment_type": EmploymentType.FULL_TIME,
        "salary_min": 170000,
        "salary_max": 220000,
        "source": "LinkedIn",
        "status": JobStatus.SAVED,
        "priority": Priority.MEDIUM,
        "days_ago": 4,
        "description": (
            "Cloud Systems is hiring a Senior Data Engineer.\n"
            "Responsibilities:\n"
            "Own the lakehouse architecture and ingestion pipelines.\n"
            "Lead technical design reviews across teams.\n"
            "Requirements:\n"
            "5+ years in data engineering.\n"
            "Advanced SQL, dbt, Airflow and Spark.\n"
            "Cloud data warehouse experience on AWS or GCP.\n"
            "Leadership and stakeholder management skills.\n"
            "Kafka experience is preferred."
        ),
    },
    {
        "title": "Frontend Engineer",
        "company": "TechCorp",
        "location": "San Francisco, CA",
        "remote_type": RemoteType.HYBRID,
        "employment_type": EmploymentType.FULL_TIME,
        "salary_min": 135000,
        "salary_max": 175000,
        "source": "Company Site",
        "status": JobStatus.WITHDRAWN,
        "priority": Priority.LOW,
        "days_ago": 60,
        "description": (
            "TechCorp is hiring a Frontend Engineer for its dashboard suite.\n"
            "Responsibilities:\n"
            "Build accessible, responsive interfaces in React and TypeScript.\n"
            "Own component libraries and design system tokens.\n"
            "Requirements:\n"
            "3+ years with React and TypeScript.\n"
            "Strong CSS and testing skills.\n"
            "Experience with data visualization libraries.\n"
            "Figma collaboration is preferred."
        ),
    },
]

RESUME_TEXT = """Jane Doe
Location: San Francisco, CA | linkedin.com/in/janedoe | github.com/janedoe

SUMMARY
Backend and AI engineer with 4 years of experience building Python web services,
data pipelines and LLM powered features in production.

SKILLS
Python, FastAPI, Django, PostgreSQL, SQL, Redis, Docker, AWS, pytest, Git,
pandas, NumPy, scikit-learn, PyTorch, LangChain, RAG, embeddings, vector databases,
REST API, CI/CD, Agile, communication, teamwork

EXPERIENCE
Software Engineer - Streamline Analytics (2022 - Present)
- Designed and built FastAPI microservices handling 2M requests per day.
- Built a RAG document search feature using embeddings and pgvector.
- Reduced p95 latency by 38% through query optimization and caching in Redis.
- Mentored two junior engineers and led code reviews.

Data Analyst - Insight Co (2020 - 2022)
- Developed ETL pipelines with pandas and SQL feeding executive dashboards.
- Automated weekly reporting, saving 10 hours of manual work per week.

EDUCATION
BSc Computer Science, 2020

PROJECTS
- Job Tracker API: FastAPI + PostgreSQL + JWT authentication.
- LLM Evaluation Tool: automated prompt scoring with pytest and CI/CD.
"""


def _days_ago(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def seed(reset: bool = False) -> None:
    session = SessionLocal()
    try:
        existing = session.scalars(select(User).where(User.email == DEMO_EMAIL)).first()
        if existing is not None:
            if not reset:
                print(f"Demo user already exists: {DEMO_EMAIL} (use --reset to rebuild)")
                return
            session.delete(existing)
            session.commit()
            print("Removed existing demo user.")

        user = User(
            name="Jane Doe",
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            location="San Francisco, CA",
            phone="+1 555 010 1234",
            linkedin_url="https://linkedin.com/in/janedoe",
            github_url="https://github.com/janedoe",
            portfolio_url="https://janedoe.dev",
        )
        session.add(user)
        session.flush()

        resume = Resume(
            user_id=user.id,
            name="General AI Resume",
            content=RESUME_TEXT,
            is_default=True,
        )
        secondary = Resume(
            user_id=user.id,
            name="Backend Focus Resume",
            content=RESUME_TEXT.replace("AI engineer", "backend engineer"),
            is_default=False,
        )
        session.add_all([resume, secondary])
        session.flush()

        companies: dict[str, Company] = {}
        for name, industry, location, website in [
            ("AI Labs", "Artificial Intelligence", "San Francisco, CA", "https://ailabs.example.com"),
            ("DataWorks", "Data & Analytics", "Remote", "https://dataworks.example.com"),
            ("Cloud Systems", "Cloud Infrastructure", "Austin, TX", "https://cloudsystems.example.com"),
            ("TechCorp", "Software", "New York, NY", "https://techcorp.example.com"),
        ]:
            company = Company(
                user_id=user.id,
                name=name,
                industry=industry,
                location=location,
                website=website,
                description=f"{name} builds products in the {industry.lower()} space.",
            )
            session.add(company)
            session.flush()
            companies[name] = company

        # a recruiter contact per company
        contacts = [
            Contact(
                user_id=user.id,
                company_id=companies["AI Labs"].id,
                name="Michael Chen",
                email="michael.chen@ailabs.example.com",
                job_title="Technical Recruiter",
                linkedin_url="https://linkedin.com/in/michaelchen",
                notes="Reached out about the AI Engineer role.",
            ),
            Contact(
                user_id=user.id,
                company_id=companies["TechCorp"].id,
                name="Priya Nair",
                email="priya.nair@techcorp.example.com",
                job_title="Hiring Manager",
                linkedin_url="https://linkedin.com/in/priyanair",
                notes="Contract to hire role, prefers on-site candidates.",
            ),
            Contact(
                user_id=user.id,
                company_id=companies["Cloud Systems"].id,
                name="Daniel Ortiz",
                email="daniel.ortiz@cloudsystems.example.com",
                job_title="Engineering Manager",
                notes="Referral from university alumni group.",
            ),
        ]
        session.add_all(contacts)
        session.flush()

        status_sequence = {
            JobStatus.OFFER: [
                ApplicationStatus.SAVED,
                ApplicationStatus.APPLIED,
                ApplicationStatus.SCREENING,
                ApplicationStatus.INTERVIEW,
                ApplicationStatus.OFFER,
            ],
            JobStatus.INTERVIEW: [
                ApplicationStatus.SAVED,
                ApplicationStatus.APPLIED,
                ApplicationStatus.SCREENING,
                ApplicationStatus.INTERVIEW,
            ],
            JobStatus.APPLIED: [ApplicationStatus.SAVED, ApplicationStatus.APPLIED],
            JobStatus.REJECTED: [
                ApplicationStatus.SAVED,
                ApplicationStatus.APPLIED,
                ApplicationStatus.REJECTED,
            ],
            JobStatus.WITHDRAWN: [
                ApplicationStatus.SAVED,
                ApplicationStatus.APPLIED,
                ApplicationStatus.WITHDRAWN,
            ],
        }

        jobs: list[Job] = []
        for index, seed_data in enumerate(JOB_SEEDS):
            company = companies[seed_data["company"]]
            created_at = _days_ago(seed_data["days_ago"])
            job = Job(
                user_id=user.id,
                company_id=company.id,
                title=seed_data["title"],
                description=seed_data["description"],
                location=seed_data["location"],
                remote_type=seed_data["remote_type"],
                employment_type=seed_data["employment_type"],
                salary_min=seed_data["salary_min"],
                salary_max=seed_data["salary_max"],
                currency="USD",
                job_url=f"https://{company.name.lower().replace(' ', '')}.example.com/jobs/{index + 1}",
                source=seed_data["source"],
                status=seed_data["status"],
                priority=seed_data["priority"],
                date_posted=date.today() - timedelta(days=seed_data["days_ago"] + 3),
                deadline=date.today() + timedelta(days=(index * 5) - 4),
            )
            job.created_at = created_at
            session.add(job)
            session.flush()
            jobs.append(job)

            sequence = status_sequence.get(seed_data["status"])
            if sequence:
                final_status = sequence[-1]
                application = Application(
                    user_id=user.id,
                    job_id=job.id,
                    status=final_status,
                    source=seed_data["source"],
                    applied_at=_days_ago(max(1, seed_data["days_ago"] - 2)),
                    cover_letter=(
                        f"Dear {company.name} team, I am excited to apply for the "
                        f"{seed_data['title']} role."
                    ),
                    referral="Daniel Ortiz" if seed_data["source"] == "Referral" else None,
                    notes="Tailored resume submitted.",
                )
                session.add(application)
                session.flush()

                step_days = max(1, seed_data["days_ago"] // max(1, len(sequence)))
                for position, stage in enumerate(sequence):
                    session.add(
                        ApplicationStatusHistory(
                            application_id=application.id,
                            old_status=sequence[position - 1] if position else None,
                            new_status=stage,
                            changed_at=_days_ago(
                                max(0, seed_data["days_ago"] - position * step_days)
                            ),
                        )
                    )
                session.flush()

                # interviews
                if final_status in (ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER):
                    session.add(
                        Interview(
                            application_id=application.id,
                            type=InterviewType.VIDEO,
                            scheduled_at=datetime.now(timezone.utc) + timedelta(days=3, hours=index),
                            duration=45,
                            interviewer="Recruiter screen",
                            meeting_url="https://meet.example.com/interview-1",
                            notes="Prepare system design answers.",
                            result=InterviewResult.PENDING,
                        )
                    )
                    session.add(
                        Interview(
                            application_id=application.id,
                            type=InterviewType.TECHNICAL,
                            scheduled_at=datetime.now(timezone.utc) - timedelta(
                                days=max(1, seed_data["days_ago"] - 6)
                            ),
                            duration=60,
                            interviewer="Senior Engineer Panel",
                            notes="Coding + architecture round.",
                            result=(
                                InterviewResult.SELECTED
                                if final_status == ApplicationStatus.OFFER
                                else InterviewResult.PENDING
                            ),
                        )
                    )

        # notes
        session.add_all(
            [
                Note(
                    user_id=user.id,
                    entity_type=NoteEntityType.JOB,
                    entity_id=jobs[0].id,
                    title="Recruiter call prep",
                    content="Ask about the LLM evaluation process and on-call expectations.",
                ),
                Note(
                    user_id=user.id,
                    entity_type=NoteEntityType.COMPANY,
                    entity_id=companies["AI Labs"].id,
                    title="Culture",
                    content="Strong engineering culture, publishes open source model tooling.",
                ),
            ]
        )

        # tasks
        session.add_all(
            [
                Task(
                    user_id=user.id,
                    job_id=jobs[1].id,
                    title="Follow up with recruiter",
                    description="Send a short thank you note and ask about timelines.",
                    due_date=date.today() + timedelta(days=2),
                    priority=Priority.HIGH,
                ),
                Task(
                    user_id=user.id,
                    job_id=jobs[0].id,
                    title="Prepare system design answers",
                    description="Practice RAG architecture whiteboarding.",
                    due_date=date.today() + timedelta(days=1),
                    priority=Priority.HIGH,
                ),
                Task(
                    user_id=user.id,
                    job_id=jobs[3].id,
                    title="Research company financials",
                    due_date=date.today() - timedelta(days=2),
                    priority=Priority.MEDIUM,
                ),
                Task(
                    user_id=user.id,
                    job_id=jobs[2].id,
                    title="Send application",
                    completed=True,
                    priority=Priority.MEDIUM,
                ),
                Task(
                    user_id=user.id,
                    title="Update portfolio projects",
                    completed=True,
                    priority=Priority.LOW,
                ),
            ]
        )

        session.commit()
        print("Seed complete.")
        print(f"  login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"  companies={len(companies)} jobs={len(jobs)} resumes=2")
    finally:
        session.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
