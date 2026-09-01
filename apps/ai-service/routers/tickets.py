"""
GET   /api/v1/tickets              — LGU: list all tickets
GET   /api/v1/tickets/{id}         — LGU: ticket detail
GET   /api/v1/tickets/{id}/timeline — Citizen-safe status history
PATCH /api/v1/tickets/{id}/status   — LGU: update status (with optional urgency_score)
POST  /api/v1/tickets/bulk-status   — LGU: bulk status update with per-ticket validation
GET   /api/v1/tickets/{id}/explain  — AI routing explanation
"""

import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from auth.supabase_jwt import require_lgu_role, verify_supabase_token
from db.connection import get_db
from db.models import ALLOWED_TRANSITIONS, Ticket, TicketEvidence, TicketTimeline, User
from services.ghost_mode import get_reporter_display, sanitize_for_public

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])
logger = logging.getLogger(__name__)


def _require_super_admin(token: dict) -> None:
    """Verified is the super admin's final sign-off."""
    role = token.get("user_metadata", {}).get("role", "citizen")
    if role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only the super admin can mark a ticket as verified",
        )


async def _resolution_evidence_exists(db: AsyncSession, ticket_id):
    """Resolution ('after') photos live under storage_path resolution/..."""
    result = await db.execute(
        select(TicketEvidence.id)
        .where(
            TicketEvidence.ticket_id == ticket_id,
            TicketEvidence.storage_path.like("resolution/%"),
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


def _ticket_to_dict(ticket: Ticket, include_reporter: bool = False) -> dict:
    """Serialize a ticket to a dict, optionally including reporter display name."""
    d = {
        "id": str(ticket.id),
        "display_id": f"INC-{str(ticket.id)[:6].upper()}",
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "ghost_mode": ticket.ghost_mode,
        "latitude": ticket.latitude,
        "longitude": ticket.longitude,
        "location_fuzzed": ticket.location_fuzzed,
        "address_text": ticket.address_text,
        "ai_triage_summary": ticket.ai_triage_summary,
        "ai_confidence": ticket.ai_confidence,
        "ai_recommended_office": ticket.ai_recommended_office,
        "routing_source": ticket.routing_source,
        "urgency_score": ticket.urgency_score,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
    }
    if include_reporter:
        d["reporter"] = get_reporter_display(
            ticket.ghost_mode,
            ticket.reporter.name if ticket.reporter else None,
        )
    return d


@router.get("")
async def list_tickets(
    search: str | None = Query(None),
    status: str | None = Query(None),
    per_page: int = Query(20, le=50),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_lgu_role),
):
    """List all tickets — LGU only."""
    q = select(Ticket).options(selectinload(Ticket.reporter)).order_by(Ticket.created_at.desc())
    if search:
        q = q.where(
            Ticket.title.ilike(f"%{search}%")
            | Ticket.description.ilike(f"%{search}%")
        )
    if status:
        q = q.where(Ticket.status == status)

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar()

    q = q.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(q)
    tickets = result.scalars().all()

    return {
        "success": True,
        "data": [_ticket_to_dict(t, include_reporter=True) for t in tickets],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "last_page": max(1, -(-total // per_page)),
        },
    }


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_lgu_role),
):
    """Get a single ticket by ID — LGU only."""
    result = await db.execute(select(Ticket).options(selectinload(Ticket.reporter)).where(Ticket.id == uuid.UUID(ticket_id)))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True, "data": _ticket_to_dict(ticket, include_reporter=True)}


