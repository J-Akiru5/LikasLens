"""
Admin router — super_admin-only user and role management.
All endpoints require a valid Supabase JWT with role=super_admin.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from auth.supabase_jwt import require_super_admin
from db.connection import get_db
from db.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

VALID_ROLES = {"citizen", "lgu_officer", "admin", "super_admin", "analyst"}


# ── Request schemas ────────────────────────────────────────────────────────


class UpdateUserRequest(BaseModel):
    name: str | None = None
    email: str | None = None


class UpdateRoleRequest(BaseModel):
    role: str


class BulkRoleRequest(BaseModel):
    ids: list[str]
    role: str


# ── PUT /api/v1/admin/users/{id} — update user profile ────────────────────


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UpdateUserRequest,
    token: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.name is not None:
        user.name = body.name
    if body.email is not None:
        user.email = body.email

    await db.commit()
    await db.refresh(user)

    logger.info(
        "Admin %s updated user %s",
        token.get("sub"),
        user_id,
    )

    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


# ── PUT /api/v1/admin/users/{id}/role — update user role ──────────────────


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    body: UpdateRoleRequest,
    token: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{body.role}'. Allowed: {sorted(VALID_ROLES)}",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role
    user.role = body.role
    await db.commit()
    await db.refresh(user)

    logger.info(
        "Admin %s changed user %s role: %s → %s",
        token.get("sub"),
        user_id,
        old_role,
        body.role,
    )

    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


# ── POST /api/v1/admin/users/bulk-role — bulk role update ──────────────────


@router.post("/users/bulk-role")
async def bulk_update_role(
    body: BulkRoleRequest,
    token: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{body.role}'. Allowed: {sorted(VALID_ROLES)}",
        )

    if not body.ids:
        return {"success": True, "data": {"updated": 0, "skipped": []}}

    result = await db.execute(select(User).where(User.id.in_(body.ids)))
    users = result.scalars().all()

    updated = 0
    skipped = []
    for user in users:
        if user.role != body.role:
            user.role = body.role
            updated += 1
        else:
            skipped.append(str(user.id))

    await db.commit()

    logger.info(
        "Admin %s bulk role update: %d users → %s",
        token.get("sub"),
        updated,
        body.role,
    )

    return {
        "success": True,
        "data": {
            "updated": updated,
            "skipped": skipped,
        },
    }
