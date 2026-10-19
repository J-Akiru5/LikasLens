"""
GraphRAG module for LikasLens.

Combines relational knowledge (symbolic: hazard -> law -> agency, from Postgres)
with Gemini embeddings stored in pgvector (neural), for context-governed RAG.

This ensures Gemini only answers using strictly retrieved legal context,
preventing hallucinations about environmental laws.

Replaces the former Neo4j implementation. The graph was a fixed two-hop lookup
over data that already lives in Postgres, plus a vector index over the same law
embeddings; both are now served by `graph_store` and pgvector.
"""

from __future__ import annotations

import logging
from typing import Any

from google import genai
from google.genai import types

from config import settings
import graph_store

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 3072

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Lazy-initialise the Gemini client (thread-safe for FastAPI workers)."""
    global _client
    if _client is None:
        api_key = settings.google_api_key
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY environment variable not set")
        _client = genai.Client(api_key=api_key)
    return _client


async def embed_text(text: str) -> list[float]:
    """Generate a document embedding for the given text using Gemini."""
    client = _get_client()

    try:
        result = await client.aio.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        return result.embeddings[0].values
    except Exception as exc:
        logger.error("Gemini embedding failed: %s", exc)
        raise RuntimeError(f"Embedding generation failed: {exc}") from exc


async def embed_query(query: str) -> list[float]:
    """Generate a vector embedding for a search query using Gemini."""
    client = _get_client()

    try:
        result = await client.aio.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=query,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
        )
        return result.embeddings[0].values
    except Exception as exc:
        logger.error("Gemini query embedding failed: %s", exc)
        raise RuntimeError(f"Query embedding failed: {exc}") from exc


async def vector_search_laws(
    query_text: str,
    top_k: int = 5,
    jurisdiction: str | None = None,
) -> list[dict[str, Any]]:
    """Search for laws using pgvector cosine similarity.

    Returns law code, title, issuing agency, jurisdiction and similarity.
    An empty list means no law has been embedded yet, or the search failed.
    """
    query_embedding = await embed_query(query_text)
    return await graph_store.search_laws_by_embedding(query_embedding, top_k, jurisdiction)


def _search_query(hazard_code: str, jurisdiction: str | None) -> str:
    hazard_name = (hazard_code or "").replace("_", " ").replace("-", " ").lower()
    jurisdiction_label = (
        "Philippine"
        if (jurisdiction or "").upper().startswith("PH")
        else "Indonesian"
        if (jurisdiction or "").upper().startswith("ID")
        else "environmental"
    )
    return f"{jurisdiction_label} environmental law about {hazard_name}"


async def hybrid_retrieve(
    hazard_code: str,
    location: str | None = None,
    jurisdiction: str | None = None,
    top_k: int = 5,
) -> dict[str, Any]:
    """Hybrid retrieval: relational traversal first, pgvector fallback second.

    Returns:
        {
            "laws": [title, ...],
            "agencies": [name, ...],
            "method": "graph" | "vector" | "none",
            "vector_matches": [...]
        }
    """
    # Step 1: relational traversal (symbolic). High confidence when a link exists.
    try:
        graph_result = await graph_store.query_hazard_laws_and_agencies(
            hazard_code, location, jurisdiction
        )
    except Exception as exc:
        logger.warning("Relational traversal failed, falling back to vectors: %s", exc)
        graph_result = {"laws": [], "agencies": []}

    if graph_result.get("laws"):
        return {
            "laws": graph_result["laws"],
            "agencies": graph_result.get("agencies", []),
            "method": "graph",
            "vector_matches": [],
        }

    # Step 2: vector fallback (neural).
    logger.info(
        "No relational result for %s (jurisdiction=%s), trying pgvector search",
        hazard_code,
        jurisdiction,
    )

    try:
        vector_results = await vector_search_laws(
            _search_query(hazard_code, jurisdiction), top_k, jurisdiction
        )
    except Exception as exc:
        logger.error("Vector search also failed: %s", exc)
        return {"laws": [], "agencies": [], "method": "none", "vector_matches": []}

    if not vector_results:
        return {"laws": [], "agencies": [], "method": "none", "vector_matches": []}

    # Agencies are location-scoped when the caller gave a location; a vector hit
    # does not by itself establish which agency enforces it.
    agencies: list[str] = []
    if location:
        try:
            location_result = await graph_store.query_hazard_laws_and_agencies(
                hazard_code, location, jurisdiction
            )
            agencies = location_result.get("agencies", [])
        except Exception:
            agencies = []

    return {
        "laws": [v["title"] for v in vector_results],
        "agencies": agencies,
        "method": "vector",
        "vector_matches": vector_results,
    }
