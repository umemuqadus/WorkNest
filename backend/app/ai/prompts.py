"""Prompt templates.

Rules baked into every prompt:
* use ONLY the supplied job description / resume,
* never invent salary, company details or candidate experience,
* clearly separate required from preferred skills,
* say "not specified" instead of guessing.
"""

from __future__ import annotations

from app.ai.base import AIRequest

_JSON_RULES = """
You are a precise career-assistant. Follow these rules without exception:
- Use ONLY the information provided in the JOB DESCRIPTION and RESUME sections.
- Never invent salary, company details, benefits, or years of experience.
- Never claim the candidate has a skill that is not present in the resume.
- Distinguish clearly between REQUIRED and PREFERRED/nice-to-have skills.
- If something is not specified, use an empty list or "Not specified".
- Reply with a single JSON object only. No markdown, no commentary.
""".strip()

JOB_ANALYSIS_SYSTEM = f"""{_JSON_RULES}

Task: analyse a job description.
Return JSON with exactly these keys:
summary (string, 2-4 sentences), required_skills (array of strings),
preferred_skills (array of strings), responsibilities (array of strings),
experience_required (string), education_required (string), keywords (array),
technologies (array), soft_skills (array), seniority (string),
employment_type (string), remote_type (string, one of remote|hybrid|onsite|not specified).
"""

MATCH_SYSTEM = f"""{_JSON_RULES}

Task: compare a candidate resume against a job description.
Return JSON with exactly these keys:
match_score (integer 0-100), matched_skills (array), missing_skills (array),
strengths (array), weaknesses (array), experience_match (string),
recommendations (array of concrete actions), summary (string).
match_score must reflect real overlap; 100 means the resume covers every requirement.
"""

INTERVIEW_PREP_SYSTEM = f"""{_JSON_RULES}

Task: prepare interview questions for a specific role.
Return JSON with exactly these keys:
technical_questions (array), behavioral_questions (array),
role_specific_questions (array), suggested_answer_points (array),
questions_to_ask (array).
Base every question on the actual job description and resume provided.
"""

SUGGESTIONS_SYSTEM = f"""{_JSON_RULES}

Task: suggest how the candidate should tailor their application for this job.
Never fabricate experience. Return JSON with exactly these keys:
resume_customization (array), keywords_to_include (array),
cover_letter_outline (array of bullet points), skills_to_highlight (array),
potential_gaps (array), application_strategy (string).
"""


def build_job_analysis_request(
    *, job_title: str, company_name: str, description: str, location: str = ""
) -> AIRequest:
    user_prompt = (
        "JOB DESCRIPTION\n"
        f"Title: {job_title}\n"
        f"Company: {company_name or 'Not specified'}\n"
        f"Location: {location or 'Not specified'}\n\n"
        f"{description or 'No description provided.'}"
    )
    return AIRequest(
        task="job_analysis",
        system_prompt=JOB_ANALYSIS_SYSTEM,
        user_prompt=user_prompt,
        context={
            "job_title": job_title,
            "company_name": company_name,
            "job_description": description or "",
        },
    )


def build_match_request(
    *, job_title: str, company_name: str, description: str, resume_content: str
) -> AIRequest:
    user_prompt = (
        "JOB DESCRIPTION\n"
        f"Title: {job_title}\n"
        f"Company: {company_name or 'Not specified'}\n\n"
        f"{description or 'No description provided.'}\n\n"
        "RESUME\n"
        f"{resume_content}"
    )
    return AIRequest(
        task="job_match",
        system_prompt=MATCH_SYSTEM,
        user_prompt=user_prompt,
        context={
            "job_title": job_title,
            "company_name": company_name,
            "job_description": description or "",
            "resume_content": resume_content,
        },
    )


def build_interview_prep_request(
    *, job_title: str, company_name: str, description: str, resume_content: str
) -> AIRequest:
    user_prompt = (
        "JOB DESCRIPTION\n"
        f"Title: {job_title}\n"
        f"Company: {company_name or 'Not specified'}\n\n"
        f"{description or 'No description provided.'}\n\n"
        "RESUME\n"
        f"{resume_content}"
    )
    return AIRequest(
        task="interview_prep",
        system_prompt=INTERVIEW_PREP_SYSTEM,
        user_prompt=user_prompt,
        context={
            "job_title": job_title,
            "company_name": company_name,
            "job_description": description or "",
            "resume_content": resume_content,
        },
    )


def build_suggestions_request(
    *, job_title: str, company_name: str, description: str, resume_content: str
) -> AIRequest:
    user_prompt = (
        "JOB DESCRIPTION\n"
        f"Title: {job_title}\n"
        f"Company: {company_name or 'Not specified'}\n\n"
        f"{description or 'No description provided.'}\n\n"
        "RESUME\n"
        f"{resume_content}"
    )
    return AIRequest(
        task="application_suggestions",
        system_prompt=SUGGESTIONS_SYSTEM,
        user_prompt=user_prompt,
        context={
            "job_title": job_title,
            "company_name": company_name,
            "job_description": description or "",
            "resume_content": resume_content,
        },
    )
