from __future__ import annotations
import random
from typing import Optional, List
import httpx
from datetime import datetime, timezone
from ..database import db


def matches_keyword(text: str, keywords: list[str], exact: bool) -> bool:
    text_lower = text.lower().strip()
    for kw in keywords:
        kw_lower = kw.lower().strip()
        if exact:
            if text_lower == kw_lower:
                return True
        else:
            if kw_lower in text_lower:
                return True
    return False


async def send_dm(recipient_id: str, message: str, buttons: Optional[list], access_token: str) -> dict:
    payload: dict = {
        "recipient": {"id": recipient_id},
        "message": {"text": message},
    }

    if buttons:
        payload["message"] = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": message,
                    "buttons": [
                        {"type": "web_url", "url": b["url"], "title": b["label"]}
                        for b in buttons[:3]
                    ],
                },
            }
        }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://graph.facebook.com/v21.0/me/messages",
            params={"access_token": access_token},
            json=payload,
        )
        return res.json()


async def post_comment_reply(comment_id: str, message: str, access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"https://graph.facebook.com/v21.0/{comment_id}/replies",
            params={"access_token": access_token},
            json={"message": message},
        )
        return res.json()


async def check_follows(ig_user_id: str, follower_id: str, access_token: str) -> bool:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://graph.facebook.com/v21.0/{ig_user_id}",
            params={
                "fields": "business_discovery.fields(followers_count)",
                "access_token": access_token,
            },
        )
    return False


async def upsert_contact(account_id: str, ig_user_id: str, username: str, full_name: Optional[str] = None):
    now = datetime.now(timezone.utc)
    await db.contact.upsert(
        where={
            "accountId_igUserId": {
                "accountId": account_id,
                "igUserId": ig_user_id,
            }
        },
        data={
            "create": {
                "accountId": account_id,
                "igUserId": ig_user_id,
                "username": username or ig_user_id,
                "fullName": full_name,
                "firstContact": now,
                "lastContact": now,
                "dmCount": 1,
            },
            "update": {
                "lastContact": now,
                "dmCount": {"increment": 1},
                "username": username or ig_user_id,
            },
        },
    )


async def process_webhook_event(change: dict, ig_account_id: str):
    field = change.get("field")
    value = change.get("value", {})

    account = await db.instagramaccount.find_first(
        where={"igUserId": ig_account_id}
    )
    if not account:
        return

    if field == "messages":
        await handle_dm_trigger(value, account)
    elif field == "comments":
        await handle_comment_trigger(value, account)


async def handle_dm_trigger(value: dict, account):
    sender = value.get("sender", {})
    sender_id = sender.get("id")
    message_text = value.get("message", value.get("text", ""))
    if isinstance(message_text, dict):
        message_text = message_text.get("text", "")

    if not sender_id or sender_id == account.igUserId:
        return

    automations = await db.automation.find_many(
        where={
            "accountId": account.id,
            "isActive": True,
            "triggerType": {"in": ["dm_keyword", "any_dm"]},
        },
        include={"stats": True},
    )

    for auto in automations:
        if auto.triggerType == "dm_keyword" and auto.keywords:
            if not matches_keyword(message_text, auto.keywords, auto.exactMatch):
                continue

        buttons = auto.buttons if isinstance(auto.buttons, list) else None
        msg = auto.welcomeMsg

        if auto.checkFollow:
            follows = await check_follows(account.igUserId, sender_id, account.accessToken)
            if not follows and auto.noFollowMsg:
                msg = auto.noFollowMsg

        result = await send_dm(sender_id, msg, buttons, account.accessToken)
        error = result.get("error", {}).get("message") if "error" in result else None
        dm_sent = error is None

        await upsert_contact(account.id, sender_id, sender.get("username", sender_id))

        await db.automationlog.create(
            data={
                "automationId": auto.id,
                "contactIgId": sender_id,
                "contactName": sender.get("username"),
                "triggerType": "dm",
                "triggerText": message_text[:200] if message_text else None,
                "dmSent": dm_sent,
                "error": error,
            }
        )

        if auto.stats:
            await db.automationstats.update(
                where={"id": auto.stats.id},
                data={
                    "triggered": {"increment": 1},
                    "dmsSent": {"increment": 1 if dm_sent else 0},
                },
            )
        break


async def handle_comment_trigger(value: dict, account):
    commenter = value.get("from", {})
    commenter_id = commenter.get("id")
    comment_text = value.get("text", "")
    comment_id = value.get("id")

    if not commenter_id or commenter_id == account.igUserId:
        return

    automations = await db.automation.find_many(
        where={
            "accountId": account.id,
            "isActive": True,
            "triggerType": {"in": ["comment_keyword"]},
        },
        include={"stats": True},
    )

    for auto in automations:
        if auto.keywords and not matches_keyword(comment_text, auto.keywords, auto.exactMatch):
            continue

        buttons = auto.buttons if isinstance(auto.buttons, list) else None
        result = await send_dm(commenter_id, auto.welcomeMsg, buttons, account.accessToken)
        error = result.get("error", {}).get("message") if "error" in result else None
        dm_sent = error is None

        if auto.commentReplies and comment_id:
            reply_text = random.choice(auto.commentReplies)
            await post_comment_reply(comment_id, reply_text, account.accessToken)

        await upsert_contact(account.id, commenter_id, commenter.get("username", commenter_id))

        await db.automationlog.create(
            data={
                "automationId": auto.id,
                "contactIgId": commenter_id,
                "contactName": commenter.get("username"),
                "triggerType": "comment",
                "triggerText": comment_text[:200] if comment_text else None,
                "dmSent": dm_sent,
                "error": error,
            }
        )

        if auto.stats:
            await db.automationstats.update(
                where={"id": auto.stats.id},
                data={
                    "triggered": {"increment": 1},
                    "dmsSent": {"increment": 1 if dm_sent else 0},
                },
            )
        break
