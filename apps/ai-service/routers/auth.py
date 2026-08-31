"""
Auth router — POST /api/v1/auth/sync
Thin wrapper: actual auth (sign-up/sign-in) happens in Supabase.
This endpoint syncs user records into our DB after Supabase auth.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.connection import get_db
from db.models import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class SyncRequest(BaseModel):
    supabase_auth_user_id: str
    email: str
    name: str | None = None
    role: str = "citizen"


@router.post("/sync")
async def sync_user(body: SyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Called by the frontend after Supabase sign-up/sign-in to sync the user record
    into our DB. Idempotent — safe to call on every login.
    """
    # Cast to UUID — the DB column is UUID, not varchar
    try:
        auth_uuid = uuid.UUID(body.supabase_auth_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid supabase_auth_user_id format")

    result = await db.execute(
        select(User).where(User.supabase_auth_user_id == auth_uuid)
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            supabase_auth_user_id=auth_uuid,
            name=body.name or "Citizen",
            email=body.email,
            role=body.role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }
