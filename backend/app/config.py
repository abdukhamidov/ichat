from __future__ import annotations
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_login_mode: str = "instagram"
    demo_mode: bool = False
    redirect_uri: str = "http://localhost:8000/auth/callback"
    webhook_verify_token: str = "my_secure_verify_token_123"
    jwt_secret: str = "change_me"
    database_url: str = "postgresql://user:pass@localhost:5432/instauto"
    redis_url: str = "redis://localhost:6379"
    frontend_url: str = "http://localhost:3000"
    jwt_expiry_hours: int = 72

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
