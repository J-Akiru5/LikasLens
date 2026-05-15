"""
Cosmos DB Gremlin topology metadata and bootstrap payloads for LikasLens.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


DEFAULT_PARTITION_KEY = "likaslens-routing-seed"


VERTEX_LABELS = [
    "Citizen",
    "Incident",
    "Law",
    "ViolationType",
    "NGO",
    "Reward",
    "Partner",
    "Jurisdiction",
    "Evidence",
]

EDGE_LABELS = [
    "REPORTED",
    "CLASSIFIED_AS",
    "ASSIGNED_TO",
    "REDEEMED",
    "PROVIDED_BY",
    "HAS_EVIDENCE",
    "RELATED_TO",
]


@dataclass(frozen=True)
class GremlinTopologyConfig:
    """A serializable topology configuration contract for backend consumers."""

    vertex_labels: list[str]
    edge_labels: list[str]
    edge_properties: list[str]
    partition_key: str


def get_topology_config() -> GremlinTopologyConfig:
    """Return the graph topology used by LikasLens across AI and backend services."""
    return GremlinTopologyConfig(
        vertex_labels=VERTEX_LABELS,
        edge_labels=EDGE_LABELS,
        edge_properties=[
            "createdAt",
            "source",
            "confidence",
            "modelName",
            "explanation",
            "isActive",
        ],
        partition_key=DEFAULT_PARTITION_KEY,
    )


def build_seed_vertices() -> list[dict[str, object]]:
    """Return a deterministic baseline set of graph vertices for smoke-testing traversals."""
    now = datetime.now(UTC).isoformat()
    return [
        {
            "id": "seed-citizen-001",
            "label": "Citizen",
            "props": {
                "createdAt": now,
                "source": "system",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
        {
            "id": "seed-incident-001",
            "label": "Incident",
            "props": {
                "status": "open",
                "createdAt": now,
                "source": "system",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
        {
            "id": "seed-violation-001",
            "label": "ViolationType",
            "props": {
                "code": "SWM-ILLEGAL-DUMPING",
                "createdAt": now,
                "source": "system",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
        {
            "id": "seed-ngo-001",
            "label": "NGO",
            "props": {
                "name": "Green Dingle Initiative",
                "createdAt": now,
                "source": "system",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
    ]


def build_seed_edges() -> list[dict[str, object]]:
    """Return deterministic baseline edges between seed vertices."""
    now = datetime.now(UTC).isoformat()
    return [
        {
            "label": "REPORTED",
            "from": "seed-citizen-001",
            "to": "seed-incident-001",
            "props": {
                "createdAt": now,
                "source": "system",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
        {
            "label": "CLASSIFIED_AS",
            "from": "seed-incident-001",
            "to": "seed-violation-001",
            "props": {
                "createdAt": now,
                "source": "ai",
                "confidence": 0.85,
                "modelName": "gemini",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
        {
            "label": "ASSIGNED_TO",
            "from": "seed-incident-001",
            "to": "seed-ngo-001",
            "props": {
                "createdAt": now,
                "source": "analyst",
                "isActive": True,
                "partitionKey": DEFAULT_PARTITION_KEY,
            },
        },
    ]
