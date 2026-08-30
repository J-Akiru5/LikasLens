"""
Neo4j client module for LikasLens graph database.
Replaces the former Cosmos DB Gremlin client.
Provides connection management, Cypher query execution, and incident routing.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Any

from neo4j import AsyncGraphDatabase, AsyncDriver

from config import settings

logger = logging.getLogger(__name__)

_driver: AsyncDriver | None = None
NEO4J_TIMEOUT_SECONDS = 30
MAX_RETRIES = 2

_SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_\-:.@]+$")


def _sanitize_id(value: str, field_name: str = "id") -> str:
    """Validate and sanitize an ID to prevent injection."""
    if not value or not _SAFE_ID_RE.match(value):
        raise ValueError(
            f"Invalid {field_name}: must contain only alphanumeric, hyphens, "
            f"underscores, dots, colons, or @ symbols"
        )
    return value


def get_connection_params() -> dict[str, str]:
    """Read Neo4j connection parameters from environment."""
    return {
        "uri": settings.neo4j_uri,
        "user": settings.neo4j_user,
        "password": settings.neo4j_password,
    }


def is_configured() -> bool:
    """Check if Neo4j environment variables are set."""
    params = get_connection_params()
    return bool(params["uri"] and params["user"] and params["password"])


async def get_driver() -> AsyncDriver:
    """Get or create a Neo4j async driver."""
    global _driver
    if _driver is not None:
        return _driver

    params = get_connection_params()
    if not params["uri"] or not params["user"] or not params["password"]:
        raise RuntimeError(
            "Neo4j not configured. "
            "Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD env vars."
        )

    _driver = AsyncGraphDatabase.driver(
        params["uri"],
        auth=(params["user"], params["password"]),
        connection_timeout=NEO4J_TIMEOUT_SECONDS,
    )
    logger.info("Connected to Neo4j: %s", params["uri"])
    return _driver


async def reset_driver() -> None:
    """Close and reset the cached driver (for reconnection)."""
    global _driver
    if _driver is not None:
        try:
            await _driver.close()
        except Exception as exc:
            logger.warning("Error closing Neo4j driver: %s", exc)
        _driver = None


async def execute_query(
    query: str,
    parameters: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Execute a Cypher query with timeout and retry."""
    global _driver
    last_exc: Exception | None = None

    for attempt in range(MAX_RETRIES + 1):
        driver = await get_driver()
        try:
            async with driver.session() as session:
                result = await asyncio.wait_for(
                    session.run(query, parameters or {}),
                    timeout=NEO4J_TIMEOUT_SECONDS,
                )
                records = await asyncio.wait_for(
                    result.data(),
                    timeout=NEO4J_TIMEOUT_SECONDS,
                )
                return records
        except (OSError, ConnectionError, BrokenPipeError) as exc:
            logger.warning(
                "Neo4j connection error (attempt %d/%d): %s",
                attempt + 1, MAX_RETRIES + 1, exc,
            )
            last_exc = exc
            await reset_driver()
            if attempt < MAX_RETRIES:
                continue
        except asyncio.TimeoutError:
            logger.error("Neo4j query timed out after %ds", NEO4J_TIMEOUT_SECONDS)
            raise RuntimeError(f"Neo4j query timed out after {NEO4J_TIMEOUT_SECONDS}s")
        except Exception as exc:
            logger.error("Neo4j query failed: %s", exc)
            raise

    raise RuntimeError(f"Neo4j query failed after {MAX_RETRIES + 1} attempts: {last_exc}")


# ---------------------------------------------------------------------------
# Hazard law lookup (replaces Gremlin traversal)
# ---------------------------------------------------------------------------

