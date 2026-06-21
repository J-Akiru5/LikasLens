"""
Gremlin client module for Cosmos DB live routing in LikasLens.
Provides connection management and graph traversal helpers.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Any

from gremlin_python.driver import client as gremlin_client
from gremlin_python.driver.serializer import GraphSONSerializersV3d0

logger = logging.getLogger(__name__)

_client: gremlin_client.Client | None = None
GREMLIN_TIMEOUT_SECONDS = 30
MAX_RETRIES = 2

_SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_\-:.@]+$")


def _sanitize_id(value: str, field_name: str = "id") -> str:
    """Validate and sanitize an ID to prevent Gremlin injection."""
    if not value or not _SAFE_ID_RE.match(value):
        raise ValueError(
            f"Invalid {field_name}: must contain only alphanumeric, hyphens, "
            f"underscores, dots, colons, or @ symbols"
        )
    return value


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


def _create_client() -> gremlin_client.Client:
    """Create a new Gremlin client connection."""
    params = get_connection_params()
    if not params["endpoint"] or not params["key"]:
        raise RuntimeError(
            "Cosmos Gremlin not configured. "
            "Set COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY env vars."
        )

    return gremlin_client.Client(
        params["endpoint"],
        "g",
        username=f"/dbs/{params['database']}/colls/{params['graph']}",
        password=params["key"],
        message_serializer=GraphSONSerializersV3d0(),
    )


def get_client() -> gremlin_client.Client:
    """Get or create a Gremlin client connection to Cosmos DB."""
    global _client
    if _client is not None:
        return _client

    _client = _create_client()
    params = get_connection_params()
    logger.info("Connected to Cosmos Gremlin: %s/%s", params["database"], params["graph"])
    return _client


def reset_client() -> None:
    """Close and reset the cached Gremlin client (for reconnection)."""
    global _client
    if _client is not None:
        try:
            _client.close()
        except Exception as exc:
            logger.warning("Error closing Gremlin client: %s", exc)
        _client = None


def _submit_sync(client: gremlin_client.Client, query: str, bindings: dict[str, Any]) -> list:
    """Submit a Gremlin query synchronously with timeout."""
    result_set = client.submit(query, bindings or {})
    return list(result_set)


async def submit_query(query: str, bindings: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Submit a Gremlin query with timeout and retry on stale connection."""
    global _client
    last_exc: Exception | None = None

    for attempt in range(MAX_RETRIES + 1):
        client = get_client()
        try:
            results = await asyncio.wait_for(
                asyncio.to_thread(_submit_sync, client, query, bindings or {}),
                timeout=GREMLIN_TIMEOUT_SECONDS,
            )
            return results
        except (OSError, ConnectionError, BrokenPipeError) as exc:
            logger.warning("Gremlin connection error (attempt %d/%d): %s", attempt + 1, MAX_RETRIES + 1, exc)
            last_exc = exc
            reset_client()
            if attempt < MAX_RETRIES:
                continue
        except asyncio.TimeoutError:
            logger.error("Gremlin query timed out after %ds", GREMLIN_TIMEOUT_SECONDS)
            raise RuntimeError(f"Gremlin query timed out after {GREMLIN_TIMEOUT_SECONDS}s")
        except Exception as exc:
            logger.error("Gremlin query failed: %s", exc)
            raise

    raise RuntimeError(f"Gremlin query failed after {MAX_RETRIES + 1} attempts: {last_exc}")


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

    safe_citizen = _sanitize_id(citizen_id, "citizen_id")
    safe_incident = _sanitize_id(incident_id, "incident_id")
    safe_violation = _sanitize_id(violation_code, "violation_code")

    queries = [
        _vertex_upsert("Citizen", safe_citizen, {"createdAt": now, "source": "app", "partitionKey": pk}),
        _vertex_upsert("Incident", safe_incident, {"status": "open", "createdAt": now, "source": "app", "partitionKey": pk}),
        _edge_upsert("REPORTED", safe_citizen, safe_incident, now, "app"),
        _match_violation_assignment(safe_incident, safe_violation, now),
    ]

    if ngo_id:
        safe_ngo = _sanitize_id(ngo_id, "ngo_id")
        queries.append(_edge_upsert("ASSIGNED_TO", safe_incident, safe_ngo, now, "ai"))

    return queries


