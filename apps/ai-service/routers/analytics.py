"""
Analytics API router — /api/v1/analytics/*
Endpoints: /summary, /categories, /trends, /hotspots
Auth: require_lgu_role (mirrors existing router convention).
"""

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.supabase_jwt import require_lgu_role
from db.connection import get_db
from analytics.aggregations import get_category_distribution, get_summary
from analytics.trends import get_trends
from analytics.hotspots import get_hotspots

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)


@router.get("/summary")
async def analytics_summary(
    days: int | None = Query(None, ge=1, le=365, description="Window in days. Omit for full table."),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_lgu_role),
):
    """Summary: total reports, status counts, resolution rate, median time-to-resolution.

    Full table by default; optional ?days=N window.
    """
    result = await get_summary(db, window_days=days)
    return result


@router.get("/categories")
async def analytics_categories(
    days: int | None = Query(None, ge=1, le=365, description="Window in days. Omit for full table."),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_lgu_role),
):
    """Category distribution + severity breakdown.

    Full table by default; optional ?days=N window.
    """
    result = await get_category_distribution(db, window_days=days)
    return result


@router.get("/trends")
async def analytics_trends(
    days: int = Query(30, ge=1, le=365, description="Window in days (default 30)."),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_lgu_role),
):
    """Daily report counts with period-over-period growth rate.

    Overall and per-category trends over the specified window.
    """
    result = await get_trends(db, window_days=days)
    return result


@router.get("/hotspots")
async def analytics_hotspots(
    days: int | None = Query(None, ge=1, le=365, description="Window in days. Omit for full table."),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_lgu_role),
):
    """Grid-cell hotspot detection.

    Uses 0.01° (~1km) grid cells from ghost_mode.fuzz_location.
    Minimum cell size of 5 reports enforced.
    """
    result = await get_hotspots(db, window_days=days)
    return result
