from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Query
import hmac
import hashlib
from ..config import get_settings
from ..services.automation import process_webhook_event

router = APIRouter()


@router.get("/meta")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    settings = get_settings()
    if hub_mode == "subscribe" and hub_verify_token == settings.webhook_verify_token:
        return int(hub_challenge)
    raise HTTPException(403, "Verification failed")


@router.post("/meta")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    settings = get_settings()
    signature = request.headers.get("X-Hub-Signature-256", "")
    body = await request.body()

    expected = "sha256=" + hmac.new(
        settings.meta_app_secret.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(403, "Invalid signature")

    payload = await request.json()

    for entry in payload.get("entry", []):
        ig_id = entry.get("id")
        for change in entry.get("changes", []):
            background_tasks.add_task(process_webhook_event, change, ig_id)
        for messaging in entry.get("messaging", []):
            background_tasks.add_task(
                process_webhook_event,
                {"field": "messages", "value": messaging},
                ig_id,
            )

    return {"status": "ok"}
