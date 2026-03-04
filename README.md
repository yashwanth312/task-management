# Task Management — Internal Tool

A full-stack internal task management application built for small teams. Admins create and assign tasks to employees; employees view, update, and comment on their assigned tasks. Includes role-based access control, email notifications, and an admin reporting dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Reference](#api-reference)
- [Role & Permission Model](#role--permission-model)
- [Email Notifications](#email-notifications)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Features

- **Authentication** — Email + password login with JWT tokens (60-minute expiry)
- **Role-based access** — Admin and Employee roles with enforced permissions on both frontend and backend
- **Task management** — Create, assign, edit, filter, and delete tasks with priority and due date support
- **Status workflow** — `pending` → `in_progress` → `completed`
- **Comments** — Threaded comments on tasks for both admins and assigned employees
- **Email notifications** — Automatic emails when a task is assigned, reassigned, or its status changes
- **Admin dashboard** — Overview stats (total, pending, in-progress, completed, overdue) and a per-employee breakdown table
- **User management** — Admins can create, activate, and deactivate employee accounts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL (Neon serverless) via asyncpg |
| Auth | JWT (python-jose), bcrypt password hashing |
| Email | fastapi-mail with SMTP (Resend / SendGrid) |
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS |
| State | TanStack Query v5 (server state), React Context (auth) |
| Forms | React Hook Form + Zod |
| HTTP | Axios with JWT interceptor |
| Deployment | Render (backend), Vercel (frontend), Neon / Railway (database) |

---

## Project Structure

```
task-management/
├── task-management-backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, router registration
│   │   ├── config.py             # Pydantic settings (env vars)
│   │   ├── database.py           # Async SQLAlchemy engine + session
│   │   ├── models/               # user.py, task.py, comment.py
│   │   ├── schemas/              # Pydantic request / response schemas
│   │   ├── routers/              # auth, users, tasks, comments, dashboard
│   │   ├── services/             # auth_service.py, email_service.py
│   │   └── dependencies/         # get_current_user, require_admin
│   ├── migrations/               # Alembic env + versions
│   ├── seed_admin.py             # One-time admin user seeder
│   ├── render.yaml               # Render deployment config
│   └── requirements.txt
│
├── task-management-frontend/
│   ├── src/
│   │   ├── api/                  # Axios API functions per domain
│   │   ├── components/           # layout/, tasks/, comments/, dashboard/, ui/
│   │   ├── context/              # AuthContext.tsx
│   │   ├── hooks/                # useTasks, useComments, useUsers, useDashboard
│   │   ├── pages/                # One file per route
│   │   └── types/                # TypeScript interfaces
│   ├── vercel.json               # SPA rewrite config
│   └── package.json
│
├── CLAUDE.md                     # AI assistant guidance for this repo
├── DEPLOYMENT.md                 # Step-by-step deployment guide
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A PostgreSQL database (local, [Neon](https://neon.tech), or [Railway](https://railway.app))

---

### Backend Setup

```bash
cd task-management-backend

# 1. Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, SECRET_KEY, and optionally SMTP credentials

# 4. Run database migrations
PYTHONPATH=. alembic upgrade head

# 5. Seed the initial admin user
PYTHONPATH=. python seed_admin.py
# Default: admin@company.com / changeme123
# Override with: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env vars

# 6. Start the development server
uvicorn app.main:app --reload --port 8000
```

API is available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd task-management-frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

# 3. Start the development server
npm run dev
```

App is available at `http://localhost:5173`

---

## Environment Variables

### Backend — `task-management-backend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg scheme) | `postgresql+asyncpg://user:pass@host/db` |
| `SECRET_KEY` | JWT signing secret (32+ random chars) | `openssl rand -hex 32` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `60` |
| `MAIL_USERNAME` | SMTP username (leave blank to disable email) | `resend` |
| `MAIL_PASSWORD` | SMTP password / API key | `re_...` |
| `MAIL_FROM` | Sender address | `noreply@yourdomain.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_SERVER` | SMTP host | `smtp.resend.com` |
| `FRONTEND_URL` | Frontend origin — used for CORS and email links | `http://localhost:5173` |

> **Note:** The `DATABASE_URL` must not include `?sslmode=require` — SSL is configured internally via `connect_args={"ssl": True}` for asyncpg compatibility.

### Frontend — `task-management-frontend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL | `http://localhost:8000` |

---

## Database Migrations

```bash
# Apply all pending migrations
PYTHONPATH=. alembic upgrade head

# Auto-generate a new migration after model changes
PYTHONPATH=. alembic revision --autogenerate -m "your description"

# Roll back the last migration
PYTHONPATH=. alembic downgrade -1

# View current migration state
PYTHONPATH=. alembic current
```

Always prefix alembic commands with `PYTHONPATH=.` so it can import the `app` package.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | Public | Returns JWT access token |
| `GET` | `/users/me` | Any | Current user profile |
| `GET` | `/users` | Admin | List all users |
| `POST` | `/users` | Admin | Create a new user |
| `PATCH` | `/users/{id}` | Admin | Update user (role, active status) |
| `GET` | `/tasks` | Any | List tasks (employees see only assigned tasks) |
| `POST` | `/tasks` | Admin | Create a task |
| `GET` | `/tasks/{id}` | Owner / Admin | Get task detail |
| `PATCH` | `/tasks/{id}` | Admin | Full task edit (title, description, assignee, etc.) |
| `PATCH` | `/tasks/{id}/status` | Assignee / Admin | Update task status only |
| `DELETE` | `/tasks/{id}` | Admin | Delete a task |
| `GET` | `/tasks/{id}/comments` | Owner / Admin | List comments |
| `POST` | `/tasks/{id}/comments` | Owner / Admin | Add a comment |
| `DELETE` | `/tasks/{id}/comments/{cid}` | Author / Admin | Delete a comment |
| `GET` | `/dashboard/stats` | Admin | Aggregated task statistics |

Full interactive documentation is available at `/docs` (Swagger UI) when the backend is running.

---

## Role & Permission Model

### Admin
- See and manage **all** tasks
- Create, edit, reassign, and delete tasks
- Create and deactivate user accounts
- Access the dashboard and reporting

### Employee
- See **only tasks assigned to them**
- Update the status of their assigned tasks
- Add and delete their own comments
- Cannot access `/dashboard`, `/users`, or create/edit tasks

Permissions are enforced in two places:
1. **Backend** — `require_admin` FastAPI dependency + query-level filtering in task endpoints
2. **Frontend** — `<ProtectedRoute adminOnly />` hides routes; conditional rendering hides admin UI elements

---

## Email Notifications

Emails are sent asynchronously via FastAPI `BackgroundTasks` (no separate worker needed).

| Event | Recipient |
|-------|-----------|
| Task assigned | Assigned employee |
| Task reassigned | New assignee |
| Task status updated | Task creator (admin) |

Email is **silently skipped** if `MAIL_USERNAME` is empty — useful for local development.

**Recommended SMTP provider:** [Resend](https://resend.com) (free tier: 3,000 emails/month)

```
MAIL_SERVER=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=<your Resend API key>
MAIL_FROM=noreply@yourdomain.com
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide. Summary:

### Database — Neon (or Railway)
1. Create a PostgreSQL project
2. Copy the connection string and change the scheme to `postgresql+asyncpg://`

### Backend — Render
1. Connect the `task-management-backend/` directory
2. Set all environment variables in the Render dashboard (`render.yaml` is included)
3. After first deploy, run via Render shell:
   ```bash
   PYTHONPATH=. alembic upgrade head
   PYTHONPATH=. python seed_admin.py
   ```

### Frontend — Vercel
1. Connect the `task-management-frontend/` directory
2. Set `VITE_API_URL` to your Render backend URL
3. Deploy — `vercel.json` handles SPA client-side routing automatically

---

## Screenshots

> _Login, task list, task detail with comments, and admin dashboard screenshots go here._

---

## License

MIT
