from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user_id
from ..database import db
from ..schemas.account import AccountResponse

router = APIRouter()


@router.get("", response_model=list[AccountResponse])
async def list_accounts(user_id: str = Depends(get_current_user_id)):
    accounts = await db.instagramaccount.find_many(
        where={"userId": user_id},
        include={"automations": True},
    )
    return [
        AccountResponse(
            id=a.id,
            igUserId=a.igUserId,
            username=a.username,
            profilePic=a.profilePic,
            followersCount=a.followersCount,
            tokenExpiry=a.tokenExpiry,
            webhookActive=a.webhookActive,
            createdAt=a.createdAt,
            automationCount=len(a.automations) if a.automations else 0,
        )
        for a in accounts
    ]


@router.patch("/{account_id}/webhook")
async def toggle_webhook(account_id: str, user_id: str = Depends(get_current_user_id)):
    account = await db.instagramaccount.find_first(
        where={"id": account_id, "userId": user_id}
    )
    if not account:
        raise HTTPException(404, "Account not found")

    updated = await db.instagramaccount.update(
        where={"id": account_id},
        data={"webhookActive": not account.webhookActive},
    )
    return {"webhookActive": updated.webhookActive}


@router.delete("/{account_id}")
async def delete_account(account_id: str, user_id: str = Depends(get_current_user_id)):
    account = await db.instagramaccount.find_first(
        where={"id": account_id, "userId": user_id}
    )
    if not account:
        raise HTTPException(404, "Account not found")

    await db.instagramaccount.delete(where={"id": account_id})
    return {"ok": True}