async def query_hazard_laws_and_agencies(
    hazard_code: str,
    location: str | None = None,
    jurisdiction: str | None = None,
) -> dict[str, list[str]]:
    """Find laws violated by a hazard and their enforcing agencies.

    If location is provided, narrows results to laws governing that location.
    If jurisdiction is provided, filters by Law.jurisdictionCode (e.g. "PH-NATIONAL").
    Traversal: HazardType -[:VIOLATES]-> Law <-[:GOVERNED_BY]- Location
               Law -[:ENFORCED_BY]-> Agency
    """
    if not is_configured():
        raise RuntimeError("Neo4j not configured")

    safe_hazard = _sanitize_id(hazard_code, "hazard_code")

    if location and jurisdiction:
        query = """
        MATCH (h:HazardType {code: $hazard_code})-[:VIOLATES]->(l:Law)
        WHERE l.jurisdictionCode = $jurisdiction
          AND exists((l)<-[:GOVERNED_BY](:Location {name: $location}))
        MATCH (l)-[:ENFORCED_BY]->(a:Agency)
        RETURN DISTINCT l.title AS law, a.name AS agency
        """
        params = {"hazard_code": safe_hazard, "location": location, "jurisdiction": jurisdiction}
    elif location:
        query = """
        MATCH (h:HazardType {code: $hazard_code})-[:VIOLATES]->(l:Law)
        WHERE exists((l)<-[:GOVERNED_BY](:Location {name: $location}))
        MATCH (l)-[:ENFORCED_BY]->(a:Agency)
        RETURN DISTINCT l.title AS law, a.name AS agency
        """
        params = {"hazard_code": safe_hazard, "location": location}
    elif jurisdiction:
        query = """
        MATCH (h:HazardType {code: $hazard_code})-[:VIOLATES]->(l:Law)
        WHERE l.jurisdictionCode = $jurisdiction
        MATCH (l)-[:ENFORCED_BY]->(a:Agency)
        RETURN DISTINCT l.title AS law, a.name AS agency
        """
        params = {"hazard_code": safe_hazard, "jurisdiction": jurisdiction}
    else:
        query = """
        MATCH (h:HazardType {code: $hazard_code})-[:VIOLATES]->(l:Law)
        MATCH (l)-[:ENFORCED_BY]->(a:Agency)
        RETURN DISTINCT l.title AS law, a.name AS agency
        """
        params = {"hazard_code": safe_hazard}

    try:
        results = await execute_query(query, params)
    except Exception as exc:
        logger.error("Neo4j query failed for hazard_code=%s: %s", hazard_code, exc)
        raise

    laws: set[str] = set()
    agencies: set[str] = set()

    for record in results:
        law = record.get("law")
        agency = record.get("agency")
        if law:
            laws.add(str(law).strip())
        if agency:
            agencies.add(str(agency).strip())

    return {"laws": sorted(laws), "agencies": sorted(agencies)}


# ---------------------------------------------------------------------------
# Incident routing (replaces Gremlin routing)
# ---------------------------------------------------------------------------

