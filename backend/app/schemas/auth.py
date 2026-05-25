from __future__ import annotations
from pydantic import BaseModel
from typing import Optional


class AuthURLResponse(BaseModel):
    auth_url: str


class CallbackResponse(BaseModel):
    connected: list[str]
    token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
