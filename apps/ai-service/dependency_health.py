"""
Reachability probes for /health/config.

Configuration presence is not the same as health. The service used to report
`neo4j: {"status": "configured"}` purely because an environment variable was
set, while the host had not resolved for weeks. Reporting that as "configured"
reads like "healthy".

Neo4j is gone. The knowledge store is now Postgres + pgvector, inside the same
database the service already depends on. This probe reports whether that database
answers, and whether the vector extension and law embeddings are actually
present — the parts that can silently be missing.

Nothing in a probe result contains a hostname, DSN, username or password. Reasons
come from a small fixed set of strings.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from sqlalchemy import text

logger = logging.getLogger(__name__)

# Overall budget a single health request may spend waiting on the probe. This is
# generous enough for a cold connection to the Supabase pooler (the first probe
# pays connection setup, later ones reuse the pool), while the result is cached
# for CACHE_TTL_SECONDS so the steady-state endpoint does no I/O.
PROBE_TIMEOUT_SECONDS = 4.0
# How long a result is reused before probing again.
CACHE_TTL_SECONDS = 30.0

_cache: dict[str, Any] | None = None
_cache_at: float = 0.0


def _reset_cache() -> None:
    """Clear the cached probe result (used by tests)."""
    global _cache, _cache_at
    _cache = None
    _cache_at = 0.0


def _classify(exc: BaseException) -> str:
    """Map a database exception to a fixed, non-leaking reason string."""
    name = type(exc).__name__.lower()
    message = str(exc).lower()

    if "timeout" in name or "timeout" in message:
        return "timeout"
    if "refused" in message:
        return "connection_refused"
    if "password" in message or "authentication" in message or "role" in message:
        return "auth_failed"
    if "does not exist" in message or "undefined" in message:
        return "schema_missing"
    if "connect" in message or "network" in message or "dns" in message:
        return "unreachable"
    return "probe_error"


async def _probe_database() -> dict[str, Any]:
    """Check the database answers, pgvector is installed, and embeddings exist."""
    from db.connection import AsyncSessionLocal

    if AsyncSessionLocal is None:
        return {"reachable": False, "reason": "not_configured", "vector_ready": False}

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("select 1"))

            vector_ready = bool(
                (
                    await session.execute(
                        text("select count(*) from pg_extension where extname = 'vector'")
                    )
                ).scalar()
            )

            embedded = 0
            if vector_ready:
                embedded = int(
                    (
                        await session.execute(
                            text(
                                "select count(*) from public.environmental_laws_ph "
                                "where embedding is not null and deleted_at is null"
                            )
                        )
                    ).scalar()
                    or 0
                )

        return {
            "reachable": True,
            "reason": "reachable",
            "vector_ready": vector_ready,
            "embedded_laws": embedded,
        }
    except Exception as exc:
        logger.warning("Knowledge store probe failed (%s)", type(exc).__name__)
        return {"reachable": False, "reason": _classify(exc), "vector_ready": False}


async def check_knowledge_store(force: bool = False) -> dict[str, Any]:
    """Return a cached knowledge-store probe.

    An uncached call spends at most PROBE_TIMEOUT_SECONDS. The result is then
    cached for CACHE_TTL_SECONDS, so the steady-state endpoint performs no
    database I/O of its own.
    """
    global _cache, _cache_at

    now = time.monotonic()
    if not force and _cache is not None and (now - _cache_at) < CACHE_TTL_SECONDS:
        return dict(_cache)

    try:
        result = await asyncio.wait_for(_probe_database(), timeout=PROBE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        result = {"reachable": False, "reason": "timeout", "vector_ready": False}
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Knowledge store probe failed unexpectedly (%s)", type(exc).__name__)
        result = {"reachable": False, "reason": "probe_error", "vector_ready": False}

    _cache = result
    _cache_at = now
    logger.info("Knowledge store probe: %s", result["reason"])
    return dict(result)
