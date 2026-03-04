# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Full-stack internal task management tool for a 10-person company.

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI 0.115, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL — Neon serverless (asyncpg driver) |
| Auth | JWT via python-jose, bcrypt 4.2.1 password hashing |
| Email | fastapi-mail with SMTP (Resend / SendGrid) via BackgroundTasks |
| Frontend | React 18, TypeScript, Vite 6 |
| UI | Tailwind CSS 3 |
| State | TanStack Query v5 (server), React Context (auth) |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| HTTP client | Axios with JWT request interceptor + 401 response interceptor |

---

## Current Application Status

### ✅ Phase 1 — Backend Foundation (Complete)
- All SQLAlchemy models: `User`, `Task`, `Comment`
- Alembic migration `0001_initial` applied to live Neon database
- Admin user seeded: `admin@company.com` / `changeme123`
- JWT auth with `get_current_user` + `require_admin` dependencies
- All 14 API endpoints implemented across 5 routers
- Email service with graceful skip when `MAIL_USERNAME` is empty
- CORS configured; `render.yaml` ready for Render deployment

### ✅ Phase 2 — Frontend Foundation (Complete)
- Vite + React + TypeScript project with Tailwind CSS
- Axios client with JWT interceptor (`src/api/client.ts`)
- `AuthContext` with token persistence in `localStorage`
- `ProtectedRoute` with `adminOnly` prop
- Full app router with role-gated routes
- `Navbar` + `Sidebar` + `AppLayout`

### ✅ Phase 3 — Feature Pages (Complete)
- `LoginPage`, `TasksPage`, `TaskDetailPage`, `CreateTaskPage`, `EditTaskPage`
- `DashboardPage` with stat cards + per-employee table
- `UsersPage` with employee table + add-employee modal
- Shared `TaskForm` component (used by Create and Edit pages)
- `CommentList` + `AddComment` components on task detail

### ✅ Phase 4 — Source Control (Complete)
- Git repo initialised; all source committed (90 files, 5978 insertions)
- GitHub: **https://github.com/yashwanth312/task-management**
- `README.md` and `DEPLOYMENT.md` pushed

### ⏳ Phase 4 — Cloud Deployment (Pending)
- Backend → Render (config ready in `render.yaml`)
- Frontend → Vercel (config ready in `vercel.json`)
- Both pending manual setup (see `DEPLOYMENT.md`)

### ⏳ Tests
No test suite exists yet.

---

## Live Infrastructure

| Service | Details |
|---------|---------|
| **Database** | Neon PostgreSQL — `ep-floral-boat-aidfkxut-pooler.c-4.us-east-1.aws.neon.tech` |
| **Backend (local)** | `http://localhost:8000` — Uvicorn with `--reload` |
| **Frontend (local)** | `http://localhost:5173` — Vite dev server |
| **API Docs** | `http://localhost:8000/docs` (Swagger UI) |
| **GitHub** | `https://github.com/yashwanth312/task-management` |

---

## Commands

### Backend

```bash
cd task-management-backend

# Windows venv
python -m venv .venv && .venv\Scripts\activate

# Install
pip install -r requirements.txt

# Migrations — PYTHONPATH=. is required (env.py imports app.*)
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. alembic revision --autogenerate -m "description"
PYTHONPATH=. alembic downgrade -1

# Seed admin (env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
PYTHONPATH=. python seed_admin.py

# Dev server
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

On Windows with venv, prefix bare commands with `.venv\Scripts\` (e.g. `.venv\Scripts\alembic`).

### Frontend

```bash
cd task-management-frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # TypeScript check + production bundle
npm run preview    # Serve production build locally
```

### Git / GitHub

```bash
# GitHub CLI is installed at: C:\Program Files\GitHub CLI\gh.exe
# PATH must include it in the current shell:
export PATH="$PATH:/c/Program Files/GitHub CLI"

gh auth status
git add <files> && git commit -m "message" && git push
```

---

## Architecture

### Backend

**`app/config.py`** — `Settings` (pydantic-settings) loads all env from `.env`. Imported as the `settings` singleton everywhere. The `DATABASE_URL` must use `postgresql+asyncpg://` scheme with no `?sslmode` param.

**`app/database.py`** — Async SQLAlchemy engine created with `connect_args={"ssl": True}` (asyncpg does not accept `sslmode` as a URL query param). `get_db()` yields an `AsyncSession` via FastAPI `Depends`.

**`app/dependencies/auth.py`** — Single source of truth for auth:
- `get_current_user` — decodes JWT `sub` claim, queries DB, validates `is_active`
- `require_admin` — calls `get_current_user`, raises `403` if `role != "admin"`

**`app/routers/tasks.py`** — Most complex router. Employees are filtered to `assigned_to == user.id` at query level. Fires `BackgroundTasks` email on create (if assigned) and on status update (to notify creator).

**`app/services/auth_service.py`** — Uses `bcrypt` directly (not `passlib`) because `passlib 1.7.4` is incompatible with `bcrypt >= 4.x`. Functions: `hash_password`, `verify_password`, `create_access_token`.

**`app/services/email_service.py`** — If `MAIL_USERNAME` is empty, email sending is silently skipped (logged). No Celery or Redis needed — volume is trivially small.

