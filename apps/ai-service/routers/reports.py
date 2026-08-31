"""
POST /api/v1/reports         — Citizen submits an environmental incident
POST /api/v1/reports/triage  — Pre-submission AI check (non-persisting)
"""

import base64
import logging
import uuid
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.supabase_jwt import optional_auth, verify_supabase_token
from config import settings
from db.connection import get_db
from db.models import Ticket, TicketEvidence, TicketTimeline
from services.exif import strip_exif, get_mime_type
from services.ghost_mode import sanitize_report_payload

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])
logger = logging.getLogger(__name__)

STORAGE_BUCKET = settings.supabase_storage_bucket

# Anonymous ghost user ID for uploads when reporter identity is hidden
GHOST_USER_ID = uuid.UUID("019edc0b-862e-722a-b489-c3bb01558a3c")


class ReportRequest(BaseModel):
    base64Image: str
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    report_type: str | None = None
    ghost_mode: bool = False


class TriageRequest(BaseModel):
    base64Image: str


@router.post("/triage")
async def triage_image(body: TriageRequest):
    """
    Non-persisting AI triage. Let the citizen know if this looks like
    a real environmental concern before committing to a full report.
    Calls the existing analyze_base64 function in-process.
    """
    from image_analysis import analyze_base64

    raw = body.base64Image
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(raw, validate=True)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid base64: {e}")

    # Strip EXIF even for triage — never send metadata to YOLO
    stripped, _ = strip_exif(image_bytes)
    stripped_b64 = base64.b64encode(stripped).decode()

    try:
        result = analyze_base64(stripped_b64, confidence=0.35)
    except Exception:
        result = {}

    assessment = result.get("environmental_assessment", {})
    return {
        "success": True,
        "has_concern": assessment.get("has_environmental_concern", False),
        "indicators": assessment.get("indicators", []),
        "confidence": result.get("composite_confidence", 0.0),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_report(
    body: ReportRequest,
    db: AsyncSession = Depends(get_db),
    token: dict | None = Depends(optional_auth),
):
    """
    Full report submission pipeline:
    1. Validate + decode base64 image
    2. Strip EXIF via Pillow
    3. Apply Ghost Mode rules (identity strip + location fuzz)
    4. Upload to Supabase Storage
    5. Persist Ticket + TicketEvidence in DB
    6. Call AI analysis pipeline in-process
    7. Store AI result + routing recommendation on Ticket
    8. Return structured response to frontend
    """
    # 1. Decode image
    raw = body.base64Image
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(raw, validate=True)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid base64 image: {e}")

    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 20MB)")

    # 2. EXIF strip (mandatory — runs for ALL reports, ghost or not)
    stripped_bytes, checksum = strip_exif(image_bytes)
    mime_type = get_mime_type(stripped_bytes)

    # 3. Ghost Mode rules
    reporter_user_id = None
    if token and not body.ghost_mode:
        reporter_user_id = token.get("sub")  # Supabase user UUID

    ghost_fields = sanitize_report_payload(
        reporter_user_id=reporter_user_id,
        ghost_mode=body.ghost_mode,
        latitude=body.latitude,
        longitude=body.longitude,
    )

    # 4. Upload to Supabase Storage (S3-compatible)
    ticket_id = uuid.uuid4()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    ext = "jpg" if "jpeg" in mime_type else mime_type.split("/")[-1]
    storage_path = f"evidence/{now.strftime('%Y/%m/%d')}/{ticket_id}.{ext}"

    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.supabase_storage_url,
            aws_access_key_id=settings.supabase_storage_key,
            aws_secret_access_key=settings.supabase_storage_secret,
        )
        s3.put_object(
            Bucket=STORAGE_BUCKET,
            Key=storage_path,
            Body=stripped_bytes,
            ContentType=mime_type,
        )
    except Exception as e:
        logger.error("Storage upload failed: %s", e)
        storage_path = f"pending/{ticket_id}.{ext}"

    # 5. Persist Ticket + Evidence in DB transaction
    title = f"Environmental Report — {now.strftime('%b %d, %Y %I:%M %p')}"

    ticket = Ticket(
        id=ticket_id,
        title=title,
        description=body.description or "Automatically generated report from LikasLens mobile submission",
        status="open",
        created_at=now,
        updated_at=now,
        **ghost_fields,
    )
    db.add(ticket)

    evidence = TicketEvidence(
        id=uuid.uuid4(),
        ticket_id=ticket_id,
        uploaded_by_user_id=uuid.UUID(reporter_user_id) if reporter_user_id else GHOST_USER_ID,
        storage_provider="supabase",
        storage_bucket=STORAGE_BUCKET,
        storage_path=storage_path,
        checksum_sha256=checksum,
        mime_type=mime_type,
        file_size_bytes=len(stripped_bytes),
        captured_at=now,
        exif_removed_at=now,
        yolo_status="pending",
        created_at=now,
        updated_at=now,
    )
    db.add(evidence)

    # Initial timeline entry
    timeline_entry = TicketTimeline(
        id=uuid.uuid4(),
        ticket_id=ticket_id,
        actor_type="ghost" if body.ghost_mode else "user",
        actor_id=None if body.ghost_mode else (
            uuid.UUID(reporter_user_id) if reporter_user_id else None
        ),
        from_status=None,
        to_status="open",
        note="Report submitted",
    )
    db.add(timeline_entry)
    await db.commit()

    # 6. AI analysis — in-process call (no HTTP hop!)
    from services.triage_service import run_triage
    ai_result = await run_triage(
        base64.b64encode(stripped_bytes).decode(), str(ticket_id), db
    )

    return {
        "success": True,
        "ticket_id": str(ticket_id),
        "status": "open",
        "ghost_mode": body.ghost_mode,
        "submission_path": "ai_service",
        "ai_analysis": ai_result,
        "public_ticket_url": f"/incidents/{ticket_id}",
    }