def _escape_gremlin_string(value: str) -> str:
    """Escape a string value for safe inclusion in Gremlin queries."""
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _vertex_upsert(label: str, vid: str, props: dict[str, Any]) -> str:
    safe_label = _escape_gremlin_string(label)
    safe_vid = _escape_gremlin_string(vid)
    prop_chain = "".join(
        f".property('{_escape_gremlin_string(k)}','{_escape_gremlin_string(str(v))}')"
        for k, v in props.items()
    )
    return f"g.V('{safe_vid}').fold().coalesce(unfold(),addV('{safe_label}').property('id','{safe_vid}'){prop_chain})"


def _edge_upsert(edge_label: str, from_id: str, to_id: str, timestamp: str, source: str) -> str:
    safe_edge = _escape_gremlin_string(edge_label)
    safe_from = _escape_gremlin_string(from_id)
    safe_to = _escape_gremlin_string(to_id)
    safe_ts = _escape_gremlin_string(timestamp)
    safe_source = _escape_gremlin_string(source)
    return (
        f"g.V('{safe_from}').as('a').V('{safe_to}').as('b')"
        f".coalesce(__.select('a').outE('{safe_edge}').where(inV().as('b')),"
        f"__.addE('{safe_edge}').from('a').to('b')"
        f".property('createdAt','{safe_ts}').property('source','{safe_source}'))"
    )


def _match_violation_assignment(incident_id: str, violation_code: str, timestamp: str) -> str:
    safe_incident = _escape_gremlin_string(incident_id)
    safe_violation = _escape_gremlin_string(violation_code)
    safe_ts = _escape_gremlin_string(timestamp)
    return (
        f"g.V('{safe_incident}').as('a')"
        f".V().hasLabel('ViolationType').has('code','{safe_violation}').as('b')"
        f".coalesce(__.select('a').outE('CLASSIFIED_AS').where(inV().as('b')),"
        f"__.addE('CLASSIFIED_AS').from('a').to('b')"
        f".property('createdAt','{safe_ts}').property('source','ai').property('confidence','0.85'))"
    )


async def route_incident(
    citizen_id: str,
    incident_id: str,
    violation_code: str,
    ngo_id: str | None = None,
) -> dict[str, Any]:
    """Execute a full incident routing transaction.

    Checks the routing learner for historically fast LGUs for this violation
    type. If learned data exists and no explicit ngo_id was provided, uses the
    best-performing LGU. Otherwise falls back to the default graph routing.
    """
    if not is_configured():
        return {
            "success": False,
            "reason": "Cosmos Gremlin not configured",
            "traversal": build_incident_routing_traversal(citizen_id, incident_id, violation_code, ngo_id),
        }

    routing_method = "default"
    learned_lgu = None

    # If no ngo_id was explicitly provided, check the routing learner
    if not ngo_id:
        try:
            from routing_learner import get_best_lgu, has_data

            if has_data(violation_code):
                best = get_best_lgu(violation_code)
                if best:
                    ngo_id = best
                    learned_lgu = best
                    routing_method = "learned"
                    logger.info(
                        "Routing learner selected LGU '%s' for violation '%s'",
                        best,
                        violation_code,
                    )
        except Exception as exc:
            logger.warning("Routing learner lookup failed, using default: %s", exc)

    try:
        queries = build_incident_routing_traversal(citizen_id, incident_id, violation_code, ngo_id)
    except ValueError as exc:
        return {"success": False, "reason": str(exc)}

    results = []
    for query in queries:
        result = await submit_query(query)
        results.append(result)

    return {
        "success": True,
        "queries_executed": len(results),
        "results": results,
        "routing_method": routing_method,
        "learned_lgu": learned_lgu,
    }
