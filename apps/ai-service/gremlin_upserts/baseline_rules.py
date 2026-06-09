"""
Baseline rule upserts for Cosmos DB Gremlin.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from gremlin_bootstrap import build_vertex_upsert_query

BASELINE_LAWS: list[dict[str, Any]] = [
    {
        "id": "law-ra-9003",
        "code": "RA-9003",
        "title": "Ecological Solid Waste Management Act of 2000",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-8749",
        "code": "RA-8749",
        "title": "Philippine Clean Air Act of 1999",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
]

BASELINE_NGOS: list[dict[str, Any]] = [
    {
        "id": "ngo-green-dingle-initiative",
        "name": "Green Dingle Initiative",
        "focus": "solid-waste",
        "country": "PH",
    },
    {
        "id": "ngo-bantay-kalikasan",
        "name": "Bantay Kalikasan",
        "focus": "environmental-protection",
        "country": "PH",
    },
]

BASELINE_JURISDICTIONS: list[dict[str, Any]] = [
    {
        "id": "jur-ph-national",
        "code": "PH-NATIONAL",
        "name": "Philippines (National)",
        "level": "national",
        "country": "PH",
    },
    {
        "id": "jur-ph-negros-occidental",
        "code": "PH-NGOCC",
        "name": "Negros Occidental",
        "level": "province",
        "country": "PH",
    },
]


def _build_vertices() -> list[dict[str, Any]]:
    now = datetime.now(UTC).isoformat()
    vertices: list[dict[str, Any]] = []

    for law in BASELINE_LAWS:
        vertices.append(
            {
                "id": law["id"],
                "label": "Law",
                "props": {
                    "code": law["code"],
                    "title": law["title"],
                    "jurisdictionCode": law["jurisdictionCode"],
                    "status": law["status"],
                    "createdAt": now,
                    "source": "migration",
                    "isActive": True,
                },
            }
        )

    for ngo in BASELINE_NGOS:
        vertices.append(
            {
                "id": ngo["id"],
                "label": "NGO",
                "props": {
                    "name": ngo["name"],
                    "focus": ngo["focus"],
                    "country": ngo["country"],
                    "createdAt": now,
                    "source": "migration",
                    "isActive": True,
                },
            }
        )

    for jurisdiction in BASELINE_JURISDICTIONS:
        vertices.append(
            {
                "id": jurisdiction["id"],
                "label": "Jurisdiction",
                "props": {
                    "code": jurisdiction["code"],
                    "name": jurisdiction["name"],
                    "level": jurisdiction["level"],
                    "country": jurisdiction["country"],
                    "createdAt": now,
                    "source": "migration",
                    "isActive": True,
                },
            }
        )

    return vertices


def build_baseline_rule_queries() -> list[str]:
    vertices = _build_vertices()
    return [
        build_vertex_upsert_query(v["id"], v["label"], v.get("props", {}))
        for v in vertices
    ]
