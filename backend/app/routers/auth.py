from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
import httpx
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from ..config import get_settings
from ..database import db
from ..auth import create_jwt, get_current_user_id
from ..demo import ensure_demo_data

router = APIRouter()

FACEBOOK_LOGIN_MODE = "facebook"
INSTAGRAM_LOGIN_MODE = "instagram"
FACEBOOK_API_VERSION = "v21.0"
INSTAGRAM_API_VERSION = "v25.0"

FACEBOOK_SCOPES = (
    "instagram_basic,"
    "instagram_manage_messages,"
    "instagram_manage_comments,"
    "pages_show_list,"
    "pages_read_engagement,"
    "pages_read_user_content"
)

INSTAGRAM_SCOPES = (
    "instagram_business_basic,"
    "instagram_business_manage_messages,"
    "instagram_business_manage_comments"
)


def resolve_login_mode(requested_mode: Optional[str], default_mode: str) -> str:
    mode = (requested_mode or default_mode or INSTAGRAM_LOGIN_MODE).strip().lower()
    if mode == FACEBOOK_LOGIN_MODE:
        return FACEBOOK_LOGIN_MODE
    return INSTAGRAM_LOGIN_MODE


def build_auth_url(settings, mode: str) -> str:
    if mode == FACEBOOK_LOGIN_MODE:
        params = urlencode(
            {
                "client_id": settings.meta_app_id,
                "redirect_uri": settings.redirect_uri,
                "scope": FACEBOOK_SCOPES,
                "response_type": "code",
                "state": FACEBOOK_LOGIN_MODE,
            }
        )
        return f"https://www.facebook.com/{FACEBOOK_API_VERSION}/dialog/oauth?{params}"

    params = urlencode(
        {
            "client_id": settings.meta_app_id,
            "redirect_uri": settings.redirect_uri,
            "scope": INSTAGRAM_SCOPES,
            "response_type": "code",
            "state": INSTAGRAM_LOGIN_MODE,
        }
    )
    return f"https://www.instagram.com/oauth/authorize?{params}"


def meta_error(prefix: str, res: httpx.Response) -> HTTPException:
    detail = res.text.strip() or res.reason_phrase
    return HTTPException(res.status_code if res.status_code >= 400 else 502, f"{prefix}: {detail[:500]}")


async def upsert_user(email: str, name: Optional[str]):
    return await db.user.upsert(
        where={"email": email},
        data={
            "create": {"email": email, "name": name},
            "update": {"name": name},
        },
    )


async def upsert_instagram_account(
    *,
    user_id: str,
    ig_user_id: str,
    username: str,
    access_token: str,
    expires_in: int,
    profile_pic: Optional[str] = None,
    followers_count: int = 0,
):
    expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    await db.instagramaccount.upsert(
        where={"igUserId": ig_user_id},
        data={
            "create": {
                "userId": user_id,
                "igUserId": ig_user_id,
                "username": username,
                "profilePic": profile_pic,
                "followersCount": followers_count,
                "accessToken": access_token,
                "tokenExpiry": expiry,
            },
            "update": {
                "accessToken": access_token,
                "tokenExpiry": expiry,
                "username": username,
                "profilePic": profile_pic,
                "followersCount": followers_count,
            },
        },
    )


async def complete_instagram_login(code: str):
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": settings.redirect_uri,
                "code": code,
            },
        )
        if token_res.status_code != 200:
            raise meta_error("Failed to get Instagram access token", token_res)
        short_data = token_res.json()
        short_token = short_data["access_token"]

        ll_res = await client.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.meta_app_secret,
                "access_token": short_token,
            },
        )
        if ll_res.status_code != 200:
            raise meta_error("Failed to exchange Instagram token", ll_res)
        ll_data = ll_res.json()
        long_token = ll_data["access_token"]
        expires_in = ll_data.get("expires_in", 5184000)

        profile_res = await client.get(
            f"https://graph.instagram.com/{INSTAGRAM_API_VERSION}/me",
            params={
                "fields": "user_id,username,profile_picture_url,followers_count",
                "access_token": long_token,
            },
        )
        if profile_res.status_code != 200:
            raise meta_error("Failed to load Instagram profile", profile_res)

        profile_data = profile_res.json()
        if isinstance(profile_data.get("data"), list):
            profile = profile_data["data"][0]
        else:
            profile = profile_data

        ig_user_id = str(profile["user_id"])
        username = profile.get("username", ig_user_id)
        synthetic_email = f"instagram-{ig_user_id}@instagram.local"
        user = await upsert_user(synthetic_email, username)

        await upsert_instagram_account(
            user_id=user.id,
            ig_user_id=ig_user_id,
            username=username,
            access_token=long_token,
            expires_in=expires_in,
            profile_pic=profile.get("profile_picture_url"),
            followers_count=profile.get("followers_count", 0) or 0,
        )

    return user, [username]


