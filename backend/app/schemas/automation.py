from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ButtonSchema(BaseModel):
    label: str
    url: str


class AutomationCreate(BaseModel):
    accountId: str
    name: str
    triggerType: str
    keywords: list[str] = []
    exactMatch: bool = False
    checkFollow: bool = False
    welcomeMsg: str
    noFollowMsg: Optional[str] = None
    afterFollowMsg: Optional[str] = None
    reminderMsg: Optional[str] = None
    reminderDelay: Optional[int] = None
    extraMsg: Optional[str] = None
    extraDelay: Optional[int] = None
    buttons: Optional[list[ButtonSchema]] = None
    commentReplies: list[str] = []


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    isActive: Optional[bool] = None
    triggerType: Optional[str] = None
    keywords: Optional[list[str]] = None
    exactMatch: Optional[bool] = None
    checkFollow: Optional[bool] = None
    welcomeMsg: Optional[str] = None
    noFollowMsg: Optional[str] = None
    afterFollowMsg: Optional[str] = None
    reminderMsg: Optional[str] = None
    reminderDelay: Optional[int] = None
    extraMsg: Optional[str] = None
    extraDelay: Optional[int] = None
    buttons: Optional[list[ButtonSchema]] = None
    commentReplies: Optional[list[str]] = None


class AutomationStatsResponse(BaseModel):
    triggered: int = 0
    dmsSent: int = 0
    linksClicked: int = 0


class AutomationResponse(BaseModel):
    id: str
    accountId: str
    name: str
    isActive: bool
    triggerType: str
    keywords: list[str]
    exactMatch: bool
    checkFollow: bool
    welcomeMsg: str
    noFollowMsg: Optional[str]
    afterFollowMsg: Optional[str]
    reminderMsg: Optional[str]
    reminderDelay: Optional[int]
    extraMsg: Optional[str]
    extraDelay: Optional[int]
    buttons: Optional[list[ButtonSchema]]
    commentReplies: list[str]
    stats: Optional[AutomationStatsResponse] = None
    createdAt: datetime
    updatedAt: datetime


class AutomationLogResponse(BaseModel):
    id: str
    automationId: str
    contactIgId: str
    contactName: Optional[str]
    triggerType: str
    triggerText: Optional[str]
    dmSent: bool
    error: Optional[str]
    createdAt: datetime
