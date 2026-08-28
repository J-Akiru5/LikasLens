"""
GET /api/v1/public/tickets      — Public incident feed (no auth required)
GET /api/v1/public/tickets/{id} — Public incident detail

NEVER return reporter identity in these endpoints.
Ghost mode and non-ghost tickets are treated identically — no reporter info exposed.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from db.connection import get_db
from db.models import Ticket

router = APIRouter(prefix="/api/v1/public", tags=["public"])


def _safe_ticket(ticket: Ticket) -> dict:
    """Serialize ticket with NO identity fields — safe for public consumption."""
    return {
        "id": str(ticket.id),
        "display_id": f"INC-{str(ticket.id)[:6].upper()}",
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "latitude": (
            round(ticket.latitude, 2) if ticket.location_fuzzed and ticket.latitude
            else ticket.latitude
        ),
        "longitude": (
            round(ticket.longitude, 2) if ticket.location_fuzzed and ticket.longitude
            else ticket.longitude
        ),
        "location_fuzzed": ticket.location_fuzzed,
        "address_text": ticket.address_text,
        "category": ticket.ai_triage_summary,
        "ai_confidence": ticket.ai_confidence,
        "recommended_office": ticket.ai_recommended_office,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        # NEVER include: reporter_user_id, reporter_email, reporter_phone, ghost_mode flag
    }


@router.get("/tickets")
async def public_tickets(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=50),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Public incident feed — no auth required."""
    q = select(Ticket).order_by(Ticket.created_at.desc())
    if status:
        q = q.where(Ticket.status == status)

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar()

    q = q.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(q)
    tickets = result.scalars().all()

    return {
        "success": True,
        "data": [_safe_ticket(t) for t in tickets],
        "meta": {"total": total, "page": page, "per_page": per_page},
    }


@router.get("/tickets/{ticket_id}")
async def public_ticket_detail(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Public incident detail — no auth required, no identity exposed."""
    result = await db.execute(select(Ticket).where(Ticket.id == uuid.UUID(ticket_id)))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True, "data": _safe_ticket(ticket)}
