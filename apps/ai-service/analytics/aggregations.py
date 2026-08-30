"""
SQL-based aggregations for analytics summary and category endpoints.
All queries use async SQLAlchemy — no pandas, no SELECT *.
Ghost-mode safety: never SELECT, GROUP BY, or return IDENTITY_FIELDS.
Minimum cell size of 5 enforced on location-scoped aggregates.
"""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Ticket

logger = logging.getLogger(__name__)

# Ghost-mode identity fields — NEVER include in any query result
# (from services/ghost_mode.py:IDENTITY_FIELDS)
# reporter_user_id, reporter_email, reporter_phone, reporter_ip, ghost_mode

SEVERITY_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}


async def get_summary(db: AsyncSession, window_days: int | None = None) -> dict:
    """Aggregate summary: total reports, status counts, resolution rate, time-to-resolution.

    Runs over the FULL table (not a 100-row page).
    """
    now = datetime.now(UTC)
    base_q = select(Ticket)
    if window_days:
        cutoff = now - timedelta(days=window_days)
        base_q = base_q.where(Ticket.created_at >= cutoff)

    # Total count
    total_result = await db.execute(select(func.count()).select_from(base_q.subquery()))
    total = total_result.scalar() or 0

    # Status counts
    status_q = (
        select(Ticket.status, func.count().label("count"))
        .group_by(Ticket.status)
        .order_by(func.count().desc())
    )
    if window_days:
        status_q = status_q.where(Ticket.created_at >= cutoff)
    status_result = await db.execute(status_q)
    status_rows = status_result.all()

    status_counts = []
    for row in status_rows:
        pct = round((row.count / total) * 100, 1) if total > 0 else 0.0
        status_counts.append({
            "status": row.status,
            "count": row.count,
            "percentage": pct,
        })

    # Resolution rate: resolved + verified + closed / total
    resolved_statuses = ("resolved", "verified", "closed")
    resolved_q = select(func.count()).where(Ticket.status.in_(resolved_statuses))
    if window_days:
        resolved_q = resolved_q.where(Ticket.created_at >= cutoff)
    resolved_result = await db.execute(resolved_q)
    resolved_count = resolved_result.scalar() or 0
    resolution_rate = round((resolved_count / total) * 100, 1) if total > 0 else 0.0

    # Median time-to-resolution
    ttr_q = select(
        func.extract("epoch", Ticket.resolved_at - Ticket.created_at) / 3600.0
    ).where(
        Ticket.resolved_at.isnot(None),
        Ticket.created_at.isnot(None),
    )
    if window_days:
        ttr_q = ttr_q.where(Ticket.created_at >= cutoff)
    ttr_result = await db.execute(ttr_q)
    ttr_values = sorted([row[0] for row in ttr_result.all() if row[0] is not None])
    median_ttr = None
    if ttr_values:
        mid = len(ttr_values) // 2
        if len(ttr_values) % 2 == 0:
            median_ttr = round((ttr_values[mid - 1] + ttr_values[mid]) / 2, 1)
        else:
            median_ttr = round(ttr_values[mid], 1)

    # Ghost mode count (aggregate only — don't expose individual ghost records)
    ghost_q = select(func.count()).where(Ticket.ghost_mode.is_(True))
    if window_days:
        ghost_q = ghost_q.where(Ticket.created_at >= cutoff)
    ghost_result = await db.execute(ghost_q)
    ghost_count = ghost_result.scalar() or 0
    ghost_pct = round((ghost_count / total) * 100, 1) if total > 0 else 0.0

    return {
        "total_reports": total,
        "status_counts": status_counts,
        "resolution_rate": resolution_rate,
        "median_time_to_resolution_hours": median_ttr,
        "ghost_mode_count": ghost_count,
        "ghost_mode_percentage": ghost_pct,
        "meta": {
            "total_reports_analyzed": total,
            "window_days": window_days or 0,
            "generated_at": now.isoformat(),
        },
    }


async def get_category_distribution(db: AsyncSession, window_days: int | None = None) -> dict:
    """Category distribution with share and average confidence.

    Ghost-mode safe: category is not an identity field.
    """
    now = datetime.now(UTC)
    base_q = select(Ticket)
    if window_days:
        cutoff = now - timedelta(days=window_days)
        base_q = base_q.where(Ticket.created_at >= cutoff)

    total_result = await db.execute(select(func.count()).select_from(base_q.subquery()))
    total = total_result.scalar() or 0

    # Category counts + avg confidence
    cat_q = (
        select(
            Ticket.category,
            func.count().label("count"),
            func.avg(Ticket.ai_confidence).label("avg_conf"),
        )
        .where(Ticket.category.isnot(None))
        .group_by(Ticket.category)
        .order_by(func.count().desc())
    )
    if window_days:
        cat_q = cat_q.where(Ticket.created_at >= cutoff)
    cat_result = await db.execute(cat_q)
    cat_rows = cat_result.all()

    categories = []
    for row in cat_rows:
        pct = round((row.count / total) * 100, 1) if total > 0 else 0.0
        categories.append({
            "category": row.category,
            "count": row.count,
            "percentage": pct,
            "avg_confidence": round(float(row.avg_conf or 0), 2),
        })

    # Severity distribution across all tickets
    sev_q = (
        select(Ticket.severity, func.count().label("count"))
        .where(Ticket.severity.isnot(None))
        .group_by(Ticket.severity)
        .order_by(func.count().desc())
    )
    if window_days:
        sev_q = sev_q.where(Ticket.created_at >= cutoff)
    sev_result = await db.execute(sev_q)
    sev_rows = sev_result.all()

    severity_dist = []
    for row in sev_rows:
        pct = round((row.count / total) * 100, 1) if total > 0 else 0.0
        severity_dist.append({
            "severity": row.severity,
            "count": row.count,
            "percentage": pct,
        })

    return {
        "categories": categories,
        "severity_distribution": severity_dist,
        "meta": {
            "total_reports_analyzed": total,
            "window_days": window_days or 0,
            "generated_at": now.isoformat(),
        },
    }
