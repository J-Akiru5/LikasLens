"""
Neo4j graph topology metadata and bootstrap payloads for LikasLens.
Replaces the former Cosmos DB Gremlin topology module.
"""

from __future__ import annotations

from dataclasses import dataclass


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


@dataclass(frozen=True)
class GraphTopologyConfig:
    """A serializable topology configuration contract for backend consumers."""

    vertex_labels: list[str]
    edge_labels: list[str]
    edge_properties: list[str]


def get_topology_config() -> GraphTopologyConfig:
    """Return the graph topology used by LikasLens across AI and backend services."""
    return GraphTopologyConfig(
        vertex_labels=VERTEX_LABELS,
        edge_labels=EDGE_LABELS,
        edge_properties=[
            "confidence",
            "source",
            "createdAt",
        ],
    )


def build_seed_vertices() -> list[dict[str, object]]:
    """Return a deterministic baseline set of graph vertices for smoke-testing."""
    return [
        {
            "label": "Location",
            "match": {"name": "Iloilo City"},
            "props": {
                "region": "Western Visayas",
                "country": "PH",
                "description": "Highly urbanized city in Western Visayas, Philippines",
            },
        },
        {
            "label": "Law",
            "match": {"code": "RA-9003"},
            "props": {
                "title": "Ecological Solid Waste Management Act of 2000",
                "issuing_agency": "NSWMC",
                "jurisdictionCode": "PH-NATIONAL",
            },
        },
        {
            "label": "HazardType",
            "match": {"code": "illegal_dumping"},
            "props": {
                "name": "Illegal Dumping",
            },
        },
        {
            "label": "Agency",
            "match": {"id": "ngo-green-dingle-initiative"},
            "props": {
                "name": "Green Dingle Initiative",
                "focus": "solid-waste",
                "country": "PH",
                "region": "Western Visayas",
            },
        },
    ]


def build_seed_edges() -> list[dict[str, object]]:
    """Return deterministic baseline edges between seed vertices."""
    return [
        {
            "from_label": "Location",
            "from_match": {"name": "Iloilo City"},
            "to_label": "Law",
            "to_match": {"code": "RA-9003"},
            "label": "GOVERNED_BY",
            "props": {},
        },
        {
            "from_label": "HazardType",
            "from_match": {"code": "illegal_dumping"},
            "to_label": "Law",
            "to_match": {"code": "RA-9003"},
            "label": "VIOLATES",
            "props": {"confidence": 1.0, "source": "philippine-law"},
        },
        {
            "from_label": "Law",
            "from_match": {"code": "RA-9003"},
            "to_label": "Agency",
            "to_match": {"id": "ngo-green-dingle-initiative"},
            "label": "ENFORCED_BY",
            "props": {"source": "migration"},
        },
    ]
