from __future__ import annotations

from datetime import datetime, timedelta, timezone

from prisma import Json

from .database import db

DEMO_USER_EMAIL = "demo@instachat.local"
DEMO_ACCOUNT_IG_USER_ID = "17841400000000001"
DEMO_AUTOMATION_WELCOME_ID = "demo-auto-welcome"
DEMO_AUTOMATION_COMMENT_ID = "demo-auto-comment"
DEMO_CONTACT_1_IG_USER_ID = "900000000000001"
DEMO_CONTACT_2_IG_USER_ID = "900000000000002"
DEMO_CONTACT_3_IG_USER_ID = "900000000000003"
DEMO_LOG_1_ID = "demo-log-1"
DEMO_LOG_2_ID = "demo-log-2"
DEMO_LOG_3_ID = "demo-log-3"


async def ensure_automation(automation_id: str, data: dict):
    existing = await db.automation.find_unique(where={"id": automation_id})
    if existing:
        return await db.automation.update(where={"id": automation_id}, data=data)
    create_data = data.copy()
    account_id = create_data.pop("accountId")
    return await db.automation.create(
        data={
            "id": automation_id,
            **create_data,
            "account": {"connect": {"id": account_id}},
        }
    )


async def ensure_demo_data():
    now = datetime.now(timezone.utc)

    user = await db.user.upsert(
        where={"email": DEMO_USER_EMAIL},
        data={
            "create": {
                "email": DEMO_USER_EMAIL,
                "name": "Demo User",
            },
            "update": {
                "name": "Demo User",
            },
        },
    )

    account = await db.instagramaccount.upsert(
        where={"igUserId": DEMO_ACCOUNT_IG_USER_ID},
        data={
            "create": {
                "userId": user.id,
                "igUserId": DEMO_ACCOUNT_IG_USER_ID,
                "username": "instachat_demo",
                "profilePic": "https://placehold.co/96x96/1d4ed8/ffffff?text=IG",
                "accessToken": "demo-access-token",
                "tokenExpiry": now + timedelta(days=45),
                "followersCount": 12840,
                "webhookActive": True,
            },
            "update": {
                "userId": user.id,
                "username": "instachat_demo",
                "profilePic": "https://placehold.co/96x96/1d4ed8/ffffff?text=IG",
                "tokenExpiry": now + timedelta(days=45),
                "followersCount": 12840,
                "webhookActive": True,
            },
        },
    )

    welcome_automation = await ensure_automation(
        DEMO_AUTOMATION_WELCOME_ID,
        {
            "accountId": account.id,
            "name": "Welcome DM Funnel",
            "isActive": True,
            "triggerType": "dm",
            "keywords": ["narx", "kurs", "price"],
            "exactMatch": False,
            "checkFollow": False,
            "welcomeMsg": "Salom! Kurs va narxlar bo'yicha ma'lumotni yubordim.",
            "noFollowMsg": None,
            "afterFollowMsg": None,
            "reminderMsg": "Savolingiz bo'lsa, bemalol yozing.",
            "reminderDelay": 30,
            "extraMsg": "Demo havola: https://instachat-demo.local/offer",
            "extraDelay": 180,
            "buttons": Json([
                {"label": "Taklifni ko'rish", "url": "https://instachat-demo.local/offer"},
                {"label": "Menejer bilan gaplashish", "url": "https://instachat-demo.local/contact"},
            ]),
            "commentReplies": [],
        },
    )

    comment_automation = await ensure_automation(
        DEMO_AUTOMATION_COMMENT_ID,
        {
            "accountId": account.id,
            "name": "Comment Reply Booster",
            "isActive": True,
            "triggerType": "comment",
            "keywords": ["link", "info", "start"],
            "exactMatch": False,
            "checkFollow": True,
            "welcomeMsg": "Linkni DM orqali yubordik.",
            "noFollowMsg": "Avval akkauntga obuna bo'ling, keyin linkni yuboramiz.",
            "afterFollowMsg": "Rahmat! Mana siz so'ragan link.",
            "reminderMsg": None,
            "reminderDelay": None,
            "extraMsg": None,
            "extraDelay": None,
            "buttons": Json([]),
            "commentReplies": ["DMga yubordik", "Link xabarda"],
        },
    )

    await db.automationstats.upsert(
        where={"automationId": welcome_automation.id},
        data={
            "create": {
                "automationId": welcome_automation.id,
                "triggered": 148,
                "dmsSent": 124,
                "linksClicked": 39,
            },
            "update": {
                "triggered": 148,
                "dmsSent": 124,
                "linksClicked": 39,
            },
        },
    )

    await db.automationstats.upsert(
        where={"automationId": comment_automation.id},
        data={
            "create": {
                "automationId": comment_automation.id,
                "triggered": 92,
                "dmsSent": 71,
                "linksClicked": 18,
            },
            "update": {
                "triggered": 92,
                "dmsSent": 71,
                "linksClicked": 18,
            },
        },
    )

    await db.contact.upsert(
        where={
            "accountId_igUserId": {
                "accountId": account.id,
                "igUserId": DEMO_CONTACT_1_IG_USER_ID,
            }
        },
        data={
            "create": {
                "accountId": account.id,
                "igUserId": DEMO_CONTACT_1_IG_USER_ID,
                "username": "aziza_marketing",
                "fullName": "Aziza Karimova",
                "profilePic": "https://placehold.co/64x64/f59e0b/ffffff?text=A",
                "tags": ["lead", "vip"],
                "notes": "Narx va onboarding haqida so'ragan.",
                "followsUs": True,
                "firstContact": now - timedelta(days=9),
                "lastContact": now - timedelta(hours=3),
                "dmCount": 6,
            },
            "update": {
                "username": "aziza_marketing",
                "fullName": "Aziza Karimova",
                "profilePic": "https://placehold.co/64x64/f59e0b/ffffff?text=A",
                "tags": ["lead", "vip"],
                "notes": "Narx va onboarding haqida so'ragan.",
                "followsUs": True,
                "firstContact": now - timedelta(days=9),
                "lastContact": now - timedelta(hours=3),
                "dmCount": 6,
            },
        },
    )

    await db.contact.upsert(
        where={
            "accountId_igUserId": {
                "accountId": account.id,
                "igUserId": DEMO_CONTACT_2_IG_USER_ID,
            }
        },
        data={
            "create": {
                "accountId": account.id,
                "igUserId": DEMO_CONTACT_2_IG_USER_ID,
                "username": "jamshid_store",
                "fullName": "Jamshid Akramov",
                "profilePic": "https://placehold.co/64x64/10b981/ffffff?text=J",
                "tags": ["client"],
                "notes": "Demo call so'ragan.",
                "followsUs": True,
                "firstContact": now - timedelta(days=6),
                "lastContact": now - timedelta(days=1, hours=2),
                "dmCount": 4,
            },
            "update": {
                "username": "jamshid_store",
                "fullName": "Jamshid Akramov",
                "profilePic": "https://placehold.co/64x64/10b981/ffffff?text=J",
                "tags": ["client"],
                "notes": "Demo call so'ragan.",
                "followsUs": True,
                "firstContact": now - timedelta(days=6),
                "lastContact": now - timedelta(days=1, hours=2),
                "dmCount": 4,
            },
        },
    )

    await db.contact.upsert(
        where={
            "accountId_igUserId": {
                "accountId": account.id,
                "igUserId": DEMO_CONTACT_3_IG_USER_ID,
            }
        },
        data={
            "create": {
                "accountId": account.id,
                "igUserId": DEMO_CONTACT_3_IG_USER_ID,
                "username": "nilufar_beauty",
                "fullName": "Nilufar Saidova",
                "profilePic": "https://placehold.co/64x64/ec4899/ffffff?text=N",
                "tags": ["lead"],
                "notes": "Linkni ochmagan, qayta follow-up kerak.",
                "followsUs": False,
                "firstContact": now - timedelta(days=2),
                "lastContact": now - timedelta(hours=10),
                "dmCount": 2,
            },
            "update": {
                "username": "nilufar_beauty",
                "fullName": "Nilufar Saidova",
                "profilePic": "https://placehold.co/64x64/ec4899/ffffff?text=N",
                "tags": ["lead"],
                "notes": "Linkni ochmagan, qayta follow-up kerak.",
                "followsUs": False,
                "firstContact": now - timedelta(days=2),
                "lastContact": now - timedelta(hours=10),
                "dmCount": 2,
            },
        },
    )

    await db.automationlog.upsert(
        where={"id": DEMO_LOG_1_ID},
        data={
            "create": {
                "id": DEMO_LOG_1_ID,
                "automationId": welcome_automation.id,
                "contactIgId": DEMO_CONTACT_1_IG_USER_ID,
                "contactName": "Aziza Karimova",
                "triggerType": "dm",
                "triggerText": "Kurs narxi qancha?",
                "dmSent": True,
                "error": None,
                "createdAt": now - timedelta(hours=3),
            },
            "update": {
                "automationId": welcome_automation.id,
                "contactIgId": DEMO_CONTACT_1_IG_USER_ID,
                "contactName": "Aziza Karimova",
                "triggerType": "dm",
                "triggerText": "Kurs narxi qancha?",
                "dmSent": True,
                "error": None,
                "createdAt": now - timedelta(hours=3),
            },
        },
    )

    await db.automationlog.upsert(
        where={"id": DEMO_LOG_2_ID},
        data={
            "create": {
                "id": DEMO_LOG_2_ID,
                "automationId": comment_automation.id,
                "contactIgId": DEMO_CONTACT_2_IG_USER_ID,
                "contactName": "Jamshid Akramov",
                "triggerType": "comment",
                "triggerText": "Link bormi?",
                "dmSent": True,
                "error": None,
                "createdAt": now - timedelta(days=1, hours=2),
            },
            "update": {
                "automationId": comment_automation.id,
                "contactIgId": DEMO_CONTACT_2_IG_USER_ID,
                "contactName": "Jamshid Akramov",
                "triggerType": "comment",
                "triggerText": "Link bormi?",
                "dmSent": True,
                "error": None,
                "createdAt": now - timedelta(days=1, hours=2),
            },
        },
    )

    await db.automationlog.upsert(
        where={"id": DEMO_LOG_3_ID},
        data={
            "create": {
                "id": DEMO_LOG_3_ID,
                "automationId": comment_automation.id,
                "contactIgId": DEMO_CONTACT_3_IG_USER_ID,
                "contactName": "Nilufar Saidova",
                "triggerType": "comment",
                "triggerText": "Info yuboring",
                "dmSent": False,
                "error": "Foydalanuvchi hali obuna bo'lmagan.",
                "createdAt": now - timedelta(hours=10),
            },
            "update": {
                "automationId": comment_automation.id,
                "contactIgId": DEMO_CONTACT_3_IG_USER_ID,
                "contactName": "Nilufar Saidova",
                "triggerType": "comment",
                "triggerText": "Info yuboring",
                "dmSent": False,
                "error": "Foydalanuvchi hali obuna bo'lmagan.",
                "createdAt": now - timedelta(hours=10),
            },
        },
    )

    return user
