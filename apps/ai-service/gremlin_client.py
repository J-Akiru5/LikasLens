"""
Gremlin client module for Cosmos DB live routing in LikasLens.
Provides connection management and graph traversal helpers.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from gremlin_python.driver import client as gremlin_client
from gremlin_python.driver.serializer import GraphSONSerializersV3d0

logger = logging.getLogger(__name__)

_client: gremlin_client.Client | None = None


def get_connection_params() -> dict[str, str]:
    """Read Gremlin connection parameters from environment."""
    return {
        "endpoint": os.getenv("COSMOS_GREMLIN_ENDPOINT", ""),
        "key": os.getenv("COSMOS_GREMLIN_KEY", ""),
        "database": os.getenv("COSMOS_GREMLIN_DATABASE", "likaslens"),
        "graph": os.getenv("COSMOS_GREMLIN_GRAPH", "routing_graph"),
    }


def is_configured() -> bool:
    """Check if Cosmos Gremlin environment variables are set."""
    params = get_connection_params()
    return bool(params["endpoint"] and params["key"])


def get_client() -> gremlin_client.Client:
    """Get or create a Gremlin client connection to Cosmos DB."""
    global _client
    if _client is not None:
        return _client

    params = get_connection_params()
    if not params["endpoint"] or not params["key"]:
        raise RuntimeError(
            "Cosmos Gremlin not configured. "
            "Set COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY env vars."
        )

    _client = gremlin_client.Client(
        params["endpoint"],
        "g",
        username=f"/dbs/{params['database']}/colls/{params['graph']}",
        password=params["key"],
        message_serializer=GraphSONSerializersV3d0(),
    )
    logger.info("Connected to Cosmos Gremlin: %s/%s", params["database"], params["graph"])
    return _client


async def submit_query(query: str, bindings: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Submit a Gremlin query and return results."""
    client = get_client()
    result_set = client.submit(query, bindings or {})
    results = []
    for result in result_set:
        results.append(result)
    return results


def build_incident_routing_traversal(
    citizen_id: str,
    incident_id: str,
    violation_code: str,
    ngo_id: str | None = None,
) -> list[str]:
    """Build Gremlin traversal strings for full incident routing.

    Creates:
    1. Citizen vertex
    2. Incident vertex
    3. REPORTED edge: Citizen -> Incident
    4. CLASSIFIED_AS edge: Incident -> ViolationType
    5. ASSIGNED_TO edge: Incident -> NGO (if ngo_id provided)
    """
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    pk = os.getenv("COSMOS_GREMLIN_PARTITION_KEY", "likaslens-routing-seed")

    queries = [
        # Upsert Citizen vertex
        _vertex_upsert("Citizen", citizen_id, {"createdAt": now, "source": "app", "partitionKey": pk}),
        # Upsert Incident vertex
        _vertex_upsert("Incident", incident_id, {"status": "open", "createdAt": now, "source": "app", "partitionKey": pk}),
        # REPORTED edge
        f"g.V('{citizen_id}').as('a').V('{incident_id}').as('b')"
        f".coalesce(__.select('a').outE('REPORTED').where(inV().as('b')),"
        f"__.addE('REPORTED').from('a').to('b').property('createdAt','{now}').property('source','app'))",
        # CLASSIFIED_AS edge
        _match_violation_assignment(incident_id, violation_code, now),
    ]

    if ngo_id:
        queries.append(
            f"g.V('{incident_id}').as('a').V('{ngo_id}').as('b')"
            f".coalesce(__.select('a').outE('ASSIGNED_TO').where(inV().as('b')),"
            f"__.addE('ASSIGNED_TO').from('a').to('b').property('createdAt','{now}').property('source','ai'))"
        )

    return queries


def _vertex_upsert(label: str, vid: str, props: dict[str, Any]) -> str:
    prop_chain = "".join(f".property('{k}','{v}')" for k, v in props.items())
    return f"g.V('{vid}').fold().coalesce(unfold(),addV('{label}').property('id','{vid}'){prop_chain})"


def _match_violation_assignment(incident_id: str, violation_code: str, timestamp: str) -> str:
    return (
        f"g.V('{incident_id}').as('a')"
        f".V().hasLabel('ViolationType').has('code','{violation_code}').as('b')"
        f".coalesce(__.select('a').outE('CLASSIFIED_AS').where(inV().as('b')),"
        f"__.addE('CLASSIFIED_AS').from('a').to('b')"
        f".property('createdAt','{timestamp}').property('source','ai').property('confidence','0.85'))"
    )


async def route_incident(
    citizen_id: str,
    incident_id: str,
    violation_code: str,
    ngo_id: str | None = None,
) -> dict[str, Any]:
    """Execute a full incident routing transaction."""
    if not is_configured():
        return {
            "success": False,
            "reason": "Cosmos Gremlin not configured",
            "traversal": build_incident_routing_traversal(citizen_id, incident_id, violation_code, ngo_id),
        }

    queries = build_incident_routing_traversal(citizen_id, incident_id, violation_code, ngo_id)
    results = []
    for query in queries:
        result = await submit_query(query)
        results.append(result)

    return {"success": True, "queries_executed": len(results), "results": results}
