"""
Postgres-backed knowledge retrieval for hazards, laws and agencies.

WHY THIS EXISTS
---------------
The service used Neo4j AuraDB for a small, fixed graph: hazard -> law -> agency,
plus a vector index over law embeddings. That instance is gone (the host no
longer resolves), so every graph call failed and `hazard_analyzer` returned no
legal context at all.

The data it was modelling already lives in Postgres:

    violation_types.law_id  ->  environmental_laws_ph
    ngo_groups                  (agencies, with region / province / city)

and the vector half is now pgvector (`environmental_laws_ph.embedding`,
`halfvec(3072)`, HNSW cosine index). So the graph is replaced by joins plus a
cosine search over the same embeddings Gemini already produced.

NOT A LEGAL DETERMINATION
-------------------------
`FOCUS_BY_HAZARD` only decides which volunteer groups are worth *showing*
alongside a hazard. It is not an enforcement claim and it does not assert that an
agency has jurisdiction over a specific report.

The relational data is also incomplete: 9 of the 11 violation types have
`law_id IS NULL`. This module therefore returns what is actually linked and lets
`graph_rag` fall back to vector search, rather than inventing edges.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import text

from db.connection import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Relevance heuristic only - see the module docstring.
# Maps a hazard code to the `ngo_groups.focus_area` values worth surfacing.
FOCUS_BY_HAZARD: dict[str, tuple[str, ...]] = {
    # Modern ViolationType codes (violation_types.code).
    "SWM-ILLEGAL-DUMPING": ("Solid Waste",),
    "OPEN-BURNING": ("Solid Waste",),
    "HAZWASTE-HANDLING": ("Solid Waste",),
    "ILLEGAL-LOGGING": ("Reforestation",),
    "MANGROVE-DESTRUCTION": ("Coastal Cleanup", "Reforestation"),
    "CORAL-REEF-DAMAGE": ("Coastal Cleanup",),
    "MARINE-POLLUTION": ("Coastal Cleanup",),
    "WILDLIFE-TRAFFICKING": ("Wildlife Protection",),
    "PROTECTED-AREA-INTRUSION": ("Wildlife Protection", "Reforestation"),
    # Legacy hazard_id vocabulary still accepted by the hazard endpoint. These
    # have no matching violation_types.code, so the law lookup misses and the
    # pgvector fallback handles them - but the agency hint should still work.
    "ILLEGAL-DUMPING": ("Solid Waste",),
    "SOLID-WASTE": ("Solid Waste",),
    "ILLEGAL-BURNING": ("Solid Waste",),
    "CHEMICAL-SPILL": ("Solid Waste",),
    "DEFORESTATION": ("Reforestation",),
    "WATER-POLLUTION": ("Coastal Cleanup",),
    "SEWAGE-DISCHARGE": ("Coastal Cleanup",),
}

# The graph previously exposed these labels; they remain a stable contract for
# the dashboard, but are now derived from the relational model.
VERTEX_LABELS = [
    "Location",
    "Law",
    "HazardType",
    "ViolationType",
    "Agency",
    "Citizen",
    "Incident",
]
EDGE_LABELS = [
    "GOVERNED_BY",
    "VIOLATES",
    "ENFORCED_BY",
    "CLASSIFIED_AS",
    "REPORTED",
    "ASSIGNED_TO",
]


def normalize_hazard_code(value: str | None) -> str:
    """Accept both modern codes and legacy snake_case labels.

    `illegal_dumping` -> `ILLEGAL-DUMPING`, `SWM-ILLEGAL-DUMPING` unchanged.
    """
    return (value or "").strip().upper().replace("_", "-")


def focus_for_hazard(hazard_code: str | None) -> tuple[str, ...]:
    """Agency focus areas worth surfacing for a hazard. Heuristic, not legal."""
    return FOCUS_BY_HAZARD.get(normalize_hazard_code(hazard_code), ())


def jurisdiction_to_scope(jurisdiction: str | None) -> str | None:
    """Map `PH-NATIONAL` to the stored `national`, and pass through anything else."""
    if not jurisdiction:
        return None
    tail = jurisdiction.split("-")[-1].strip().lower()
    return tail or None


def is_configured() -> bool:
    """The relational store is configured whenever the database layer is."""
    return AsyncSessionLocal is not None


async def reset_driver() -> None:
    """Compatibility shim. There is no driver to reset."""
    return None


async def get_connection_params() -> dict[str, str]:
    """Describe the backend without leaking a DSN or credentials."""
    return {"backend": "postgres", "vector": "pgvector"}


def topology() -> dict[str, Any]:
    """Topology contract consumed by `GET /graph/topology`."""
    return {
        "vertex_labels": VERTEX_LABELS,
        "edge_labels": EDGE_LABELS,
        "edge_properties": ["confidence", "source", "createdAt"],
        "backend": "postgres+pgvector",
    }


async def _rows(sql: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL not set - graph store unavailable")
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(sql), params)
        return [dict(row) for row in result.mappings().all()]


async def _violation(hazard_code: str) -> dict[str, Any] | None:
    """Look up a violation type by code, accepting legacy snake_case."""
    code = normalize_hazard_code(hazard_code)
    if not code:
        return None
    rows = await _rows(
        "select id, code, name, description from public.violation_types "
        "where upper(replace(code, '_', '-')) = :code limit 1",
        {"code": code},
    )
    return rows[0] if rows else None


async def laws_for_hazard(
    hazard_code: str,
    jurisdiction: str | None = None,
) -> list[dict[str, Any]]:
    """Every statute linked to a hazard, with provenance.

    Unions the legacy single `violation_types.law_id` with the richer
    `violation_law_links` table, so a link is never lost while the mapping is
    migrated, and a duplicate code resolves to its primary link.
    """
    violation = await _violation(hazard_code)
    if not violation:
        return []

    rows = await _rows(
        """
        select distinct on (code) code, title, issuing_agency, jurisdiction_scope,
               is_primary, source, review_status, citation_url
        from (
            select l.law_code as code, l.title, l.issuing_agency, l.jurisdiction_scope,
                   true as is_primary, 'existing-law_id' as source,
                   'pending' as review_status, null::text as citation_url,
                   0 as priority
            from public.violation_types v
            join public.environmental_laws_ph l on l.id = v.law_id
            where v.id = :vid
              and l.deleted_at is null and coalesce(l.is_active, true)

            union all

            select l.law_code, l.title, l.issuing_agency, l.jurisdiction_scope,
                   k.is_primary, k.source, k.review_status, k.citation_url,
                   1 as priority
            from public.violation_law_links k
            join public.environmental_laws_ph l on l.id = k.law_id
            where k.violation_type_id = :vid
              and l.deleted_at is null and coalesce(l.is_active, true)
        ) merged
        order by code, is_primary desc, priority desc
        """,
        {"vid": violation["id"]},
    )

    scope = jurisdiction_to_scope(jurisdiction)
    if scope:
        rows = [r for r in rows if (r.get("jurisdiction_scope") or "").lower() == scope]

    return [
        {
            "code": r["code"],
            "title": r["title"],
            "issuing_agency": r["issuing_agency"],
            "is_primary": bool(r["is_primary"]),
            "source": r["source"],
            "review_status": r["review_status"],
            "citation_url": r["citation_url"],
        }
        for r in rows
    ]


async def agencies_for_hazard(
    hazard_code: str,
    location: str | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Agencies worth showing for a hazard, with their location metadata.

    A relevance heuristic, not an enforcement claim - see FOCUS_BY_HAZARD.
    """
    code = normalize_hazard_code(hazard_code)
    sql = """
        select g.name, g.focus_area, g.city_municipality, g.province, g.region
        from public.ngo_groups g
        where coalesce(g.is_active, true) and g.name is not null
    """
    params: dict[str, Any] = {}

    if location:
        sql += """
          and (
            coalesce(g.city_municipality, '') ilike :loc
            or coalesce(g.province, '') ilike :loc
            or coalesce(g.region, '') ilike :loc
          )
        """
        params["loc"] = f"%{location}%"
    else:
        focuses = focus_for_hazard(code)
        if not focuses:
            # No location and no relevance mapping: return nothing rather than
            # dumping every agency in the country.
            return []
        sql += " and coalesce(g.focus_area, '') = any(:focuses)"
        params["focuses"] = list(focuses)

    sql += " order by g.name limit :limit"
    params["limit"] = max(1, min(int(limit), 25))
    return await _rows(sql, params)


