from __future__ import annotations
import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from ..auth import get_current_user_id
from ..database import db
from ..schemas.contact import ContactUpdate, ContactResponse

router = APIRouter()


@router.get("")
async def list_contacts(
    account_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
):
    where: dict = {"account": {"userId": user_id}}
    if account_id:
        where["accountId"] = account_id
    if tag:
        where["tags"] = {"has": tag}
    if search:
        where["OR"] = [
            {"username": {"contains": search, "mode": "insensitive"}},
            {"fullName": {"contains": search, "mode": "insensitive"}},
        ]

    contacts = await db.contact.find_many(
        where=where,
        order={"lastContact": "desc"},
        take=limit,
        skip=offset,
    )
    total = await db.contact.count(where=where)
    return {"items": contacts, "total": total}


@router.get("/{contact_id}")
async def get_contact(contact_id: str, user_id: str = Depends(get_current_user_id)):
    contact = await db.contact.find_first(
        where={"id": contact_id, "account": {"userId": user_id}}
    )
    if not contact:
        raise HTTPException(404, "Contact not found")
    return contact


@router.patch("/{contact_id}")
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    user_id: str = Depends(get_current_user_id),
):
    contact = await db.contact.find_first(
        where={"id": contact_id, "account": {"userId": user_id}}
    )
    if not contact:
        raise HTTPException(404, "Contact not found")

    updated = await db.contact.update(
        where={"id": contact_id},
        data=body.model_dump(exclude_unset=True),
    )
    return updated


@router.get("/export/csv")
async def export_csv(
    account_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
):
    where: dict = {"account": {"userId": user_id}}
    if account_id:
        where["accountId"] = account_id

    contacts = await db.contact.find_many(where=where, order={"lastContact": "desc"})

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Username", "Full Name", "Tags", "DM Count", "First Contact", "Last Contact", "Notes"])
    for c in contacts:
        writer.writerow([
            c.username,
            c.fullName or "",
            ", ".join(c.tags),
            c.dmCount,
            c.firstContact.isoformat(),
            c.lastContact.isoformat(),
            c.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"},
    )
