"""Deterministic offline provider.

Used automatically when no API key is configured so every AI feature keeps
working (with clearly labelled mock data) instead of failing.
"""

from __future__ import annotations

import json
import re

from app.ai.base import AIProvider, AIRequest

TECH_SKILLS = [
    "python", "fastapi", "django", "flask", "sql", "postgresql", "mysql", "mongodb",
    "javascript", "typescript", "react", "next.js", "node.js", "vue", "angular",
    "java", "spring", "c#", ".net", "go", "rust", "kubernetes", "docker", "terraform",
    "aws", "azure", "gcp", "ci/cd", "jenkins", "git", "linux", "redis", "kafka",
    "rabbitmq", "spark", "hadoop", "airflow", "dbt", "snowflake", "elasticsearch",
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch",
    "tensorflow", "scikit-learn", "pandas", "numpy", "llm", "genai", "rag",
    "langchain", "llamaindex", "transformers", "openai", "gemini", "prompt engineering",
    "mlops", "microservices", "rest api", "graphql", "grpc", "graphql", "html", "css",
    "tailwind", "figma", "excel", "power bi", "tableau", "selenium", "pytest",
    "unittest", "playwright", "agile", "scrum", "jira", "kafka streams", "etl",
    "data pipelines", "observability", "grafana", "prometheus", "security",
]

SOFT_SKILLS = [
    "communication", "leadership", "teamwork", "collaboration", "problem solving",
    "problem-solving", "analytical", "adaptability", "mentoring", "stakeholder management",
    "time management", "attention to detail", "critical thinking", "presentation",
]

RESPONSIBILITY_VERBS = [
    "design", "build", "develop", "implement", "maintain", "own", "lead", "deliver",
    "collaborate", "create", "improve", "optimize", "optimize", "manage", "ship",
    "review", "mentor", "automate", "migrate", "architect", "analyze",
]


def _normalise(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower()).rstrip(".")


def extract_skills(text: str, vocabulary: list[str] | None = None) -> list[str]:
    haystack = _normalise(text or "")
    found: list[str] = []
    for skill in vocabulary or TECH_SKILLS:
        pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
        if re.search(pattern, haystack):
            if skill not in found:
                found.append(skill)
    return found


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|\n+", text or "")
    return [part.strip() for part in parts if part and len(part.strip()) > 25]


def _detect_seniority(text: str) -> str:
    lowered = (text or "").lower()
    for level in ("principal", "staff", "senior", "mid-level", "mid level", "junior", "entry level", "lead"):
        if level in lowered:
            return level.replace("mid level", "mid-level").title()
    return "Not specified"


def _detect_years(text: str) -> str:
    match = re.search(r"(\d+)\s*\+?\s*(?:-\s*\d+\s*)?years?", text or "", re.IGNORECASE)
    if match:
        return f"{match.group(1)}+ years"
    return "Not specified"


def _detect_education(text: str) -> str:
    lowered = (text or "").lower()
    if "phd" in lowered or "doctorate" in lowered:
        return "PhD preferred"
    if "master" in lowered or "msc" in lowered or "m.s." in lowered:
        return "Bachelor's required, Master's preferred"
    if "bachelor" in lowered or "degree" in lowered or "bsc" in lowered:
        return "Bachelor's degree"
    return "Not specified"


def _detect_remote(text: str) -> str:
    lowered = (text or "").lower()
    if "remote" in lowered:
        return "remote"
    if "hybrid" in lowered:
        return "hybrid"
    if "on-site" in lowered or "onsite" in lowered:
        return "onsite"
    return "not specified"


def _detect_employment(text: str) -> str:
    lowered = (text or "").lower()
    if "part-time" in lowered or "part time" in lowered:
        return "part_time"
    if "contract" in lowered:
        return "contract"
    if "intern" in lowered:
        return "internship"
    if "freelance" in lowered:
        return "freelance"
    return "full_time"


def _preferred_skills(description: str) -> list[str]:
    for line in (description or "").splitlines():
        if re.search(r"preferred|nice to have|plus\b|desirable", line, re.IGNORECASE):
            skills = extract_skills(line)
            if skills:
                return skills[:8]
    return []


def _responsibilities(description: str) -> list[str]:
    results: list[str] = []
    for sentence in _split_sentences(description):
        lowered = sentence.lower()
        if any(lowered.startswith(verb) or f" {verb} " in lowered for verb in RESPONSIBILITY_VERBS):
            results.append(sentence.rstrip("."))
        if len(results) >= 6:
            break
    if not results:
        results = [s.rstrip(".") for s in _split_sentences(description)[:4]]
    return results[:6]