@router.get("/{ticket_id}/timeline")
async def get_timeline(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Citizen-safe: returns status progression without exposing LGU officer identity."""
    result = await db.execute(select(Ticket).where(Ticket.id == uuid.UUID(ticket_id)))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    tl_result = await db.execute(
        select(TicketTimeline)
        .where(TicketTimeline.ticket_id == uuid.UUID(ticket_id))
        .order_by(TicketTimeline.created_at.asc())
    )
    entries = tl_result.scalars().all()

    STATUS_LABELS = {
        "open": "Report submitted",
        "investigating": "Under investigation",
        "monitoring": "Being monitored",
        "resolved": "Action taken",
        "verified": "Verified by LGU",
        "closed": "Closed",
    }

    return {
        "success": True,
        "data": {
            "ticket_id": ticket_id,
            "display_id": f"INC-{str(ticket_id)[:6].upper()}",
            "status": ticket.status,
            "timeline": [
                {
                    "action": STATUS_LABELS.get(e.to_status, e.to_status),
                    "from_status": e.from_status,
                    "to_status": e.to_status,
                    "note": e.note if e.actor_type != "ghost" else None,
                    "timestamp": e.created_at.isoformat(),
                    "visible": True,
                }
                for e in entries
            ],
        },
    }


class StatusUpdateRequest(BaseModel):
    status: str
    notes: str | None = None
    urgency_score: float | None = None


class BulkStatusRequest(BaseModel):
    ticket_ids: list[str]
    status: str
    notes: str | None = None


@router.patch("/{ticket_id}/status")
async def update_status(
    ticket_id: str,
    body: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_lgu_role),
):
    """Update ticket status with transition validation — LGU only."""
    result = await db.execute(select(Ticket).where(Ticket.id == uuid.UUID(ticket_id)))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    allowed = ALLOWED_TRANSITIONS.get(old_status, [])

    if body.status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition from '{old_status}' to '{body.status}'. Allowed: {allowed}",
        )

    # Verified = super admin sign-off, backed by resolution evidence
    if body.status == "verified":
        _require_super_admin(token)
        if not await _resolution_evidence_exists(db, ticket.id):
            raise HTTPException(
                status_code=422,
                detail="Resolution evidence required before verifying - upload an 'after' photo first",
            )

    ticket.status = body.status
    if body.status in ("resolved", "closed"):
        ticket.resolved_at = datetime.now(timezone.utc)
    if body.urgency_score is not None:
        ticket.urgency_score = body.urgency_score

    # Timeline entry — look up the app user by Supabase auth UUID
    actor_id = None
    auth_sub = token.get("sub")
    if auth_sub:
        try:
            auth_uuid = uuid.UUID(auth_sub)
            user_result = await db.execute(
                select(User).where(User.supabase_auth_user_id == auth_uuid)
            )
            app_user = user_result.scalar_one_or_none()
            if app_user:
                actor_id = app_user.id
        except (ValueError, AttributeError):
            pass  # malformed UUID or missing — leave actor_id as None

    timeline_entry = TicketTimeline(
        id=uuid.uuid4(),
        ticket_id=uuid.UUID(ticket_id),
        actor_type="lgu",
        actor_id=actor_id,
        from_status=old_status,
        to_status=body.status,
        note=body.notes,
    )
    db.add(timeline_entry)
    await db.commit()

    # Notify routing learner when resolved
    if body.status == "resolved" and ticket.created_at:
        await _notify_routing_learner(ticket)

    return {
        "success": True,
        "data": {"id": ticket_id, "old_status": old_status, "new_status": body.status},
    }



@router.post("/bulk-status")
async def bulk_status(
    body: BulkStatusRequest,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_lgu_role),
):
    """
    Bulk-update ticket statuses with per-ticket transition validation.

    Validates each ticket independently against ALLOWED_TRANSITIONS.
    If ANY ticket has an invalid transition, the entire batch is rejected
    (no partial application). Each valid transition writes a TicketTimeline
    entry for audit trail.
    """
    if not body.ticket_ids:
        raise HTTPException(status_code=422, detail="ticket_ids cannot be empty")

    # Fetch all tickets in one query
    uuids = [uuid.UUID(tid) for tid in body.ticket_ids]
    result = await db.execute(select(Ticket).where(Ticket.id.in_(uuids)))
    tickets = result.scalars().all()

    # Build lookup map
    ticket_map = {str(t.id): t for t in tickets}

    # Verified = super admin sign-off, backed by resolution evidence
    if body.status == "verified":
        _require_super_admin(token)

    # Validate ALL transitions before writing any
    errors: list[dict] = []
    for tid in body.ticket_ids:
        ticket = ticket_map.get(tid)
        if not ticket:
            errors.append({"ticket_id": tid, "error": "Ticket not found"})
            continue
        allowed = ALLOWED_TRANSITIONS.get(ticket.status, [])
        if body.status not in allowed:
            errors.append(
                {
                    "ticket_id": tid,
                    "error": f"Cannot transition from '{ticket.status}' to '{body.status}'. Allowed: {allowed}",
                }
            )
            continue
        if body.status == "verified" and not await _resolution_evidence_exists(db, ticket.id):
            errors.append(
                {
                    "ticket_id": tid,
                    "error": "Resolution evidence required before verifying - upload an 'after' photo first",
                }
            )

    if errors:
        raise HTTPException(
            status_code=422,
            detail=f"Batch rejected: {len(errors)} ticket(s) have invalid transitions",
            headers={"X-Bulk-Errors": str(errors)},
        )

    # Resolve actor ID from auth token
    actor_id = None
    auth_sub = token.get("sub")
    if auth_sub:
        try:
            auth_uuid = uuid.UUID(auth_sub)
            user_result = await db.execute(
                select(User).where(User.supabase_auth_user_id == auth_uuid)
            )
            app_user = user_result.scalar_one_or_none()
            if app_user:
                actor_id = app_user.id
        except (ValueError, AttributeError):
            pass

    # Apply transitions + timeline entries
    updated_ids: list[str] = []
    for tid in body.ticket_ids:
        ticket = ticket_map[tid]
        old_status = ticket.status
        ticket.status = body.status
        if body.status in ("resolved", "closed"):
            ticket.resolved_at = datetime.now(timezone.utc)

        timeline_entry = TicketTimeline(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            actor_type="lgu",
            actor_id=actor_id,
            from_status=old_status,
            to_status=body.status,
            note=body.notes,
        )
        db.add(timeline_entry)
        updated_ids.append(tid)

    await db.commit()

    return {
        "success": True,
        "data": {
            "updated": len(updated_ids),
            "failed": [],
            "ids": updated_ids,
        },
    }


async def _notify_routing_learner(ticket: Ticket):
    """Port of TicketController::notifyRoutingLearner — updates Neo4j scoring table.

    DISABLED: The Ticket model has no LGU foreign key (no agency_id, no
    lgu_id column). The previous implementation passed str(ticket.id) as
    lgu_id, which corrupted the learner's scoring table with a unique
    fake LGU on every resolution. Re-enable once a real LGU identifier
    is available on the ticket (e.g. from ticket_assignments or a future
    agency_id column).
    """
    logger.info(
        "Routing learner notification skipped for ticket %s — no LGU ID available",
        ticket.id,
    )


@router.get("/{ticket_id}/explain")
async def explain_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Explain mode (Althena-inspired): surface the rule chain that fired for a ticket.
    Returns the graph traversal the AI service used to route this ticket.
    """
    result = await db.execute(select(Ticket).where(Ticket.id == uuid.UUID(ticket_id)))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    confidence = float(ticket.ai_confidence or 0)

    # Look up neighbouring tickets in same category
    neighbours_result = await db.execute(
        select(Ticket)
        .where(Ticket.ai_triage_summary == ticket.ai_triage_summary)
        .where(Ticket.id != ticket.id)
        .order_by(Ticket.created_at.desc())
        .limit(5)
    )
    neighbours = neighbours_result.scalars().all()

    STATUTE_MAP = {
        "illegal_dumping": "RA 9003 (Ecological Solid Waste Management Act)",
        "solid_waste": "RA 9003 (Ecological Solid Waste Management Act)",
        "deforestation": "PD 705 (Revised Forestry Code) / RA 7161",
        "water_pollution": "RA 9275 (Philippine Clean Water Act)",
        "air_pollution": "RA 8749 (Clean Air Act)",
    }

    category_key = (ticket.ai_triage_summary or "").lower().replace(" ", "_")

    return {
        "success": True,
        "data": {
            "ticket_id": str(ticket.id),
            "display_id": f"INC-{str(ticket.id)[:6].upper()}",
            "category": ticket.ai_triage_summary,
            "confidence": confidence,
            "confidence_breakdown": {
                "visual": confidence,
            },
            "rule_chain": {
                "rule_fired": (
                    f"category:{ticket.ai_triage_summary} → routing"
                    if ticket.ai_triage_summary
                    else "no_rule"
                ),
                "statute": STATUTE_MAP.get(category_key),
                "agency": ticket.ai_recommended_office,
            },
            "neighbours": [
                {
                    "id": str(n.id),
                    "title": n.title,
                    "status": n.status,
                    "ai_confidence": n.ai_confidence,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                }
                for n in neighbours
            ],
        },
    }
