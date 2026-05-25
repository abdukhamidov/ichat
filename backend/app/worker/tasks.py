from __future__ import annotations
import asyncio
from typing import Optional
from celery import Celery
from ..config import get_settings

settings = get_settings()
celery_app = Celery("instachat", broker=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_default_rate_limit="200/h",
)


@celery_app.task(bind=True, max_retries=3)
def send_delayed_dm(self, recipient_id: str, message: str, buttons: Optional[list], access_token: str):
    from ..services.automation import send_dm

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(send_dm(recipient_id, message, buttons, access_token))
        if "error" in result:
            raise Exception(result["error"].get("message", "Unknown error"))
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
    finally:
        loop.close()


@celery_app.task
def refresh_token(account_id: str):
    from ..database import db
    import httpx

    loop = asyncio.new_event_loop()
    try:
        async def _refresh():
            await db.connect()
            account = await db.instagramaccount.find_unique(where={"id": account_id})
            if not account:
                return

            async with httpx.AsyncClient() as client:
                # Try the newer Instagram long-lived token refresh first, then
                # fall back to the older Facebook token exchange flow.
                res = await client.get(
                    "https://graph.instagram.com/refresh_access_token",
                    params={
                        "grant_type": "ig_refresh_token",
                        "access_token": account.accessToken,
                    },
                )
                data = res.json()
                if "access_token" not in data:
                    res = await client.get(
                        "https://graph.facebook.com/v21.0/oauth/access_token",
                        params={
                            "grant_type": "fb_exchange_token",
                            "client_id": settings.meta_app_id,
                            "client_secret": settings.meta_app_secret,
                            "fb_exchange_token": account.accessToken,
                        },
                    )
                    data = res.json()
                if "access_token" in data:
                    from datetime import datetime, timedelta, timezone

                    expires_in = data.get("expires_in", 5184000)
                    await db.instagramaccount.update(
                        where={"id": account_id},
                        data={
                            "accessToken": data["access_token"],
                            "tokenExpiry": datetime.now(timezone.utc)
                            + timedelta(seconds=expires_in),
                        },
                    )
            await db.disconnect()

        loop.run_until_complete(_refresh())
    finally:
        loop.close()
