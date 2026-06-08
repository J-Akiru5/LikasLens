"""
ASEAN Expansion — Gremlin Graph Seed Data
===========================================
Placeholder environmental laws, enforcement agencies, and jurisdiction-law
edge connections for the five new ASEAN member countries beyond the Philippines.

**Jurisdiction vertices** already exist in `baseline_rules.BASELINE_JURISDICTIONS`:
  - jur-id-national  (ID-NATIONAL)
  - jur-th-national  (TH-NATIONAL)
  - jur-vn-national  (VN-NATIONAL)
  - jur-my-national  (MY-NATIONAL)
  - jur-sg-national  (SG-NATIONAL)

This module adds:
  1. One anchor environmental law per country
  2. One enforcement agency / NGO per country
  3. ``governed_by`` edges:  Law → Jurisdiction
  4. ``enforced_by`` edges:  Law → NGO
  5. ``violates`` edges:     existing ASEAN hazards → new ASEAN laws

Usage:
    python gremlin_upserts/asean_expansion.py               # Upsert to live Cosmos Gremlin
    python gremlin_upserts/asean_expansion.py --dry-run     # Print queries only
    python gremlin_upserts/asean_expansion.py --gremlin     # Print raw Gremlin queries
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from datetime import UTC, datetime
from typing import Any

# Allow running directly from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from gremlin_bootstrap import build_edge_upsert_query, build_vertex_upsert_query

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("asean-expansion")

# ── Reference: existing jurisdiction vertex IDs (already upserted) ──────
_JURISDICTION_BY_COUNTRY = {
    "ID": {"id": "jur-id-national", "code": "ID-NATIONAL"},
    "TH": {"id": "jur-th-national", "code": "TH-NATIONAL"},
    "VN": {"id": "jur-vn-national", "code": "VN-NATIONAL"},
    "MY": {"id": "jur-my-national", "code": "MY-NATIONAL"},
    "SG": {"id": "jur-sg-national", "code": "SG-NATIONAL"},
}

# ── ASEAN Placeholder Environmental Laws ─────────────────────────────────

ASEAN_LAWS: list[dict[str, Any]] = [
    {
        "id": "law-id-uu32",
        "code": "UU-32/2009",
        "title": "UU No. 32/2009 — Environmental Protection and Management",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
        "country": "ID",
        "status": "active",
    },
    {
        "id": "law-th-be2535",
        "code": "BE-2535",
        "title": "Environmental Protection Act, BE 2535",
        "issuing_agency": "DPC",
        "jurisdictionCode": "TH-NATIONAL",
        "country": "TH",
        "status": "active",
    },
    {
        "id": "law-vn-lep2020",
        "code": "LEP-2020",
        "title": "Law on Environmental Protection 2020",
        "issuing_agency": "MONRE",
        "jurisdictionCode": "VN-NATIONAL",
        "country": "VN",
        "status": "active",
    },
    {
        "id": "law-my-eqa1974",
        "code": "EQA-1974",
        "title": "Environmental Quality Act 1974",
        "issuing_agency": "DOE",
        "jurisdictionCode": "MY-NATIONAL",
        "country": "MY",
        "status": "active",
    },
    {
        "id": "law-sg-epma",
        "code": "EPMA",
        "title": "Environmental Protection and Management Act",
        "issuing_agency": "NEA",
        "jurisdictionCode": "SG-NATIONAL",
        "country": "SG",
        "status": "active",
    },
]

# ── ASEAN Enforcement Agencies / NGOs ────────────────────────────────────

ASEAN_AGENCIES: list[dict[str, Any]] = [
    {
        "id": "agency-id-klhk",
        "name": "KLHK — Ministry of Environment and Forestry",
        "focus": "environmental-protection",
        "country": "ID",
        "region": "National",
    },
    {
        "id": "agency-th-dpc",
        "name": "DPC — Department of Pollution Control",
        "focus": "pollution-control",
        "country": "TH",
        "region": "National",
    },
    {
        "id": "agency-vn-monre",
        "name": "MONRE — Ministry of Natural Resources and Environment",
        "focus": "environmental-protection",
        "country": "VN",
        "region": "National",
    },
    {
        "id": "agency-my-doe",
        "name": "DOE — Department of Environment",
        "focus": "environmental-protection",
        "country": "MY",
        "region": "National",
    },
    {
        "id": "agency-sg-nea",
        "name": "NEA — National Environment Agency",
        "focus": "environmental-protection",
        "country": "SG",
        "region": "National",
    },
]

# ── Edge definitions ─────────────────────────────────────────────────────
# Format: (from_id, to_id, label)

# Law  ──governed_by──→  Jurisdiction
LAW_JURISDICTION_EDGES: list[tuple[str, str]] = [
    ("law-id-uu32", "jur-id-national"),
    ("law-th-be2535", "jur-th-national"),
    ("law-vn-lep2020", "jur-vn-national"),
    ("law-my-eqa1974", "jur-my-national"),
    ("law-sg-epma", "jur-sg-national"),
]

# Law  ──enforced_by──→  Agency/NGO
LAW_AGENCY_EDGES: list[tuple[str, str]] = [
    ("law-id-uu32", "agency-id-klhk"),
    ("law-th-be2535", "agency-th-dpc"),
    ("law-vn-lep2020", "agency-vn-monre"),
    ("law-my-eqa1974", "agency-my-doe"),
    ("law-sg-epma", "agency-sg-nea"),
]

# Existing ASEAN hazards rerouted from PH laws → ASEAN laws
# (instead of pointing at PH law equivalents)
ASEAN_HAZARD_LAW_EDGES: list[tuple[str, str]] = [
    ("peatland_fire", "law-id-uu32"),
    ("transboundary_haze", "law-id-uu32"),
    ("rubber_plantation_encroachment", "law-th-be2535"),
    ("mangrove_conversion_aquaculture", "law-vn-lep2020"),
    ("sand_dredging", "law-vn-lep2020"),
    ("hydropower_displacement", "law-vn-lep2020"),
]

# ── Query builders ───────────────────────────────────────────────────────

def _build_asean_vertices() -> list[dict[str, Any]]:
    now = datetime.now(UTC).isoformat()
    vertices: list[dict[str, Any]] = []

    for law in ASEAN_LAWS:
        vertices.append({
            "id": law["id"],
            "label": "Law",
            "props": {
                "code": law["code"],
                "title": law["title"],
                "name": law["title"],
                "issuing_agency": law["issuing_agency"],
                "jurisdictionCode": law["jurisdictionCode"],
                "country": law["country"],
                "status": law["status"],
                "createdAt": now,
                "source": "asean-expansion",
                "isActive": True,
            },
        })

    for agency in ASEAN_AGENCIES:
        vertices.append({
            "id": agency["id"],
            "label": "NGO",
            "props": {
                "name": agency["name"],
                "focus": agency["focus"],
                "country": agency["country"],
                "region": agency["region"],
                "createdAt": now,
                "source": "asean-expansion",
                "isActive": True,
            },
        })

    return vertices


def _build_asean_edges() -> list[dict[str, Any]]:
    now = datetime.now(UTC).isoformat()
    edges: list[dict[str, Any]] = []

    for law_id, jurisdiction_id in LAW_JURISDICTION_EDGES:
        edges.append({
            "from": law_id,
            "to": jurisdiction_id,
            "label": "governed_by",
            "props": {
                "source": "asean-expansion",
                "createdAt": now,
            },
        })

    for law_id, agency_id in LAW_AGENCY_EDGES:
        edges.append({
            "from": law_id,
            "to": agency_id,
            "label": "enforced_by",
            "props": {
                "source": "asean-expansion",
                "createdAt": now,
            },
        })

    for hazard_id, law_id in ASEAN_HAZARD_LAW_EDGES:
        edges.append({
            "from": hazard_id,
            "to": law_id,
            "label": "violates",
            "props": {
                "confidence": 0.85,
                "source": "asean-expansion",
                "createdAt": now,
            },
        })

    return edges


def build_asean_vertex_queries() -> list[str]:
    vertices = _build_asean_vertices()
    return [
        build_vertex_upsert_query(v["id"], v["label"], v.get("props", {}))
        for v in vertices
    ]


def build_asean_edge_queries() -> list[str]:
    edges = _build_asean_edges()
    return [
        build_edge_upsert_query(e["from"], e["to"], e["label"], e.get("props", {}))
        for e in edges
    ]


# ── Standalone execution ─────────────────────────────────────────────────

def print_gremlin() -> None:
    """Print raw Gremlin upsert queries for copy-paste use."""
    print("// === ASEAN JURISDICTION VERTEX UPSERTS (idempotent) ===")
    for code, jur in _JURISDICTION_BY_COUNTRY.items():
        name_map = {"ID": "Indonesia", "TH": "Thailand", "VN": "Vietnam", "MY": "Malaysia", "SG": "Singapore"}
        query = (
            f"g.V('{jur['id']}').fold()"
            f".coalesce(unfold(),"
            f" addV('Jurisdiction')"
            f".property('id','{jur['id']}')"
            f".property('code','{jur['code']}')"
            f".property('name','{name_map[code]} (National)')"
            f".property('level','national')"
            f".property('country','{code}')"
            f".property('createdAt','{datetime.now(UTC).isoformat()}')"
            f".property('source','asean-expansion')"
            f".property('isActive',true)"
            f")"
        )
        print(f"\n{query}")

    print("\n\n// === ASEAN LAW VERTEX UPSERTS ===")
    v_queries = build_asean_vertex_queries()
    for q in v_queries:
        print(f"\n{q}")

    print("\n\n// === ASEAN EDGE UPSERTS ===")
    e_queries = build_asean_edge_queries()
    for q in e_queries:
        print(f"\n{q}")


async def seed_asean() -> None:
    """Execute ASEAN expansion upserts against live Cosmos Gremlin."""
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from dotenv import load_dotenv
    load_dotenv()

    from gremlin_client import get_client, is_configured

    if not is_configured():
        logger.error(
            "Cosmos Gremlin not configured. "
            "Set COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY"
        )
        return

    client = get_client()
    vertex_queries = build_asean_vertex_queries()
    edge_queries = build_asean_edge_queries()
    total = len(vertex_queries) + len(edge_queries)

    logger.info(
        "Seeding ASEAN expansion: %d laws + %d agencies (%d total)",
        len(ASEAN_LAWS), len(ASEAN_AGENCIES), total,
    )

    ok, fail = 0, 0

    for i, q in enumerate(vertex_queries, 1):
        try:
            list(client.submit(q))
            ok += 1
        except Exception as exc:
            fail += 1
            logger.warning("  Vertex %d failed: %s", i, exc)

    for i, q in enumerate(edge_queries, 1):
        try:
            list(client.submit(q))
            ok += 1
        except Exception as exc:
            fail += 1
            logger.warning("  Edge %d failed: %s", i, exc)

    logger.info("ASEAN seeding done: %d ok, %d errors", ok, fail)

    # Verify
    try:
        for label in ["Law", "Jurisdiction", "NGO"]:
            count_q = f"g.V().hasLabel('{label}').count()"
            count = list(client.submit(count_q))
            logger.info("  %s vertices: %s", label, count[0] if count else 0)

        count_q = "g.E().hasLabel('governed_by').count()"
        count = list(client.submit(count_q))
        logger.info("  governed_by edges: %s", count[0] if count else 0)
    except Exception as exc:
        logger.warning("Verification failed: %s", exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="ASEAN Gremlin graph expansion")
    parser.add_argument("--dry-run", action="store_true", help="Print queries without executing")
    parser.add_argument("--gremlin", action="store_true", help="Print raw Gremlin query strings")
    args = parser.parse_args()

    if args.gremlin:
        print_gremlin()
        return

    if args.dry_run:
        print("=== ASEAM Vertex Upserts ===\n")
        for q in build_asean_vertex_queries():
            print(q)
        print("\n=== AS EAN Edge Upserts ===\n")
        for q in build_asean_edge_queries():
            print(q)
        return

    asyncio.run(seed_asean())


if __name__ == "__main__":
    main()