class MockProvider(AIProvider):
    name = "mock"

    async def complete(self, request: AIRequest) -> str:
        handler = {
            "job_analysis": self._job_analysis,
            "job_match": self._job_match,
            "interview_prep": self._interview_prep,
            "application_suggestions": self._suggestions,
        }.get(request.task, self._job_analysis)
        return json.dumps(handler(request.context))


    # -- handlers -----------------------------------------------------
    def _job_analysis(self, ctx: dict) -> dict:
        description = ctx.get("job_description", "")
        title = ctx.get("job_title", "")
        combined = f"{title}\n{description}"
        required = extract_skills(description)
        preferred = [s for s in _preferred_skills(description) if s not in required]
        soft = [s for s in extract_skills(description, SOFT_SKILLS)][:6]

        summary_source = " ".join(_split_sentences(description)[:2])
        if not summary_source:
            summary_source = f"{title}: no description was provided, limited analysis available."

        return {
            "summary": summary_source,
            "required_skills": required[:12],
            "preferred_skills": preferred[:6],
            "responsibilities": _responsibilities(description),
            "experience_required": _detect_years(combined),
            "education_required": _detect_education(combined),
            "keywords": required[:10],
            "technologies": [s for s in required if s not in soft][:10],
            "soft_skills": soft,
            "seniority": _detect_seniority(combined),
            "employment_type": _detect_employment(combined),
            "remote_type": _detect_remote(combined),
        }

    def _job_match(self, ctx: dict) -> dict:
        description = ctx.get("job_description", "")
        resume = ctx.get("resume_content", "")
        required = extract_skills(description) or extract_skills(ctx.get("job_title", ""))
        resume_skills = extract_skills(resume)

        matched = [skill for skill in required if skill in resume_skills]
        missing = [skill for skill in required if skill not in resume_skills]

        if required:
            score = int(round(100 * len(matched) / len(required)))
        else:
            score = 0

        # small evidence-based adjustments
        if len(resume) < 200:
            score = max(0, score - 10)
        years_required = _detect_years(description)
        years_resume = _detect_years(resume)
        experience_match = (
            f"Job asks for {years_required}; resume mentions {years_resume}."
            if years_required != "Not specified"
            else "Experience requirement not specified in the job description."
        )

        return {
            "match_score": max(0, min(100, score)),
            "matched_skills": matched,
            "missing_skills": missing,
            "strengths": matched[:6] or ["Resume provided"],
            "weaknesses": missing[:6],
            "experience_match": experience_match,
            "recommendations": [
                f"Highlight {skill} experience in the resume summary."
                for skill in matched[:3]
            ]
            + [
                f"Address the missing {skill} requirement in the cover letter."
                for skill in missing[:3]
            ],
            "summary": (
                f"The resume covers {len(matched)} of {len(required) or 0} detected "
                f"requirements ({score}% match)."
            ),
        }

    def _interview_prep(self, ctx: dict) -> dict:
        description = ctx.get("job_description", "")
        resume = ctx.get("resume_content", "")
        skills = (extract_skills(description) or extract_skills(ctx.get("job_title", "")))[:6]
        resume_skills = extract_skills(resume)[:6]
        title = ctx.get("job_title", "this role")

        technical = [f"Explain how you would apply {skill} in a production environment." for skill in skills[:4]]
        if not technical:
            technical = [f"Walk through a technical project relevant to {title}."]
        behavioral = [
            "Tell me about a time you had to deliver under a tight deadline.",
            "Describe a conflict with a teammate and how you resolved it.",
            "Why are you interested in this role and company?",
            "What is a project you are most proud of and why?",
        ]
        role_specific = [
            f"What does success look like in the first 90 days as a {title}?",
            f"Which of your experiences with {', '.join(resume_skills[:3]) or 'your stack'} best matches this role?",
            "What are the biggest challenges the team is currently facing?",
        ]
        answers = [
            "Prepare a 2 minute summary of your background tailored to this job.",
            "Quantify impact for each project mentioned in your resume.",
            "Prepare examples demonstrating " + (", ".join(skills[:3]) or "core responsibilities") + ".",
        ]
        to_ask = [
            "How do you measure performance in this role?",
            "What does the interview process look like?",
            "How is the team structured?",
            "What are the next steps?",
        ]
        return {
            "technical_questions": technical,
            "behavioral_questions": behavioral,
            "role_specific_questions": role_specific,
            "suggested_answer_points": answers,
            "questions_to_ask": to_ask,
        }

    def _suggestions(self, ctx: dict) -> dict:
        match = self._job_match(ctx)
        missing: list[str] = match["missing_skills"]
        matched: list[str] = match["matched_skills"]
        title = ctx.get("job_title", "this role")

        return {
            "resume_customization": [
                f"Mirror the language used in the {title} description in your summary.",
                "Move the most relevant projects to the top of your resume.",
                f"Add a dedicated section covering {', '.join(missing[:3])} if you have real exposure."
                if missing
                else "Keep your skills section aligned with the listing.",
            ],
            "keywords_to_include": (missing[:5] or matched[:5]),
            "cover_letter_outline": [
                f"Opening: why {title} and the problem space interests you.",
                "Evidence: two achievements that map to the top requirements.",
                f"Skills: how your {', '.join(matched[:3]) or 'experience'} applies here.",
                "Close: enthusiasm and availability.",
            ],
            "skills_to_highlight": matched[:6],
            "potential_gaps": [
                f"No clear evidence of {skill} in the resume." for skill in missing[:4]
            ],
            "application_strategy": (
                "Apply with a tailored resume, then reach out to a recruiter or "
                "referral at the company referencing the specific requirements."
            ),
        }
