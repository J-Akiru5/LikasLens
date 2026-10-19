"""
Reachability probes for /health/config.

Configuration presence is not the same as health. A NEO4J_URI can still be set
after its host stops resolving, and reporting that as "configured" reads like
"healthy". These probes are deliberately short, cached, and secret-free so the
health endpoint can say "configured_but_unreachable" plainly without making a
network call on every request.

Nothing in a probe result contains a hostname, URI, username or password.
"""

from __future__ import annotations

import asyncio
import logging
import socket
import time
from typing import Any
from urllib.parse import urlsplit

from config import settings

logger = logging.getLogger(__name__)

# Overall budget a single health request may spend waiting on the probe.
PROBE_TIMEOUT_SECONDS = 0.9
# How long a result is reused before probing again.
CACHE_TTL_SECONDS = 30.0
# Neo4j's default Bolt port when the URI does not specify one.
DEFAULT_NEO4J_PORT = 7687

_cache: dict[str, Any] | None = None
_cache_at: float = 0.0


def _reset_cache() -> None:
    """Clear the cached probe result (used by tests)."""
    global _cache, _cache_at
    _cache = None
    _cache_at = 0.0


def _probe_neo4j_tcp() -> tuple[bool, str]:
    """
    Resolve the configured Neo4j host and open a TCP connection to its port.

    Returns (reachable, reason). `reason` is one of a small fixed set of strings
    — never the host, URI, credentials or raw exception text — so it is safe to
    return to clients and write to logs.
    """
    try:
        parsed = urlsplit(settings.neo4j_uri)
        host = parsed.hostname
        port = parsed.port or DEFAULT_NEO4J_PORT
    except ValueError:
        return False, "invalid_uri"

    if not host:
        return False, "invalid_uri"

    try:
        address_info = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except (socket.gaierror, OSError):
        return False, "dns_failed"

    if not address_info:
        return False, "dns_failed"

    # Trying up to two addresses covers IPv4/IPv6 without spending the whole
    # response budget on a host with many records.
    last_reason = "unreachable"
    for family, socktype, proto, _canonname, sockaddr in address_info[:2]:
        sock = socket.socket(family, socktype, proto)
        sock.settimeout(0.75)
        try:
            sock.connect(sockaddr)
            return True, "reachable"
        except socket.timeout:
            last_reason = "timeout"
        except ConnectionRefusedError:
            last_reason = "connection_refused"
        except OSError:
            last_reason = "connection_failed"
        finally:
            sock.close()

    return False, last_reason


async def check_neo4j_reachability(force: bool = False) -> dict[str, Any]:
    """
    Return a cached Neo4j reachability result as {"reachable": bool, "reason": str}.

    An uncached call spends at most PROBE_TIMEOUT_SECONDS waiting for DNS + TCP
    in a worker thread. The result is then cached for CACHE_TTL_SECONDS, so the
    steady-state endpoint performs no network I/O.
    """
    global _cache, _cache_at

    now = time.monotonic()
    if not force and _cache is not None and (now - _cache_at) < CACHE_TTL_SECONDS:
        return dict(_cache)

    if not settings.neo4j_configured:
        result: dict[str, Any] = {"reachable": False, "reason": "not_configured"}
    else:
        try:
            reachable, reason = await asyncio.wait_for(
                asyncio.to_thread(_probe_neo4j_tcp),
                timeout=PROBE_TIMEOUT_SECONDS,
            )
            result = {"reachable": reachable, "reason": reason}
        except asyncio.TimeoutError:
            # The worker thread is allowed to finish in the background; the
            # response is not allowed to wait for it.
            result = {"reachable": False, "reason": "timeout"}
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning(
                "Neo4j reachability probe failed unexpectedly (%s)",
                type(exc).__name__,
            )
            result = {"reachable": False, "reason": "probe_error"}

    _cache = result
    _cache_at = now
    logger.info("Neo4j reachability probe: %s", result["reason"])
    return dict(result)
