"""
Neuro-symbolic hazard analysis pipeline for LikasLens.
Combines Neo4j graph traversal + vector search (symbolic layer) with
Google Gemini 2.5 Flash (neural layer) to produce LGU-ready incident reports.

Replaces the former Cosmos DB Gremlin-based hazard analyzer.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from config import settings
from neo4j_client import is_configured

logger = logging.getLogger(__name__)

GEMINI_TIMEOUT_SECONDS = 30

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class HazardRequest(BaseModel):
    hazard_id: str = Field(
        ...,
        min_length=1,
        description="Hazard type identifier detected by YOLOv8 (e.g. open_burning, illegal_logging)",
    )
    location: str | None = Field(
        None,
        description="Location of the incident (e.g. Iloilo City). Enables location-aware law lookup.",
    )
    jurisdiction: str | None = Field(
        None,
        description="Jurisdiction code to scope law lookup (e.g. 'PH-NATIONAL', 'ID-NATIONAL'). If omitted, all jurisdictions are returned.",
    )


class HazardResponse(BaseModel):
    hazard_id: str
    location: str | None
    jurisdiction: str | None = None
    violated_laws: list[str] = Field(default_factory=list)
    enforcing_agencies: list[str] = Field(default_factory=list)
    retrieval_method: str = "none"
    ai_summary: str


# ---------------------------------------------------------------------------
# Symbolic layer -- Neo4j graph traversal + vector search
# ---------------------------------------------------------------------------

async def retrieve_legal_context(
    hazard_code: str,
    location: str | None = None,
    jurisdiction: str | None = None,
) -> dict[str, Any]:
    """Retrieve legal context using hybrid GraphRAG.

    1. Graph traversal (Location-aware, jurisdiction-scoped) for high-confidence matches
    2. Vector search fallback for broader legal context (jurisdiction post-filtered)
    """
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Neo4j not configured. Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD.",
        )

    import re
    if not re.match(r"^[a-zA-Z0-9_\-:.@]+$", hazard_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid hazard_id format",
        )

    from neo4j_client import get_driver
    from graph_rag import hybrid_retrieve

    try:
        driver = await get_driver()
        result = await hybrid_retrieve(driver, hazard_code, location, jurisdiction)
    except Exception as exc:
        logger.error("Legal context retrieval failed for hazard=%s: %s", hazard_code, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Legal context retrieval failed",
        ) from exc

    return result


# ---------------------------------------------------------------------------
# Neural layer -- Gemini 2.5 Flash
# ---------------------------------------------------------------------------

_gemini_model: genai.GenerativeModel | None = None


def _get_gemini_model() -> genai.GenerativeModel:
    """Lazy-initialise the Gemini model (thread-safe for FastAPI workers)."""
    global _gemini_model
    if _gemini_model is None:
        api_key = settings.google_api_key
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel("gemini-2.5-flash")
    return _gemini_model


async def generate_grounded_report(
    hazard_id: str,
    location: str | None,
    laws: list[str],
    agencies: list[str],
    retrieval_method: str,
) -> str:
    """Generate a formal, grounded incident report via Gemini 2.5 Flash.

    The prompt strictly governs Gemini to only use the provided legal context.
    If no laws were found, returns a manual review escalation message.
    """
    if not laws:
        location_str = f" in {location}" if location else ""
        return (
            f"A potential {hazard_id.replace('_', ' ')} was flagged{location_str}, "
            f"but no localized legal constraints are mapped to this region. "
            f"Escalated to regional supervisor for manual review."
        )

    model = _get_gemini_model()

    laws_str = "\n".join(f"- {law}" for law in laws)
    agencies_str = ", ".join(agencies) if agencies else "no enforcing agencies mapped"
    location_str = f"Location: {location}" if location else "Location: not specified"

    prompt = f"""You are Liksi, a strict legal synthesis AI for an environmental compliance system in the Philippines.

A vision model has detected the following hazard: {hazard_id.replace('_', ' ')}
{location_str}

You must evaluate this incident strictly against the following retrieved legal context:

VIOLATED LAWS:
{laws_str}

ENFORCING AGENCIES: {agencies_str}

CRITICAL INSTRUCTIONS:
1. Base your summary ONLY on the provided legal text. Do not assume or hallucinate outside environmental laws.
2. Explicitly state which specific Law/Ordinance is violated and name the responsible Enforcing Agency to route this ticket to.
3. Maintain an objective, institutional tone.
4. Write exactly 2 sentences: one describing the violation and applicable law, one naming the agency to route to.
5. Do NOT add disclaimers, caveats, or information not present in the retrieved context."""

    last_exc = None
    for attempt in range(3):
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, prompt),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            text = response.text
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Gemini returned an empty response",
                )
            return text.strip()
        except asyncio.TimeoutError:
            last_exc = None
            logger.warning("Gemini timeout on attempt %d/3 for hazard_id=%s", attempt + 1, hazard_id)
        except HTTPException:
            raise
        except Exception as exc:
            last_exc = exc
            logger.warning("Gemini error on attempt %d/3 for hazard_id=%s: %s", attempt + 1, hazard_id, exc)

        if attempt < 2:
            delay = 2 ** attempt  # 1s, 2s
            await asyncio.sleep(delay)

    if last_exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini API call failed after 3 attempts",
        ) from last_exc
    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail=f"Gemini API timed out after 3 attempts",
    )
