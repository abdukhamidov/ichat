from __future__ import annotations
from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from ..auth import get_current_user_id
from ..database import db

router = APIRouter()


@router.get("/summary")
async def get_summary(
    days: int = Query(7, ge=1, le=365),
    account_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    account_where: dict = {"userId": user_id}
    if account_id:
        account_where["id"] = account_id

    accounts = await db.instagramaccount.find_many(where=account_where)
    account_ids = [a.id for a in accounts]

    if not account_ids:
        return {
            "triggered": 0,
            "dmsSent": 0,
            "linksClicked": 0,
            "conversionRate": 0,
            "accounts": [],
        }

    stats_list = await db.automationstats.find_many(
        where={"automation": {"accountId": {"in": account_ids}}},
        include={"automation": {"include": {"account": True}}},
    )

    total_triggered = sum(s.triggered for s in stats_list)
    total_dms = sum(s.dmsSent for s in stats_list)
    total_links = sum(s.linksClicked for s in stats_list)
    conversion = (total_links / total_dms * 100) if total_dms > 0 else 0

    logs = await db.automationlog.find_many(
        where={
            "automation": {"accountId": {"in": account_ids}},
            "createdAt": {"gte": since},
        },
        order={"createdAt": "asc"},
    )

    daily: dict[str, int] = {}
    for log in logs:
        day = log.createdAt.strftime("%Y-%m-%d")
        daily[day] = daily.get(day, 0) + (1 if log.dmSent else 0)

    account_breakdown = []
    for acc in accounts:
        acc_stats = [s for s in stats_list if s.automation and s.automation.accountId == acc.id]
        account_breakdown.append({
            "id": acc.id,
            "username": acc.username,
            "profilePic": acc.profilePic,
            "triggered": sum(s.triggered for s in acc_stats),
            "dmsSent": sum(s.dmsSent for s in acc_stats),
            "linksClicked": sum(s.linksClicked for s in acc_stats),
        })

    errors = await db.automationlog.find_many(
        where={
            "automation": {"accountId": {"in": account_ids}},
            "error": {"not": None},
            "createdAt": {"gte": since},
        },
        order={"createdAt": "desc"},
        take=20,
    )

    return {
        "triggered": total_triggered,
        "dmsSent": total_dms,
        "linksClicked": total_links,
        "conversionRate": round(conversion, 1),
        "daily": daily,
        "accounts": account_breakdown,
        "errors": [
            {
                "id": e.id,
                "error": e.error,
                "contactName": e.contactName,
                "createdAt": e.createdAt,
            }
            for e in errors
        ],
    }
