# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack internal task management tool for a 10-person company.
- **Backend**: FastAPI (Python) + SQLAlchemy async + PostgreSQL (Neon cloud)
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Deployment**: Backend → Render, Frontend → Vercel, DB → Neon (Railway-compatible)

---

## Commands

### Backend

```bash
cd task-management-backend

# Create and activate venv (Windows)
python -m venv .venv && .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (must set PYTHONPATH so alembic can import `app`)
PYTHONPATH=. alembic upgrade head

# Seed initial admin user (env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
PYTHONPATH=. python seed_admin.py

# Start dev server
uvicorn app.main:app --reload --port 8000
```

On Windows with venv use `.venv\Scripts\uvicorn`, `.venv\Scripts\alembic`, etc. instead of bare commands.

When running alembic, always prefix with `PYTHONPATH=.` — Alembic's `env.py` imports from `app` which requires the project root on the path.

### Frontend

```bash
cd task-management-frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle
```

### No test suite exists yet.

---

## Architecture

### Backend

**`app/config.py`** — `Settings` (pydantic-settings) loads all env vars. Imported as `settings` singleton throughout. The `DATABASE_URL` uses `postgresql+asyncpg://` scheme; SSL is set via `connect_args={"ssl": True}` in `database.py` (not via URL params — asyncpg doesn't accept `sslmode`).

**`app/database.py`** — Async SQLAlchemy engine + `AsyncSessionLocal`. `get_db()` is the FastAPI dependency that yields a session. All models inherit from `Base` defined here.

**`app/dependencies/auth.py`** — The entire permission model lives here:
- `get_current_user` — decodes JWT, queries DB, returns `User`
- `require_admin` — wraps `get_current_user`, raises 403 if `role != "admin"`

**`app/routers/tasks.py`** — Most complex router. Enforces role-based filtering (employees see only `assigned_to == user.id`), triggers `BackgroundTasks` email on assignment and status changes.

**`app/services/email_service.py`** — Uses FastAPI `BackgroundTasks` (no Celery). Gracefully skips sending if `MAIL_USERNAME` is empty.

**Password hashing** uses `bcrypt` directly (not `passlib`) — `passlib 1.7.4` is incompatible with `bcrypt >= 4.x`.

**Alembic migrations** — `migrations/env.py` overrides `sqlalchemy.url` from `settings.DATABASE_URL` programmatically, so `alembic.ini` contains a dummy URL placeholder. Migration `0001_initial.py` uses idempotent `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$` for enum types and `CREATE TABLE IF NOT EXISTS` for tables.

### Frontend

**`src/api/client.ts`** — Single Axios instance. Request interceptor attaches `Authorization: Bearer <token>` from `localStorage`. Response interceptor on 401 clears token and redirects to `/login`.

**`src/context/AuthContext.tsx`** — Auth state (`user`, `isLoading`, `login`, `logout`). On mount, reads `localStorage.access_token` and calls `GET /users/me` to validate. Token stored in `localStorage` (not cookies).

**`src/App.tsx`** — Route tree: `QueryClientProvider → AuthProvider → BrowserRouter`. Routes are nested: outer `ProtectedRoute` (requires login) wraps `AppLayout`, inner `ProtectedRoute adminOnly` gates dashboard/users/create-task/edit-task. The `/tasks/new` route must appear before `/tasks/:id` in the tree.

**React Query** — All server state via TanStack Query v5. Query keys: `["tasks"]`, `["tasks", id]`, `["comments", taskId]`, `["users"]`, `["dashboard"]`. Mutations call `qc.invalidateQueries()` on success to refetch.

**Forms** — React Hook Form + Zod resolver. Shared `TaskForm` component used by both `CreateTaskPage` and `EditTaskPage`.

### Role Model

| Role | Can do |
|------|--------|
| admin | All CRUD on tasks, see all tasks, manage users, view dashboard |
| employee | See only assigned tasks, update status, add/delete own comments |

Both backend (dependency checks + query filters) and frontend (route guards + conditional UI) enforce this.

---

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql+asyncpg://...   # No sslmode in URL; SSL via connect_args
SECRET_KEY=<32+ char random string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
MAIL_USERNAME=                          # Leave empty to disable email (logs only)
MAIL_PASSWORD=
MAIL_FROM=noreply@yourdomain.com
MAIL_PORT=587
MAIL_SERVER=smtp.resend.com
FRONTEND_URL=http://localhost:5173      # Used for CORS and email link generation
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:8000
```

---

## Key Deployment Notes

- **Render** (`render.yaml`): set `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, SMTP vars as env vars in dashboard
- **Vercel** (`vercel.json`): SPA rewrite (`/(.*) → /`) handles client-side routing; set `VITE_API_URL`
- After deploying backend, run `alembic upgrade head` and `python seed_admin.py` via Render shell
- Default admin credentials from `seed_admin.py`: `admin@company.com` / `changeme123` (override via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars)
