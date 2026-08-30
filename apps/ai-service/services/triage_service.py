"""
Triage service — runs AI analysis in-process and persists results to DB.
Replaces the PHP TriageService HTTP call entirely.
Includes a circuit breaker for Gemini failures.
"""

import asyncio
import base64
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.models import Ticket

logger = logging.getLogger(__name__)

_circuit_failures = 0
_circuit_opened_at = 0.0
CIRCUIT_THRESHOLD = 3
CIRCUIT_COOLDOWN = 60.0

POSTGRESQL_ROUTING_RULES = {
    "illegal_dumping":  "LGU Environment Office",
    "solid_waste":      "LGU Environment Office",
    "water_pollution":  "DENR Water Resources Division",
    "air_pollution":    "LGU Environment Office",
    "deforestation":    "DENR - Protected Areas",
    "illegal_burning":  "Bureau of Fire Protection / LGU Environment",
    "sewage_discharge": "LWUA / LGU Engineering Office",
    "chemical_spill":   "DENR - Emergency Response",
    "noise_pollution":  "LGU Environment Office",
}

# D1b: Map our category vocabulary to Neo4j ViolationType codes
# These match the codes in neo4j_upserts/baseline_rules.py:BASELINE_VIOLATIONS
CATEGORY_TO_VIOLATION_CODE = {
    "illegal_dumping":  "SWM-ILLEGAL-DUMPING",
    "solid_waste":      "SWM-ILLEGAL-DUMPING",
    "water_pollution":  "WATER-UNAUTHORIZED-DISCHARGE",
    "air_pollution":    "AIR-EMISSION-VIOLATION",
    "deforestation":    "ILLEGAL-LOGGING",
    "illegal_burning":  "OPEN-BURNING",
    "sewage_discharge": "WATER-UNAUTHORIZED-DISCHARGE",
    "chemical_spill":   "HAZWASTE-HANDLING",
    "noise_pollution":  "NOISE-POLLUTION",
}


def _fallback_route(category: str) -> tuple[str, str]:
    """Fallback routing using PostgreSQL rule-based rules."""
    office = POSTGRESQL_ROUTING_RULES.get(
        category.lower().replace(" ", "_"),
        "LGU Environment Office",
    )
    return office, "postgresql_fallback"


async def run_triage(base64_image: str, ticket_id: str, db: AsyncSession) -> dict:
    """
    1. Call YOLOv8 + Gemini in-process
    2. Attempt Neo4j routing recommendation
    3. Fall back to PostgreSQL rule-based routing
    4. Persist AI result + routing_source to ticket
    """
    global _circuit_failures, _circuit_opened_at
    import time

    # Circuit breaker check
    if _circuit_failures >= CIRCUIT_THRESHOLD:
        elapsed = time.monotonic() - _circuit_opened_at
        if elapsed < CIRCUIT_COOLDOWN:
            logger.warning("AI circuit breaker open — using fallback result")
            return {"status": "pending", "routing_source": "circuit_breaker_open"}
        else:
            _circuit_failures = 0

    try:
        from image_analysis import analyze_base64
        result = await asyncio.to_thread(analyze_base64, base64_image, 0.50)
        _circuit_failures = 0
    except Exception as e:
        logger.error("AI analysis failed: %s", e)
        _circuit_failures += 1
        if _circuit_failures >= CIRCUIT_THRESHOLD:
            _circuit_opened_at = time.monotonic()
        return {"status": "analysis_failed", "routing_source": "postgresql_fallback"}

    # Extract structured fields from ALL indicators
    assessment = result.get("environmental_assessment", {})
    indicators = assessment.get("indicators") or []
    category = indicators[0].get("type", "unknown") if indicators else "unknown"

    # D3: Derive real severity from indicator map (aggregate across ALL indicators)
    SEVERITY_RANK = {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}
    worst_severity = "low"
    worst_rank = 0
    for ind in indicators:
        sev = ind.get("severity", "low")
        rank = SEVERITY_RANK.get(sev, 0)
        if rank > worst_rank:
            worst_rank = rank
            worst_severity = sev

    confidence = float(result.get("composite_confidence", 0.0))
    summary = f"YOLOv8: {result.get('detection_count', 0)} detection(s). Category: {category}."

    # Attempt Neo4j routing with correct ViolationType code
    recommended_office, routing_source = _fallback_route(category)
    violation_code = CATEGORY_TO_VIOLATION_CODE.get(category, category.upper().replace(" ", "_"))
    try:
        from neo4j_client import route_incident
        neo4j_result = await route_incident(
            citizen_id="system",
            incident_id=ticket_id,
            violation_code=violation_code,
            ngo_id=None,
            severity=worst_severity,
        )
        if neo4j_result.get("success") and neo4j_result.get("recommended_office"):
            recommended_office = neo4j_result["recommended_office"]
            routing_source = "neo4j"
            logger.info(
                "routing_source=neo4j | recommended=%s | ticket=%s",
                recommended_office, ticket_id,
            )
        else:
            logger.info(
                "routing_source=postgresql_fallback | recommended=%s | ticket=%s",
                recommended_office, ticket_id,
            )
    except Exception as e:
        logger.warning("Neo4j unavailable — falling back to PostgreSQL routing rules: %s", e)
        logger.info(
            "routing_source=postgresql_fallback | recommended=%s | ticket=%s",
            recommended_office, ticket_id,
        )

    # Persist to DB
    try:
        ticket_uuid = uuid.UUID(ticket_id)
        result_row = await db.execute(select(Ticket).where(Ticket.id == ticket_uuid))
        ticket = result_row.scalar_one_or_none()
        if ticket:
            ticket.ai_triage_summary = summary
            ticket.ai_confidence = confidence
            ticket.ai_analysis_raw = result
            ticket.ai_recommended_office = recommended_office
            ticket.routing_source = routing_source
            ticket.urgency_score = confidence
            ticket.category = category
            ticket.severity = worst_severity
            await db.commit()
    except Exception as e:
        logger.error("Failed to persist AI result to ticket %s: %s", ticket_id, e)

    return {
        "status": "analyzed",
        "category": category,
        "severity": worst_severity,
        "confidence": confidence,
        "recommended_office": recommended_office,
        "routing_source": routing_source,
        "summary": summary,
    }
