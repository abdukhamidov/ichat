from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user_id
from ..database import db
from ..schemas.automation import (
    AutomationCreate,
    AutomationUpdate,
    AutomationResponse,
    AutomationLogResponse,
    AutomationStatsResponse,
)

router = APIRouter()


@router.get("")
async def list_automations(
    account_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
):
    where: dict = {"account": {"userId": user_id}}
    if account_id:
        where["accountId"] = account_id

    items = await db.automation.find_many(
        where=where,
        include={"stats": True, "account": True},
        order={"createdAt": "desc"},
    )

    results = []
    for a in items:
        stats = None
        if a.stats:
            stats = AutomationStatsResponse(
                triggered=a.stats.triggered,
                dmsSent=a.stats.dmsSent,
                linksClicked=a.stats.linksClicked,
            )
        results.append({
            "id": a.id,
            "accountId": a.accountId,
            "accountUsername": a.account.username if a.account else None,
            "accountProfilePic": a.account.profilePic if a.account else None,
            "name": a.name,
            "isActive": a.isActive,
            "triggerType": a.triggerType,
            "keywords": a.keywords,
            "exactMatch": a.exactMatch,
            "checkFollow": a.checkFollow,
            "welcomeMsg": a.welcomeMsg,
            "noFollowMsg": a.noFollowMsg,
            "afterFollowMsg": a.afterFollowMsg,
            "reminderMsg": a.reminderMsg,
            "reminderDelay": a.reminderDelay,
            "extraMsg": a.extraMsg,
            "extraDelay": a.extraDelay,
            "buttons": a.buttons,
            "commentReplies": a.commentReplies,
            "stats": stats,
            "createdAt": a.createdAt,
            "updatedAt": a.updatedAt,
        })

    return results


@router.get("/{automation_id}")
async def get_automation(automation_id: str, user_id: str = Depends(get_current_user_id)):
    a = await db.automation.find_first(
        where={"id": automation_id, "account": {"userId": user_id}},
        include={"stats": True, "account": True},
    )
    if not a:
        raise HTTPException(404, "Automation not found")
    return a


@router.post("")
async def create_automation(body: AutomationCreate, user_id: str = Depends(get_current_user_id)):
    account = await db.instagramaccount.find_first(
        where={"id": body.accountId, "userId": user_id}
    )
    if not account:
        raise HTTPException(404, "Account not found")

    buttons_json = [b.model_dump() for b in body.buttons] if body.buttons else None

    automation = await db.automation.create(
        data={
            "accountId": body.accountId,
            "name": body.name,
            "triggerType": body.triggerType,
            "keywords": body.keywords,
            "exactMatch": body.exactMatch,
            "checkFollow": body.checkFollow,
            "welcomeMsg": body.welcomeMsg,
            "noFollowMsg": body.noFollowMsg,
            "afterFollowMsg": body.afterFollowMsg,
            "reminderMsg": body.reminderMsg,
            "reminderDelay": body.reminderDelay,
            "extraMsg": body.extraMsg,
            "extraDelay": body.extraDelay,
            "buttons": buttons_json,
            "commentReplies": body.commentReplies,
        }
    )

    await db.automationstats.create(
        data={"automationId": automation.id}
    )

    return automation


@router.patch("/{automation_id}")
async def update_automation(
    automation_id: str,
    body: AutomationUpdate,
    user_id: str = Depends(get_current_user_id),
):
    existing = await db.automation.find_first(
        where={"id": automation_id, "account": {"userId": user_id}}
    )
    if not existing:
        raise HTTPException(404, "Automation not found")

    update_data = body.model_dump(exclude_unset=True)
    if "buttons" in update_data and update_data["buttons"] is not None:
        update_data["buttons"] = [b.model_dump() if hasattr(b, "model_dump") else b for b in update_data["buttons"]]

    updated = await db.automation.update(
        where={"id": automation_id},
        data=update_data,
    )
    return updated


@router.delete("/{automation_id}")
async def delete_automation(automation_id: str, user_id: str = Depends(get_current_user_id)):
    existing = await db.automation.find_first(
        where={"id": automation_id, "account": {"userId": user_id}}
    )
    if not existing:
        raise HTTPException(404, "Automation not found")

    await db.automation.delete(where={"id": automation_id})
    return {"ok": True}


@router.get("/{automation_id}/logs")
async def get_logs(
    automation_id: str,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    existing = await db.automation.find_first(
        where={"id": automation_id, "account": {"userId": user_id}}
    )
    if not existing:
        raise HTTPException(404, "Automation not found")

    logs = await db.automationlog.find_many(
        where={"automationId": automation_id},
        order={"createdAt": "desc"},
        take=limit,
    )
    return logs
