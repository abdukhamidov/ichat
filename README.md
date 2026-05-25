# iChat

Instagram DM automation project with a FastAPI backend and a Next.js frontend.

## Stack

- Backend: FastAPI, Prisma Client Python, PostgreSQL, Redis, Celery
- Frontend: Next.js 14, React, Tailwind CSS
- Integrations: Meta / Instagram OAuth

## Project Structure

- `backend/` API, workers, Prisma schema
- `frontend/` dashboard UI
- `docker-compose.yml` local PostgreSQL and Redis

## Local Setup

1. Start infrastructure:

```bash
docker compose up -d
```

2. Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

3. Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev -- --port 3001
```

## Required Environment Variables

Backend expects values such as:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_LOGIN_MODE`
- `REDIRECT_URI`
- `FRONTEND_URL`
- `DATABASE_URL`
- `REDIS_URL`

Frontend expects:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_META_APP_ID`

## Notes

- Real secrets are intentionally not committed.
- Use `.env.example` files as templates.
