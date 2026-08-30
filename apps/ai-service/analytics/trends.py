"""
Trend analysis using date_trunc + window functions.
No pandas — pure SQL aggregates via async SQLAlchemy.
"""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Ticket

logger = logging.getLogger(__name__)


async def get_trends(db: AsyncSession, window_days: int = 30) -> dict:
    """Daily report counts with period-over-period growth rate.

    Overall and per-category. Uses date_trunc('day', created_at).
    """
    now = datetime.now(UTC)
    cutoff = now - timedelta(days=window_days)
    prev_cutoff = cutoff - timedelta(days=window_days)

    # ── Overall daily counts ────────────────────────────────────────────
    daily_q = (
        select(
            func.date_trunc("day", Ticket.created_at).label("day"),
            func.count().label("count"),
        )
        .where(Ticket.created_at >= cutoff)
        .group_by(func.date_trunc("day", Ticket.created_at))
        .order_by(func.date_trunc("day", Ticket.created_at))
    )
    daily_result = await db.execute(daily_q)
    daily_rows = daily_result.all()
    overall_daily = [
        {"date": row.day.strftime("%Y-%m-%d"), "count": row.count}
        for row in daily_rows
    ]

    # ── Overall growth rate (current period vs previous period) ─────────
    current_count_q = select(func.count()).where(Ticket.created_at >= cutoff)
    prev_count_q = select(func.count()).where(
        Ticket.created_at >= prev_cutoff,
        Ticket.created_at < cutoff,
    )
    current_result = await db.execute(current_count_q)
    prev_result = await db.execute(prev_count_q)
    current_count = current_result.scalar() or 0
    prev_count = prev_result.scalar() or 0
    growth_rate = (
        round(((current_count - prev_count) / prev_count) * 100, 1)
        if prev_count > 0
        else 0.0
    )

    # ── Per-category trends ─────────────────────────────────────────────
    cat_list_q = (
        select(Ticket.category)
        .where(Ticket.category.isnot(None), Ticket.created_at >= cutoff)
        .group_by(Ticket.category)
        .order_by(func.count().desc())
    )
    cat_list_result = await db.execute(cat_list_q)
    categories = [row[0] for row in cat_list_result.all()]

    by_category = []
    for cat in categories:
        # Daily counts for this category
        cat_daily_q = (
            select(
                func.date_trunc("day", Ticket.created_at).label("day"),
                func.count().label("count"),
            )
            .where(
                Ticket.category == cat,
                Ticket.created_at >= cutoff,
            )
            .group_by(func.date_trunc("day", Ticket.created_at))
            .order_by(func.date_trunc("day", Ticket.created_at))
        )
        cat_daily_result = await db.execute(cat_daily_q)
        cat_daily_rows = cat_daily_result.all()
        cat_daily = [
            {"date": row.day.strftime("%Y-%m-%d"), "count": row.count}
            for row in cat_daily_rows
        ]

        # Growth rate for this category
        cat_current_q = select(func.count()).where(
            Ticket.category == cat, Ticket.created_at >= cutoff,
        )
        cat_prev_q = select(func.count()).where(
            Ticket.category == cat,
            Ticket.created_at >= prev_cutoff,
            Ticket.created_at < cutoff,
        )
        cat_cur = (await db.execute(cat_current_q)).scalar() or 0
        cat_prev = (await db.execute(cat_prev_q)).scalar() or 0
        cat_growth = (
            round(((cat_cur - cat_prev) / cat_prev) * 100, 1)
            if cat_prev > 0
            else 0.0
        )

        by_category.append({
            "category": cat,
            "daily_counts": cat_daily,
            "growth_rate": {
                "current_period": cat_cur,
                "previous_period": cat_prev,
                "growth_rate": cat_growth,
            },
        })

    return {
        "overall_daily": overall_daily,
        "overall_growth": {
            "current_period": current_count,
            "previous_period": prev_count,
            "growth_rate": growth_rate,
        },
        "by_category": by_category,
        "meta": {
            "total_reports_analyzed": current_count,
            "window_days": window_days,
            "generated_at": now.isoformat(),
        },
    }
