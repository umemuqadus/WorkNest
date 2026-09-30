# WorkNest

A production-style job search CRM with an **AI copilot**: track jobs, applications, companies,
contacts, resumes, interviews and tasks — then use provider-agnostic AI for job analysis,
resume↔job matching, interview prep and application suggestions.

**Stack**

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form, Zod, Recharts, Lucide |
| Backend   | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT (PyJWT), bcrypt |
| AI layer  | Gemini **or** any OpenAI-compatible endpoint **or** deterministic mock fallback |
| Tooling   | Docker Compose, pytest, Vitest + Testing Library |

---

## 1. Requirements

- Python **3.12+**
- Node **18+** (tested on 24) and npm
- PostgreSQL **14+** (or use Docker Compose, which bundles it)
- (Optional) Docker — only needed if you prefer containers

## 2. Quick start (local, no Docker)

### 2.1 Database

```bash
# create the database once (psql or pgAdmin)
createdb ai_job_tracker
# or: psql -U postgres -c "CREATE DATABASE ai_job_tracker;"
```

### 2.2 Backend

```bash
cd backend

# virtualenv
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# configure
copy .env.example .env        # Windows
cp .env.example .env          # macOS/Linux
# then edit .env (at minimum DATABASE_URL, optionally AI_API_KEY)

# run migrations + seed demo data
alembic upgrade head
python -m app.db.seed

# start the API (http://127.0.0.1:8000)
uvicorn app.main:app --reload
```

### 2.3 Frontend

```bash
cd frontend

npm install

# dev server with /api proxy -> http://127.0.0.1:8000
npm run dev
# open http://127.0.0.1:5173
```

### 2.4 Demo login

```
email:    demo@example.com
password: Demo123!
```

---

## 3. Docker Compose (alternative)

```bash
docker compose up --build
# API   -> http://localhost:8000  (docs at /docs)
# Web   -> http://localhost:5173
# DB    -> postgres on 5432
```

The `api` container waits for Postgres, runs `alembic upgrade head` and seeds the demo user
on first boot, so the app is usable as soon as both containers are healthy. Sign in with the
demo credentials above.

