"""
Neuro-symbolic hazard analysis pipeline for LikasLens.
Combines Cosmos DB Gremlin graph traversal (symbolic layer) with
Google Gemini 2.5 Flash (neural layer) to produce LGU-ready incident reports.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from gremlin_client import get_client, is_configured

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class HazardRequest(BaseModel):
    hazard_id: str = Field(
        ...,
        min_length=1,
        description="Hazard type identifier detected by YOLOv8 (e.g. open_burning, illegal_logging)",
    )


class HazardResponse(BaseModel):
    hazard_id: str
    violated_laws: list[str] = Field(default_factory=list)
    enforcing_agencies: list[str] = Field(default_factory=list)
    ai_summary: str

# ---------------------------------------------------------------------------
# Symbolic layer -- Gremlin traversal
# ---------------------------------------------------------------------------

def _extract_vertex_name(vertex_data: Any) -> str:
    """Extract a human-readable name from a Gremlin vertex result.

    Handles gremlin_python Vertex objects, Cosmos DB dict payloads,
    and falls back to the vertex id or string representation.
    """
    if hasattr(vertex_data, "properties"):
        props = vertex_data.properties
        if isinstance(props, dict) and "name" in props:
            name_val = props["name"]
            if isinstance(name_val, list) and name_val:
                first = name_val[0]
                if hasattr(first, "value"):
                    return str(first.value)
                if isinstance(first, dict):
                    return str(first.get("value", first))
                return str(first)
            if isinstance(name_val, dict):
                return str(name_val.get("value", name_val))
            return str(name_val)

    if isinstance(vertex_data, dict):
        name = vertex_data.get("name")
        if name:
            return str(name)
        props = vertex_data.get("properties", {})
        if isinstance(props, dict) and "name" in props:
            return str(props["name"])
        vid = vertex_data.get("id")
        return str(vid) if vid else str(vertex_data)

    return str(getattr(vertex_data, "id", vertex_data))


async def query_hazard_laws_and_agencies(hazard_id: str) -> dict[str, list[str]]:
    """Execute the symbolic Gremlin traversal to find laws and agencies
    linked to a given hazard vertex.

    Traversal:
        g.V(hazard_id).out('violates').as('law')
                      .out('enforced_by').as('agency')
                      .select('law', 'agency')
    """
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cosmos Gremlin not configured",
        )

    safe_id = hazard_id.replace("'", "\\'")
    traversal = (
        f"g.V('{safe_id}')"
        f".out('violates').as('law')"
        f".out('enforced_by').as('agency')"
        f".select('law', 'agency')"
    )

    client = get_client()

    def _submit() -> list:
        result_set = client.submit(traversal)
        return list(result_set)

    try:
        results = await asyncio.to_thread(_submit)
    except Exception as exc:
        logger.error("Gremlin traversal failed for hazard_id=%s: %s", hazard_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gremlin graph query failed: {exc}",
        ) from exc

    laws: set[str] = set()
    agencies: set[str] = set()

    for result in results:
        if not isinstance(result, dict):
            continue
        law_data = result.get("law")
        agency_data = result.get("agency")
        if law_data:
            name = _extract_vertex_name(law_data).strip()
            if name:
                laws.add(name)
        if agency_data:
            name = _extract_vertex_name(agency_data).strip()
            if name:
                agencies.add(name)

    return {"laws": sorted(laws), "agencies": sorted(agencies)}

# ---------------------------------------------------------------------------
# Neural layer -- Gemini 2.5 Flash
# ---------------------------------------------------------------------------

_gemini_model: genai.GenerativeModel | None = None


def _get_gemini_model() -> genai.GenerativeModel:
    """Lazy-initialise the Gemini model (thread-safe for FastAPI workers)."""
    global _gemini_model
    if _gemini_model is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel("gemini-2.5-flash")
    return _gemini_model


async def generate_incident_summary(
    hazard_id: str,
    laws: list[str],
    agencies: list[str],
) -> str:
    """Generate a formal 2-sentence incident summary via Gemini 2.5 Flash."""
    model = _get_gemini_model()

    laws_str = ", ".join(laws) if laws else "no specific laws mapped in the graph"
    agencies_str = ", ".join(agencies) if agencies else "no enforcing agencies mapped in the graph"

    prompt = (
        f"You are Likasy, an environmental AI assistant. "
        f"The system detected {hazard_id}. "
        f"The Graph Database strictly dictates this violates {laws_str} "
        f"enforced by {agencies_str}. "
        f"Write a 2-sentence formal incident report summarizing this violation "
        f"and naming the specific laws and agencies. "
        f"Do not invent any laws outside of the provided graph data."
    )

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        text = response.text
        if not text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini returned an empty response",
            )
        return text.strip()
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Gemini API call failed for hazard_id=%s: %s", hazard_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API call failed: {exc}",
        ) from exc