**`migrations/env.py`** — Overrides `sqlalchemy.url` from `settings.DATABASE_URL` programmatically; `alembic.ini` has a dummy placeholder URL. Migration `0001_initial.py` is fully idempotent: uses `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$` for enum types and `CREATE TABLE IF NOT EXISTS` for tables.

### Frontend

**`src/api/client.ts`** — Single Axios instance. Request interceptor reads `localStorage.access_token` and injects `Authorization: Bearer`. Response interceptor on 401 clears token and redirects to `/login`.

**`src/context/AuthContext.tsx`** — On mount: reads `localStorage.access_token`, calls `GET /users/me` to validate, sets `user` state. Provides `login(data)` (calls `/auth/login` then `/users/me`), `logout()` (clears storage + state).

**`src/App.tsx`** — Provider order: `QueryClientProvider → AuthProvider → BrowserRouter`. Route nesting:
```
ProtectedRoute (auth required)
  AppLayout (Sidebar + Navbar + Outlet)
    /tasks                      — any authenticated user
    /tasks/:id                  — any authenticated user
    ProtectedRoute (adminOnly)
      /tasks/new
      /tasks/:id/edit
      /dashboard
      /users
```
`/tasks/new` must appear before `/tasks/:id` in the tree to avoid the static segment being consumed by the dynamic param.

**React Query keys:**
- `["tasks"]` / `["tasks", params]` / `["tasks", id]`
- `["comments", taskId]`
- `["users"]`
- `["dashboard"]`

**Forms** — `TaskForm` is shared between `CreateTaskPage` and `EditTaskPage`. `defaultValues` are passed in from the existing `Task` object on edit.

### Database Schema

```
users        id (UUID PK), email, hashed_password, full_name,
             role (admin|employee), is_active, created_at

tasks        id (UUID PK), title, description,
             status (pending|in_progress|completed),
             priority (low|medium|high), due_date,
             created_by (FK→users), assigned_to (FK→users, nullable),
             created_at, updated_at

comments     id (UUID PK), task_id (FK→tasks CASCADE DELETE),
             author_id (FK→users), body, created_at
```

Indexes: `tasks.assigned_to`, `tasks.status`, `tasks.due_date`, `comments.task_id`, `users.email`

### API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/login` | Public |
| GET | `/users/me` | Any |
| GET | `/users` | Admin |
| POST | `/users` | Admin |
| PATCH | `/users/{id}` | Admin |
| GET | `/tasks` | Any (filtered by role) |
| POST | `/tasks` | Admin |
| GET | `/tasks/{id}` | Owner or Admin |
| PATCH | `/tasks/{id}` | Admin |
| PATCH | `/tasks/{id}/status` | Assignee or Admin |
| DELETE | `/tasks/{id}` | Admin |
| GET | `/tasks/{id}/comments` | Owner or Admin |
| POST | `/tasks/{id}/comments` | Owner or Admin |
| DELETE | `/tasks/{id}/comments/{cid}` | Author or Admin |
| GET | `/dashboard/stats` | Admin |

---

## Environment Variables

### Backend — `task-management-backend/.env`

```
DATABASE_URL=postgresql+asyncpg://...   # NO ?sslmode — SSL via connect_args in database.py
SECRET_KEY=<32+ hex chars>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
MAIL_USERNAME=                          # Empty = email disabled (graceful skip)
MAIL_PASSWORD=
MAIL_FROM=noreply@yourdomain.com
MAIL_PORT=587
MAIL_SERVER=smtp.resend.com
MAIL_FROM_NAME=Task Management
FRONTEND_URL=http://localhost:5173      # CORS origin + base URL for email links
```

### Frontend — `task-management-frontend/.env`

```
VITE_API_URL=http://localhost:8000
```

---

## Known Issues & Fixes Applied

| Issue | Fix |
|-------|-----|
| `asyncpg` rejects `?sslmode=require` in URL | Removed from URL; added `connect_args={"ssl": True}` in `database.py` |
| `passlib 1.7.4` incompatible with `bcrypt >= 4.x` | Removed passlib; use `bcrypt` directly in `auth_service.py` |
| Alembic `ModuleNotFoundError: No module named 'app'` | Always run with `PYTHONPATH=.` prefix |
| `%(DATABASE_URL)s` in `alembic.ini` broke INI interpolation | Replaced with dummy URL; `env.py` sets URL from `settings` via `config.set_main_option()` |
| Partial migration left orphan enums on re-run | Migration rewritten to use `DO $$ ... EXCEPTION WHEN duplicate_object` + `IF NOT EXISTS` |
| `gh` CLI not on PATH after winget install | Prepend `/c/Program Files/GitHub CLI` to PATH in shell before use |

---

## Deployment

See `DEPLOYMENT.md` for full steps. Summary:

- **Database**: Neon — already provisioned and migrated
- **Backend → Render**: `render.yaml` included. Set env vars, then run `alembic upgrade head` + `python seed_admin.py` via shell after first deploy.
- **Frontend → Vercel**: `vercel.json` handles SPA rewrites. Set `VITE_API_URL` to the Render backend URL.
- Default seeded admin: `admin@company.com` / `changeme123`