async def complete_facebook_login(code: str):
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        token_res = await client.get(
            f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/oauth/access_token",
            params={
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "redirect_uri": settings.redirect_uri,
                "code": code,
            },
        )
        if token_res.status_code != 200:
            raise meta_error("Failed to get Facebook access token", token_res)
        short_token = token_res.json()["access_token"]

        ll_res = await client.get(
            f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "fb_exchange_token": short_token,
            },
        )
        if ll_res.status_code != 200:
            raise meta_error("Failed to exchange Facebook token", ll_res)
        ll_data = ll_res.json()
        long_token = ll_data["access_token"]
        expires_in = ll_data.get("expires_in", 5184000)

        me_res = await client.get(
            f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/me",
            params={"access_token": long_token, "fields": "id,email,name"},
        )
        if me_res.status_code != 200:
            raise meta_error("Failed to load Facebook profile", me_res)

        me_data = me_res.json()
        email = me_data.get("email", f"{me_data['id']}@facebook.com")
        name = me_data.get("name")
        user = await upsert_user(email, name)

        pages_res = await client.get(
            f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/me/accounts",
            params={
                "access_token": long_token,
                "fields": "id,name,instagram_business_account",
            },
        )
        if pages_res.status_code != 200:
            raise meta_error("Failed to load Facebook pages", pages_res)

        pages = pages_res.json().get("data", [])
        connected: List[str] = []

        for page in pages:
            ig = page.get("instagram_business_account")
            if not ig:
                continue

            ig_res = await client.get(
                f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/{ig['id']}",
                params={
                    "fields": "id,username,profile_picture_url,followers_count",
                    "access_token": long_token,
                },
            )
            if ig_res.status_code != 200:
                continue

            ig_data = ig_res.json()
            if "id" not in ig_data:
                continue

            username = ig_data.get("username", ig_data["id"])
            await upsert_instagram_account(
                user_id=user.id,
                ig_user_id=ig_data["id"],
                username=username,
                access_token=long_token,
                expires_in=expires_in,
                profile_pic=ig_data.get("profile_picture_url"),
                followers_count=ig_data.get("followers_count", 0) or 0,
            )
            connected.append(username)

    return user, connected


def resolve_post_login_redirect(next_url: Optional[str], frontend_url: str) -> str:
    default_url = f"{frontend_url}/accounts"
    if not next_url:
        return default_url
    if next_url.startswith(frontend_url):
        return next_url
    return default_url


@router.get("/instagram/connect")
async def connect_instagram(mode: Optional[str] = Query(None)):
    settings = get_settings()
    login_mode = resolve_login_mode(mode, settings.meta_login_mode)
    return {"auth_url": build_auth_url(settings, login_mode)}


@router.get("/demo-login")
async def demo_login(next: Optional[str] = Query(None)):
    settings = get_settings()
    if not settings.demo_mode:
        raise HTTPException(404, "Demo mode disabled")

    user = await ensure_demo_data()
    jwt_token = create_jwt(user.id)
    redirect = RedirectResponse(
        url=resolve_post_login_redirect(next, settings.frontend_url),
        status_code=302,
    )
    redirect.set_cookie(
        key="token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=settings.jwt_expiry_hours * 3600,
    )
    return redirect


@router.get("/callback")
async def oauth_callback(code: str, state: Optional[str] = None):
    settings = get_settings()
    login_mode = resolve_login_mode(state, settings.meta_login_mode)

    if login_mode == FACEBOOK_LOGIN_MODE:
        user, connected = await complete_facebook_login(code)
    else:
        user, connected = await complete_instagram_login(code)

    jwt_token = create_jwt(user.id)
    redirect = RedirectResponse(
        url=f"{settings.frontend_url}/accounts?connected={'&'.join(connected)}",
        status_code=302,
    )
    redirect.set_cookie(
        key="token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=settings.jwt_expiry_hours * 3600,
    )
    return redirect


@router.get("/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    return {"id": user.id, "email": user.email, "name": user.name}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"ok": True}