async def query_hazard_laws_and_agencies(
    hazard_code: str,
    location: str | None = None,
    jurisdiction: str | None = None,
) -> dict[str, list[str]]:
    """Backwards-compatible summary used by `graph_rag.hybrid_retrieve`."""
    laws = await laws_for_hazard(hazard_code, jurisdiction)
    agencies = await agencies_for_hazard(hazard_code, location)
    return {
        "laws": [law["title"] for law in laws if law.get("title")],
        "agencies": [agency["name"] for agency in agencies if agency.get("name")],
    }


async def list_hazards() -> list[dict[str, Any]]:
    """Every violation type with its linked statutes, for the live graph UI."""
    hazards = await _rows(
        "select id, code, name, description from public.violation_types order by name",
        {},
    )
    rows = await _rows(
        """
        select violation_type_id, code, title, is_primary, review_status, source
        from (
            select v.id as violation_type_id, l.law_code as code, l.title,
                   true as is_primary, 'pending' as review_status,
                   'existing-law_id' as source
            from public.violation_types v
            join public.environmental_laws_ph l on l.id = v.law_id
            where l.deleted_at is null

            union all

            select k.violation_type_id, l.law_code, l.title,
                   k.is_primary, k.review_status, k.source
            from public.violation_law_links k
            join public.environmental_laws_ph l on l.id = k.law_id
            where l.deleted_at is null
        ) merged
        order by code
        """,
        {},
    )

    by_hazard: dict[str, dict[str, dict[str, Any]]] = {}
    for row in rows:
        bucket = by_hazard.setdefault(row["violation_type_id"], {})
        existing = bucket.get(row["code"])
        rank = (bool(row["is_primary"]), row["review_status"] == "verified")
        if existing is None or rank > existing["_rank"]:
            bucket[row["code"]] = {
                "code": row["code"],
                "title": row["title"],
                "is_primary": bool(row["is_primary"]),
                "review_status": row["review_status"],
                "source": row["source"],
                "_rank": rank,
            }

    out: list[dict[str, Any]] = []
    for hazard in hazards:
        laws = list(by_hazard.get(hazard["id"], {}).values())
        for law in laws:
            law.pop("_rank", None)
        laws.sort(key=lambda item: (not item["is_primary"], item["code"]))
        out.append(
            {
                "code": hazard["code"],
                "name": hazard["name"],
                "description": hazard["description"],
                "laws": laws,
                "linked": bool(laws),
            }
        )
    return out


