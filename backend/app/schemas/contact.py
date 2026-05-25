from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContactUpdate(BaseModel):
    tags: Optional[list[str]] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: str
    accountId: str
    igUserId: str
    username: str
    fullName: Optional[str]
    profilePic: Optional[str]
    tags: list[str]
    notes: Optional[str]
    followsUs: Optional[bool]
    firstContact: datetime
    lastContact: datetime
    dmCount: int
