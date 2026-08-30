"""
Grid-cell hotspot detection using ghost_mode.fuzz_location as bucketing key.
Minimum cell size floor of 5 enforced — suppresses cells with < 5 reports.
Identity fields never selected, returned, or grouped by.
"""

import logging
from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Ticket
from services.ghost_mode import fuzz_location

logger = logging.getLogger(__name__)

# Minimum reports required in a grid cell to include in results
MIN_CELL_SIZE = 5


async def get_hotspots(db: AsyncSession, window_days: int | None = None) -> dict:
    """Grid-cell hotspot detection.

    Uses the same 0.01° (~1km) grid as ghost_mode.fuzz_location for bucketing.
    Ghost and non-ghost reports land in the same coordinate space.
    Minimum cell size: 5 reports (suppresses small cells to prevent de-anonymisation).
    """
    now = datetime.now(UTC)
    q = select(
        Ticket.latitude,
        Ticket.longitude,
        Ticket.category,
        Ticket.severity,
        Ticket.address_text,
    ).where(
        Ticket.latitude.isnot(None),
        Ticket.longitude.isnot(None),
    )
    if window_days:
        cutoff = now - timedelta(days=window_days)
        q = q.where(Ticket.created_at >= cutoff)

    result = await db.execute(q)
    rows = result.all()

    # Bucket into grid cells using the same fuzz_location function
    cells: dict[tuple[float, float], list[dict]] = defaultdict(list)
    for row in rows:
        grid_lat, grid_lon = fuzz_location(row.latitude, row.longitude)
        cells[(grid_lat, grid_lon)].append({
            "category": row.category or "unknown",
            "severity": row.severity or "low",
            "address": row.address_text,
        })

    # Filter cells below minimum size and build response
    hotspots = []
    for (glat, glon), reports in cells.items():
        if len(reports) < MIN_CELL_SIZE:
            continue  # Suppress — too few reports, de-anonymisation risk

        # Dominant category
        cat_counts: dict[str, int] = defaultdict(int)
        sev_counts: dict[str, int] = defaultdict(int)
        for r in reports:
            cat_counts[r["category"]] += 1
            sev_counts[r["severity"]] += 1

        dominant_cat = max(cat_counts, key=cat_counts.get)

        # Best address hint (most common non-null address_text)
        addresses = [r["address"] for r in reports if r["address"]]
        address_hint = max(set(addresses), key=addresses.count) if addresses else None

        hotspots.append({
            "grid_lat": glat,
            "grid_lon": glon,
            "report_count": len(reports),
            "dominant_category": dominant_cat,
            "address_hint": address_hint,
            "severity_breakdown": dict(sev_counts),
        })

    # Sort by report count descending
    hotspots.sort(key=lambda x: x["report_count"], reverse=True)

    return {
        "hotspots": hotspots,
        "total_cells": len(hotspots),
        "meta": {
            "total_reports_analyzed": len(rows),
            "window_days": window_days or 0,
            "generated_at": now.isoformat(),
        },
    }
