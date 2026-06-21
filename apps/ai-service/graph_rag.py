"""
GraphRAG module for LikasLens.
Combines Neo4j graph traversal (symbolic) with Gemini embeddings (neural)
for Context-Governed Retrieval Augmented Generation.

This ensures Gemini only answers using strictly retrieved legal context,
preventing hallucinations about environmental laws.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import google.generativeai as genai

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_DIMENSION = 768
VECTOR_INDEX_NAME = "law_embeddings"
VECTOR_INDEX_LABEL = "Law"
VECTOR_INDEX_PROPERTY = "embedding"

_gemini_configured = False


def _ensure_gemini_configured() -> None:
    """Lazy-configure the Gemini API."""
    global _gemini_configured
    if not _gemini_configured:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        _gemini_configured = True


async def embed_text(text: str) -> list[float]:
    """Generate a vector embedding for the given text using Gemini.

    Uses text-embedding-004 which produces 768-dimensional vectors.
    """
    _ensure_gemini_configured()

    try:
        result = await asyncio.to_thread(
            genai.embed_content,
            model=EMBEDDING_MODEL,
            content=text,
            task_type="RETRIEVAL_DOCUMENT",
        )
        return result["embedding"]
    except Exception as exc:
        logger.error("Gemini embedding failed: %s", exc)
        raise RuntimeError(f"Embedding generation failed: {exc}") from exc


async def embed_query(query: str) -> list[float]:
    """Generate a vector embedding for a search query using Gemini.

    Uses RETRIEVAL_QUERY task type for search-optimized embeddings.
    """
    _ensure_gemini_configured()

    try:
        result = await asyncio.to_thread(
            genai.embed_content,
            model=EMBEDDING_MODEL,
            content=query,
            task_type="RETRIEVAL_QUERY",
        )
        return result["embedding"]
    except Exception as exc:
        logger.error("Gemini query embedding failed: %s", exc)
        raise RuntimeError(f"Query embedding failed: {exc}") from exc


async def create_vector_index(driver) -> None:
    """Create the vector index in Neo4j for law embeddings.

    Call this once during database setup/seeding.
    """
    async with driver.session() as session:
        # Check if index already exists
        result = await session.run(
            "SHOW INDEXES YIELD name WHERE name = $name RETURN name",
            {"name": VECTOR_INDEX_NAME},
        )
        existing = await result.data()
        if existing:
            logger.info("Vector index '%s' already exists", VECTOR_INDEX_NAME)
            return

        # Create vector index
        query = f"""
        CREATE VECTOR INDEX {VECTOR_INDEX_NAME} IF NOT EXISTS
        FOR (l:{VECTOR_INDEX_LABEL})
        ON (l.{VECTOR_INDEX_PROPERTY})
        OPTIONS {{
            indexConfig: {{
                `vector.dimensions`: {EMBEDDING_DIMENSION},
                `vector.similarity_function`: 'cosine'
            }}
        }}
        """
        await session.run(query)
        logger.info("Created vector index '%s'", VECTOR_INDEX_NAME)


async def embed_law_nodes(driver, laws: list[dict[str, Any]]) -> int:
    """Generate and store embeddings for Law nodes in Neo4j.

    Args:
        driver: Neo4j async driver
        laws: List of dicts with 'code' and 'title' keys

    Returns:
        Number of laws embedded
    """
    embedded_count = 0

    for law in laws:
        text_to_embed = f"{law['code']}: {law['title']}"
        try:
            embedding = await embed_text(text_to_embed)
        except Exception as exc:
            logger.warning("Failed to embed law %s: %s", law.get("code"), exc)
            continue

        async with driver.session() as session:
            await session.run(
                """
                MATCH (l:Law {code: $code})
                SET l.embedding = $embedding
                RETURN l.code AS code
                """,
                {"code": law["code"], "embedding": embedding},
            )
            embedded_count += 1
            logger.debug("Embedded law: %s", law["code"])

    logger.info("Embedded %d/%d law nodes", embedded_count, len(laws))
    return embedded_count


async def vector_search_laws(
    driver,
    query_text: str,
    top_k: int = 5,
    jurisdiction: str | None = None,
) -> list[dict[str, Any]]:
    """Search for laws using vector similarity.

    Args:
        driver: Neo4j async driver
        query_text: Natural language query (e.g., "illegal dumping of waste")
        top_k: Number of results to return
        jurisdiction: Optional jurisdiction filter (e.g. "PH-NATIONAL", "ID-NATIONAL")

    Returns:
        List of matching law nodes with similarity scores
    """
    query_embedding = await embed_query(query_text)

    async with driver.session() as session:
        result = await session.run(
            """
            CALL db.index.vector.queryNodes($index_name, $top_k, $query_vector)
            YIELD node AS law, score
            RETURN law.code AS code,
                   law.title AS title,
                   law.issuing_agency AS issuing_agency,
                   law.jurisdictionCode AS jurisdiction_code,
                   score
            ORDER BY score DESC
            """,
            {
                "index_name": VECTOR_INDEX_NAME,
                "top_k": top_k,
                "query_vector": query_embedding,
            },
        )
        records = await result.data()

    results = [
        {
            "code": r["code"],
            "title": r["title"],
            "issuing_agency": r["issuing_agency"],
            "jurisdiction_code": r["jurisdiction_code"],
            "similarity": round(r["score"], 4),
        }
        for r in records
    ]

    # Post-filter by jurisdiction if specified
    if jurisdiction:
        results = [r for r in results if r["jurisdiction_code"] == jurisdiction]

    return results


async def hybrid_retrieve(
    driver,
    hazard_code: str,
    location: str | None = None,
    jurisdiction: str | None = None,
    top_k: int = 5,
) -> dict[str, Any]:
    """Hybrid retrieval: Graph traversal + Vector search.

    1. First tries graph traversal (Location-aware, jurisdiction-scoped)
    2. Falls back to vector search if no results (jurisdiction post-filtered)

    Returns:
        {
            "laws": [...],
            "agencies": [...],
            "method": "graph" | "vector" | "hybrid",
            "vector_matches": [...] (if vector search was used)
        }
    """
    from neo4j_client import query_hazard_laws_and_agencies

    # Step 1: Graph traversal (symbolic)
    try:
        graph_result = await query_hazard_laws_and_agencies(
            hazard_code, location, jurisdiction
        )
    except Exception as exc:
        logger.warning("Graph traversal failed, falling back to vector: %s", exc)
        graph_result = {"laws": [], "agencies": []}

    if graph_result["laws"]:
        # Graph traversal found results — use them (highest confidence)
        return {
            "laws": graph_result["laws"],
            "agencies": graph_result["agencies"],
            "method": "graph",
            "vector_matches": [],
        }

    # Step 2: Vector search fallback (neural)
    logger.info(
        "No graph results for %s (jurisdiction=%s), trying vector search",
        hazard_code, jurisdiction,
    )

    # Build a search query from the hazard code
    hazard_name = hazard_code.replace("_", " ")
    jurisdiction_label = "Philippine" if jurisdiction == "PH-NATIONAL" else "Indonesian" if jurisdiction == "ID-NATIONAL" else "environmental"
    search_query = f"{jurisdiction_label} environmental law about {hazard_name}"

    try:
        vector_results = await vector_search_laws(driver, search_query, top_k, jurisdiction)
    except Exception as exc:
        logger.error("Vector search also failed: %s", exc)
        return {
            "laws": [],
            "agencies": [],
            "method": "failed",
            "vector_matches": [],
        }

    if vector_results:
        # Get agencies for vector-matched laws
        agencies = set()
        for vlaw in vector_results:
            try:
                async with driver.session() as session:
                    result = await session.run(
                        """
                        MATCH (l:Law {code: $code})-[:ENFORCED_BY]->(a:Agency)
                        RETURN a.name AS name
                        """,
                        {"code": vlaw["code"]},
                    )
                    records = await result.data()
                    for r in records:
                        agencies.add(r["name"])
            except Exception:
                pass

        return {
            "laws": [v["title"] for v in vector_results],
            "agencies": sorted(agencies),
            "method": "vector",
            "vector_matches": vector_results,
        }

    return {
        "laws": [],
        "agencies": [],
        "method": "none",
        "vector_matches": [],
    }
