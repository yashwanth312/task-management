# Deployment Guide

## 1. PostgreSQL — Railway

1. Create a Railway project, add PostgreSQL plugin.
2. Copy the `DATABASE_URL` (use `postgresql+asyncpg://...` scheme).

## 2. Backend — Render

1. Connect the `task-management-backend/` directory (or repo root with `render.yaml`).
2. Set environment variables in Render dashboard:
   - `DATABASE_URL` — Railway PostgreSQL URL (asyncpg scheme)
   - `SECRET_KEY` — random 32+ char string
   - `FRONTEND_URL` — your Vercel deployment URL
   - `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SERVER` — SMTP credentials
3. After first deploy, run migrations and seed admin:
   ```bash
   # In Render shell or locally with DATABASE_URL set:
   alembic upgrade head
   ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=yourpassword python seed_admin.py
   ```

## 3. Frontend — Vercel

1. Connect the `task-management-frontend/` directory (or repo root).
2. Set environment variable:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://task-management-api.onrender.com`)
3. Deploy — `vercel.json` handles SPA routing.

## Local Development

### Backend
```bash
cd task-management-backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # fill in values
alembic upgrade head
python seed_admin.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd task-management-frontend
npm install
cp .env.example .env  # set VITE_API_URL=http://localhost:8000
npm run dev
```

## Email (SMTP)

Use [Resend](https://resend.com) free tier (3,000 emails/month):
- `MAIL_SERVER=smtp.resend.com`
- `MAIL_PORT=587`
- `MAIL_USERNAME=resend`
- `MAIL_PASSWORD=<your Resend API key>`
- `MAIL_FROM=noreply@yourdomain.com`

If `MAIL_USERNAME` is empty, email sending is skipped gracefully (logged only).
