from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountResponse(BaseModel):
    id: str
    igUserId: str
    username: str
    profilePic: Optional[str]
    followersCount: int
    tokenExpiry: datetime
    webhookActive: bool
    createdAt: datetime
    automationCount: int = 0