async def knowledge_for_hazard(
    hazard_code: str,
    location: str | None = None,
    jurisdiction: str | None = None,
) -> dict[str, Any]:
    """The live knowledge-base payload for one hazard."""
    violation = await _violation(hazard_code)
    laws = await laws_for_hazard(hazard_code, jurisdiction)
    agencies = await agencies_for_hazard(hazard_code, location)
    return {
        "code": violation["code"] if violation else normalize_hazard_code(hazard_code),
        "name": violation["name"] if violation else None,
        "description": violation["description"] if violation else None,
        "laws": laws,
        "agencies": agencies,
        "method": "relational" if laws else "none",
    }


async def search_laws_by_embedding(
    embedding: list[float],
    top_k: int = 5,
    jurisdiction: str | None = None,
) -> list[dict[str, Any]]:
    """Cosine search over law embeddings using pgvector.

    `embedding` is produced by the caller (Gemini), so this module has no
    dependency on the embedding provider.
    """
    if not embedding:
        return []

    params: dict[str, Any] = {
        "vec": "[" + ",".join(f"{v:.8f}" for v in embedding) + "]",
        "k": max(1, min(int(top_k), 50)),
    }
    sql = """
        select
          l.law_code as code,
          l.title,
          l.issuing_agency,
          l.jurisdiction_scope as jurisdiction_code,
          round((1 - (l.embedding <=> cast(:vec as halfvec)))::numeric, 4) as similarity
        from public.environmental_laws_ph l
        where l.embedding is not null
          and coalesce(l.is_active, true)
          and l.deleted_at is null
    """
    scope = jurisdiction_to_scope(jurisdiction)
    if scope:
        sql += " and lower(coalesce(l.jurisdiction_scope, '')) = :scope"
        params["scope"] = scope
    sql += " order by l.embedding <=> cast(:vec as halfvec) limit :k"

    try:
        rows = await _rows(sql, params)
    except Exception as exc:
        logger.warning("pgvector law search failed: %s", exc)
        return []

    return [
        {
            "code": row["code"],
            "title": row["title"],
            "issuing_agency": row["issuing_agency"],
            "jurisdiction_code": row["jurisdiction_code"],
            "similarity": float(row["similarity"]) if row["similarity"] is not None else 0.0,
        }
        for row in rows
    ]


async def count_embedded_laws() -> int:
    """How many laws have an embedding. Used by health/seed reporting."""
    rows = await _rows(
        "select count(*) as n from public.environmental_laws_ph "
        "where embedding is not null and deleted_at is null",
        {},
    )
    return int(rows[0]["n"]) if rows else 0


async def route_incident(
    citizen_id: str,
    incident_id: str,
    violation_code: str,
    ngo_id: str | None = None,
) -> dict[str, Any]:
    """Record that an incident was routed.

    The old implementation wrote Citizen -> Incident -> ViolationType -> NGO
    edges into Neo4j. Nothing ever read them back: routing decisions come from
    `routing_learner` and `route-to-office`, and the assignment itself is stored in
    `ticket_assignments`. Writing a second, unread copy is what kept a dead
    dependency alive, so this is now an explicit no-op.
    """
    logger.debug(
        "graph route_incident is a no-op (incident=%s violation=%s ngo=%s)",
        incident_id,
        violation_code,
        ngo_id,
    )
    return {
        "success": True,
        "persisted": False,
        "reason": "graph write retired; assignments are stored in ticket_assignments",
    }