Useful overrides (env vars read by `docker-compose.yml`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_PORT` | `5432` | Host port for Postgres — set `5433` if a local PostgreSQL already owns 5432 |
| `API_PORT` | `8000` | Host port for the API — set `8001` if something else already owns 8000 |
| `SEED_DB` | `true` | Set `false` to skip seeding the demo data |
| `JWT_SECRET_KEY` | dev value | **Change in production** |
| `AI_PROVIDER` / `GEMINI_API_KEY` / `OPENAI_API_KEY` | `gemini` / empty | Same AI settings as `backend/.env` |

Re-run migrations or seeding manually if you ever need to:

```bash
docker compose exec api alembic upgrade head
docker compose exec api python -m app.db.seed
```

---

## 4. Environment variables

`backend/.env` (see `backend/.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | yes | `postgresql+psycopg://postgres:postgres@localhost:5432/ai_job_tracker` | SQLAlchemy database URL |
| `SECRET_KEY` | yes | dev value | JWT signing key — **change in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | `1440` | Access token lifetime |
| `CORS_ORIGINS` | no | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |
| `AI_PROVIDER` | no | `gemini` | `gemini`, `openai` or `mock` |
| `AI_API_KEY` | no | *(empty)* | Provider API key — never committed |
| `AI_MODEL` | no | provider default | e.g. `gemini-2.0-flash`, `gpt-4o-mini` |
| `AI_BASE_URL` | no | *(empty)* | Custom OpenAI-compatible base URL |
| `RATE_LIMIT_ENABLED` | no | `true` | In-memory sliding-window rate limiting |

Frontend:

| Variable | Default | Description |
|----------|---------|-------------|
| *(none required)* | — | API base URL is `/api`, proxied by Vite in dev (`vite.config.ts`) |

> **No key? No problem.** If `AI_API_KEY` is missing the backend transparently falls back to a
> deterministic mock provider, so every AI feature still works and returns cached results.

---

## 5. Commands

### Backend

```bash
cd backend
venv\Scripts\activate            # or: source venv/bin/activate

uvicorn app.main:app --reload    # dev server
pytest                           # run the test suite (81 tests)
pytest tests/test_jobs.py -q     # a single test module
alembic upgrade head             # apply migrations
alembic revision --autogenerate -m "message"   # create a migration
python -m app.db.seed            # seed demo data
python -m app.db.seed --reset    # wipe + reseed
python scripts/smoke_test.py     # live end-to-end API checks (server must be running)
```

### Frontend

```bash
cd frontend
npm install        # install deps
npm run dev        # dev server (port 5173, proxies /api -> 8000)
npm run build      # typecheck + production build -> dist/
npm run preview    # serve the production build
npm test           # vitest + testing library
npm run typecheck  # tsc --noEmit
```

---

## 6. Architecture

```
fastapi_project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # DB session, current user, bearer auth
│   │   │   └── routes/          # thin HTTP layer (auth, jobs, companies, contacts,
│   │   │                        #  applications, resumes, ai, interviews, tasks,
│   │   │                        #  notes, analytics, search)
│   │   ├── services/            # business logic + authorization (per-user scoping)
│   │   ├── repositories/        # query layer (pagination, filters, aggregates)
│   │   ├── models/              # SQLAlchemy 2.0 models + enums
│   │   ├── schemas/             # Pydantic v2 request/response models
│   │   ├── ai/                  # AIProvider ABC + gemini/openai/mock + prompts/parser
│   │   ├── core/                # config, security (bcrypt/JWT), exceptions, logging, rate limit
│   │   └── db/                  # session, base, seed
│   ├── alembic/                 # migrations (initial schema applied)
│   ├── tests/                   # pytest suite (81 tests, SQLite in-memory)
│   └── scripts/smoke_test.py    # 26 live checks against the running API
├── frontend/
│   └── src/
│       ├── pages/               # Login, Register, Dashboard, Jobs, JobDetail,
│       │                        #  Applications (Kanban), Companies, CompanyDetail,
│       │                        #  Contacts, Resumes, Interviews, Tasks, Analytics,
│       │                        #  Settings, NotFound
│       ├── features/            # JobFormModal, AiInsights (4 AI panels), NotesPanel, GlobalSearch
│       ├── components/ui/       # Button, Input, Select, Modal, Table, Badge, Toast, ...
│       ├── layouts/             # responsive DashboardLayout (sidebar + drawer)
│       ├── services/            # typed API clients per module
│       ├── context/             # AuthContext (JWT in localStorage)
│       └── lib/                 # axios instance, query client, labels, formatting utils
├── docker-compose.yml
└── README.md
```

**Request flow:** `route → service → repository → model`. Route handlers stay thin; services own
validation, business rules and the *owner check* (foreign records return **404**, never 403,
so IDs cannot be probed).

---

## 7. API overview

All routes are prefixed with `/api`. Interactive docs: `http://127.0.0.1:8000/docs`.

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me`, `POST /auth/change-password`, `POST /auth/logout` |
| Jobs | `GET/POST /jobs`, `GET/PATCH/DELETE /jobs/{id}`, `PATCH /jobs/{id}/status`, `PATCH /jobs/{id}/priority` |
| Companies | `GET/POST /companies`, `GET/PATCH/DELETE /companies/{id}` |
| Contacts | `GET/POST /contacts`, `GET/PATCH/DELETE /contacts/{id}` |
| Applications | `GET/POST /applications`, `GET/PATCH/DELETE /applications/{id}` (+ status history, interviews) |
| Resumes | `GET/POST /resumes`, `GET/PATCH/DELETE /resumes/{id}`, `POST /resumes/{id}/default` |
| AI | `GET /ai/status`, `POST /ai/jobs/{id}/analyze`, `POST /ai/jobs/{id}/match`, `POST /ai/jobs/{id}/interview-prep`, `POST /ai/jobs/{id}/application-suggestions` (+ matching `GET`s, `?refresh=true` to regenerate) |
| Interviews | `GET/POST /interviews`, `GET/PATCH/DELETE /interviews/{id}` |
| Tasks | `GET/POST /tasks`, `PATCH/DELETE /tasks/{id}` |
| Notes | `GET/POST /notes`, `PATCH/DELETE /notes/{id}` (polymorphic: job/company/application/contact/interview) |
| Analytics | `GET /analytics/dashboard`, `/analytics/overview`, `/analytics/applications`, `/analytics/status`, `/analytics/sources` |
| Search | `GET /search?q=...` — jobs, companies, contacts, applications in one call |
| System | `GET /health` |

**Error envelope** (every error, no stack traces):

```json
{ "detail": "Human readable message", "code": "validation_error", "field": "email" }
```

Status codes: `400` bad request · `401` unauthenticated · `404` not found/foreign ·
`409` conflict · `422` validation · `429` rate limited · `502` upstream AI failure · `500` internal.

---

## 8. Testing

```bash
# backend — 81 tests (auth, CRUD, authorization/isolation, applications, analytics, AI fallback)
cd backend && pytest

# frontend — 125 tests (UI components, routing/auth guards, labels, formatters,
#  debounce hook, API error mapping) across 8 files
cd frontend && npm test

# live end-to-end smoke test (server running on :8000)
cd backend && python scripts/smoke_test.py
```

---

## 9. Notable decisions & limitations

- **Integer PKs** (not UUIDs) and enum columns stored as `VARCHAR` so the same schema runs on
  PostgreSQL in production and in-memory SQLite in tests.
- **Notes are polymorphic** (`entity_type` + `entity_id`) with ownership checks in the service
  layer instead of five separate join tables.
- **AI results are cached** in the database per user/job/resume; `?refresh=true` forces a
  regeneration. Without an API key the mock provider is used (clearly flagged in the UI and via
  `GET /api/ai/status`).
- **Rate limiting** is in-memory (per-process) — swap for Redis in a multi-instance deployment.
- **Frontend is code-split**: every page is a `React.lazy` route and Vite emits separate vendor
  chunks (`react`, `router`, `tanstack`, `vendor`, `icons`). Initial JS+CSS is ~524 kB instead of
  a single ~983 kB bundle, and recharts (used only by Analytics) is a lazy 341 kB chunk.
- **Resume files** are stored as text + optional `file_url` (link-based); direct file upload/S3
  is not included.
- **Docker**: `docker-compose.yml` ships `db` + `api` + `web`; the API entrypoint waits for
  Postgres, runs migrations and seeds on boot. The container path is verified end-to-end
  (`docker compose up --build` → all three containers healthy → 26/26 smoke checks against the
  containerized API, with nginx proxying `/api` from the web container). If a local PostgreSQL
  already owns port 5432, start with `POSTGRES_PORT=5433 docker compose up --build`; likewise
  `API_PORT=8001` if 8000 is taken. `.gitattributes` forces LF endings for `*.sh` / `Dockerfile`
  / `*.conf` so the Linux containers can exec them (CRLF breaks `entrypoint.sh`).
- Passwords are hashed with **bcrypt (12 rounds)**; JWTs are stateless (logout clears the token
  client-side).
