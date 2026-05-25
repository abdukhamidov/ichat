from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import connect_db, disconnect_db
from .config import get_settings
from .routers import auth, accounts, automations, webhook, contacts, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(title="InstaChat API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
app.include_router(automations.router, prefix="/automations", tags=["automations"])
app.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/")
async def root():
    return {
        "name": "InstaChat API",
        "status": "ok",
        "health": "/health",
        "docs": "/docs",
        "frontend": settings.frontend_url,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
