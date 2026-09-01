"""
POST /api/v1/reports         — Citizen submits an environmental incident
POST /api/v1/reports/triage  — Pre-submission AI check (non-persisting)
"""

import base64
import hashlib
import logging
import uuid
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.supabase_jwt import optional_auth, verify_supabase_token
from config import settings
from db.connection import AsyncSessionLocal, get_db
from db.models import Ticket, TicketEvidence, TicketTimeline
from services.exif import strip_exif, get_mime_type, downscale_image
from services.ghost_mode import sanitize_report_payload

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])
logger = logging.getLogger(__name__)

STORAGE_BUCKET = settings.supabase_storage_bucket

# Module-level S3 client singleton — created once, reused across requests.
# boto3 clients are thread-safe for put_object within a single process.
_s3_client = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.supabase_storage_url,
            aws_access_key_id=settings.supabase_storage_key,
            aws_secret_access_key=settings.supabase_storage_secret,
        )
    return _s3_client

# Anonymous ghost user ID for uploads when reporter identity is hidden
GHOST_USER_ID = uuid.UUID("019edc0b-862e-722a-b489-c3bb01558a3c")


async def _run_triage_background(base64_image: str, ticket_id: str) -> None:
    """
    Background coroutine: run AI triage with its own independent DB session.

    Decoupled from the request-scoped session so it can outlive the HTTP
    response. Exceptions are logged but never re-raised — the ticket already
    exists in the DB and will be picked up by admin re-analysis if needed.
    """
    if AsyncSessionLocal is None:
        logger.error(
            "Background triage skipped for ticket %s: DATABASE_URL not configured",
            ticket_id,
        )
        return

    import time
    from services.triage_service import run_triage

    t0 = time.monotonic()
    logger.info("Background triage starting for ticket %s", ticket_id)
    try:
        async with AsyncSessionLocal() as bg_db:
            await run_triage(base64_image, ticket_id, bg_db)
        elapsed = time.monotonic() - t0
        logger.info(
            "Background triage complete for ticket %s (%.1fs)", ticket_id, elapsed
        )
    except Exception as exc:
        elapsed = time.monotonic() - t0
        logger.error(
            "Background triage failed for ticket %s after %.1fs: %s",
            ticket_id,
            elapsed,
            exc,
            exc_info=True,
        )


class ReportRequest(BaseModel):
    base64Image: str
    latitude: float | None = None
    longitude: float | None = None
    location: str | None = None
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
    stripped = downscale_image(stripped)
    stripped_b64 = base64.b64encode(stripped).decode()

    try:
        from image_analysis import analyze_base64_async
        result = await analyze_base64_async(stripped_b64, confidence=0.35)
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
    background_tasks: BackgroundTasks,
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
    6. Schedule AI analysis in background
    7. Return structured response to frontend
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

    # 2b. Downscale for storage — reduces S3 upload size and downstream memory.
    #     1920px longest edge is sufficient for evidence viewing and YOLO detection.
    stripped_bytes = downscale_image(stripped_bytes)
    checksum = hashlib.sha256(stripped_bytes).hexdigest()

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
        s3 = _get_s3_client()
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
        address_text=body.location,
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

    # 6. Schedule AI analysis as a background task
    background_tasks.add_task(
        _run_triage_background,
        base64.b64encode(stripped_bytes).decode(),
        str(ticket_id)
    )

    return {
        "success": True,
        "ticket_id": str(ticket_id),
        "status": "open",
        "ghost_mode": body.ghost_mode,
        "submission_path": "ai_service",
        "ai_analysis": {
            "status": "pending",
            "message": "AI analysis is running in the background. Ticket AI fields will populate shortly.",
        },
        "public_ticket_url": f"/incidents/{ticket_id}",
    }
