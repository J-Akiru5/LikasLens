"""
Pydantic response models for analytics endpoints.
Every response carries a meta block with provenance info.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class AnalyticsMeta(BaseModel):
    """Provenance block — every analytics response includes this."""
    total_reports_analyzed: int = Field(..., description="Total tickets in the analysis window")
    window_days: int = Field(..., description="Number of days in the analysis window")
    generated_at: str = Field(..., description="ISO timestamp of when this response was generated")


class StatusCount(BaseModel):
    status: str
    count: int
    percentage: float


class SummaryResponse(BaseModel):
    total_reports: int
    status_counts: list[StatusCount]
    resolution_rate: float = Field(..., description="Percentage of resolved+verified+closed tickets")
    median_time_to_resolution_hours: float | None = Field(None, description="Median hours from created_at to resolved_at")
    ghost_mode_count: int
    ghost_mode_percentage: float
    meta: AnalyticsMeta


class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float
    avg_confidence: float


class CategorySeverityBreakdown(BaseModel):
    severity: str
    count: int
    percentage: float


class CategoriesResponse(BaseModel):
    categories: list[CategoryCount]
    severity_distribution: list[CategorySeverityBreakdown]
    meta: AnalyticsMeta


class DailyCount(BaseModel):
    date: str
    count: int


class GrowthRate(BaseModel):
    current_period: int
    previous_period: int
    growth_rate: float = Field(..., description="Percentage change: (current-previous)/previous * 100")


class CategoryTrend(BaseModel):
    category: str
    daily_counts: list[DailyCount]
    growth_rate: GrowthRate


class TrendsResponse(BaseModel):
    overall_daily: list[DailyCount]
    overall_growth: GrowthRate
    by_category: list[CategoryTrend]
    meta: AnalyticsMeta


class HotspotCell(BaseModel):
    grid_lat: float = Field(..., description="Grid cell center latitude (0.01 precision)")
    grid_lon: float = Field(..., description="Grid cell center longitude (0.01 precision)")
    report_count: int
    dominant_category: str
    address_hint: str | None = Field(None, description="Nearby place name from address_text (approximate)")
    severity_breakdown: dict[str, int]


class HotspotsResponse(BaseModel):
    hotspots: list[HotspotCell]
    total_cells: int
    meta: AnalyticsMeta
