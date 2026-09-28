"""FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import (
    ai,
    analytics,
    applications,
    auth,
    companies,
    contacts,
    interviews,
    jobs,
    notes,
    resumes,
    search,
    tasks,
)
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Track jobs, applications, companies, contacts and interviews, with "
        "AI powered job analysis, resume matching and interview preparation."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Error handling - consistent {"detail", "code", "field"} envelope
# --------------------------------------------------------------------------
@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    messages = []
    field = None
    for error in errors:
        location = [str(part) for part in error.get("loc", []) if part != "body"]
        if field is None and location:
            field = ".".join(location)
        messages.append(f"{'.'.join(location) or 'body'}: {error.get('msg', 'invalid value')}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": messages[0] if messages else "Invalid request payload.",
            "code": "validation_error",
            "field": field,
            "errors": messages,
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
    code = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        429: "rate_limited",
    }.get(exc.status_code, "http_error")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail, "code": code, "field": None},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    # Never expose stack traces to the client.
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Something went wrong on our side. Please try again.",
            "code": "internal_error",
            "field": None,
        },
    )


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
API_PREFIX = settings.API_PREFIX

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(jobs.router, prefix=API_PREFIX)
app.include_router(companies.router, prefix=API_PREFIX)
app.include_router(contacts.router, prefix=API_PREFIX)
app.include_router(applications.router, prefix=API_PREFIX)
app.include_router(resumes.router, prefix=API_PREFIX)
app.include_router(ai.router, prefix=API_PREFIX)
app.include_router(interviews.router, prefix=API_PREFIX)
app.include_router(tasks.router, prefix=API_PREFIX)
app.include_router(notes.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(search.router, prefix=API_PREFIX)


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.get(f"{API_PREFIX}/health", tags=["system"])
def api_health() -> dict:
    return {"status": "ok", "service": settings.PROJECT_NAME}