async def route_incident(
    citizen_id: str,
    incident_id: str,
    violation_code: str,
    ngo_id: str | None = None,
) -> dict[str, Any]:
    """Execute a full incident routing transaction in Neo4j.

    Creates Citizen -> Incident -> ViolationType -> NGO graph relationships.
    """
    if not is_configured():
        return {
            "success": False,
            "reason": "Neo4j not configured",
        }

    routing_method = "default"
    learned_lgu = None

    # Check routing learner for historically fast LGUs
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
                        best, violation_code,
                    )
        except Exception as exc:
            logger.warning("Routing learner lookup failed, using default: %s", exc)

    try:
        safe_citizen = _sanitize_id(citizen_id, "citizen_id")
        safe_incident = _sanitize_id(incident_id, "incident_id")
        safe_violation = _sanitize_id(violation_code, "violation_code")
    except ValueError as exc:
        return {"success": False, "reason": str(exc)}

    # Build Cypher queries for incident routing
    queries = [
        # Create/upsert Citizen
        (
            "MERGE (c:Citizen {id: $citizen_id}) "
            "ON CREATE SET c.createdAt = datetime(), c.source = 'app' "
            "RETURN c",
            {"citizen_id": safe_citizen},
        ),
        # Create/upsert Incident
        (
            "MERGE (i:Incident {id: $incident_id}) "
            "ON CREATE SET i.status = 'open', i.createdAt = datetime(), i.source = 'app' "
            "RETURN i",
            {"incident_id": safe_incident},
        ),
        # Create REPORTED edge
        (
            "MATCH (c:Citizen {id: $citizen_id}), (i:Incident {id: $incident_id}) "
            "MERGE (c)-[:REPORTED {createdAt: datetime()}]->(i) "
            "RETURN c, i",
            {"citizen_id": safe_citizen, "incident_id": safe_incident},
        ),
        # Create CLASSIFIED_AS edge, then look up the enforcing agency for
        # this violation via ViolationType <- HazardType -[:VIOLATES]-> Law
        # -[:ENFORCED_BY]-> Agency (no separate query needed — reuses the
        # already-matched ViolationType node).
        (
            "MATCH (i:Incident {id: $incident_id}), (v:ViolationType {code: $violation_code}) "
            "MERGE (i)-[:CLASSIFIED_AS {createdAt: datetime(), source: 'ai', confidence: 0.85}]->(v) "
            "WITH i, v "
            "OPTIONAL MATCH (v)<-[:CLASSIFIED_AS]-(:HazardType)-[:VIOLATES]->(:Law)-[:ENFORCED_BY]->(a:Agency) "
            "RETURN i, v, collect(DISTINCT a.name) AS agencies",
            {"incident_id": safe_incident, "violation_code": safe_violation},
        ),
    ]

    # Add NGO assignment if provided
    if ngo_id:
        safe_ngo = _sanitize_id(ngo_id, "ngo_id")
        queries.append((
            "MATCH (i:Incident {id: $incident_id}), (n:NGO {id: $ngo_id}) "
            "MERGE (i)-[:ASSIGNED_TO {createdAt: datetime(), source: 'ai'}]->(n) "
            "RETURN i, n",
            {"incident_id": safe_incident, "ngo_id": safe_ngo},
        ))

    CLASSIFIED_AS_QUERY_INDEX = 3  # Citizen, Incident, REPORTED, CLASSIFIED_AS

    results = []
    recommended_office = None
    for index, (query, params) in enumerate(queries):
        try:
            result = await execute_query(query, params)
            results.append(result)
            if index == CLASSIFIED_AS_QUERY_INDEX and result:
                agencies = result[0].get("agencies") or []
                recommended_office = next((a for a in agencies if a), None)
        except Exception as exc:
            logger.error("Routing query failed: %s", exc)
            return {
                "success": False,
                "reason": str(exc),
                "queries_executed": len(results),
            }

    return {
        "success": True,
        "queries_executed": len(results),
        "results": results,
        "routing_method": routing_method,
        "learned_lgu": learned_lgu,
        "recommended_office": recommended_office,
    }


async def build_incident_routing_queries(
    citizen_id: str,
    incident_id: str,
    violation_code: str,
    ngo_id: str | None = None,
) -> list[dict[str, Any]]:
    """Build Cypher query descriptions for incident routing (dry-run).

    Returns human-readable query info without executing them.
    """
    safe_citizen = _sanitize_id(citizen_id, "citizen_id")
    safe_incident = _sanitize_id(incident_id, "incident_id")
    safe_violation = _sanitize_id(violation_code, "violation_code")

    queries = [
        {
            "description": "Upsert Citizen node",
            "query": f"MERGE (c:Citizen {{id: '{safe_citizen}'}})",
        },
        {
            "description": "Upsert Incident node",
            "query": f"MERGE (i:Incident {{id: '{safe_incident}'}})",
        },
        {
            "description": "Create REPORTED edge",
            "query": f"MATCH (c:Citizen {{id: '{safe_citizen}'}}), (i:Incident {{id: '{safe_incident}'}}) MERGE (c)-[:REPORTED]->(i)",
        },
        {
            "description": "Create CLASSIFIED_AS edge",
            "query": f"MATCH (i:Incident {{id: '{safe_incident}'}}), (v:ViolationType {{code: '{safe_violation}'}}) MERGE (i)-[:CLASSIFIED_AS]->(v)",
        },
    ]

    if ngo_id:
        safe_ngo = _sanitize_id(ngo_id, "ngo_id")
        queries.append({
            "description": "Create ASSIGNED_TO edge",
            "query": f"MATCH (i:Incident {{id: '{safe_incident}'}}), (n:NGO {{id: '{safe_ngo}'}}) MERGE (i)-[:ASSIGNED_TO]->(n)",
        })

    return queries
