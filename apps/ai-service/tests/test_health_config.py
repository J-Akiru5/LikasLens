"""Tests for the /health/config knowledge-store probe.

Context: the endpoint used to report `neo4j: {"status": "configured"}` purely
because NEO4J_URI was set, while the host had not resolved for weeks. Neo4j is
gone; the store is Postgres + pgvector. These tests pin the parts that can
silently go wrong: not configured, unreachable, timing out, and caching.
"""

import asyncio

import pytest

import dependency_health
from dependency_health import _classify, _reset_cache, check_knowledge_store


@pytest.fixture(autouse=True)
def _clear_cache():
    _reset_cache()
    yield
    _reset_cache()


def test_not_configured_is_not_probed(monkeypatch):
    monkeypatch.setattr("db.connection.AsyncSessionLocal", None)

    result = asyncio.run(check_knowledge_store(force=True))

    assert result["reachable"] is False
    assert result["reason"] == "not_configured"
    assert result["vector_ready"] is False


def test_reachable_reports_embedding_state(monkeypatch):
    async def fake_probe():
        return {
            "reachable": True,
            "reason": "reachable",
            "vector_ready": True,
            "embedded_laws": 16,
        }

    monkeypatch.setattr(dependency_health, "_probe_database", fake_probe)
    result = asyncio.run(check_knowledge_store(force=True))

    assert result["reachable"] is True
    assert result["vector_ready"] is True
    assert result["embedded_laws"] == 16


def test_result_is_cached_and_force_bypasses(monkeypatch):
    calls = {"n": 0}

    async def fake_probe():
        calls["n"] += 1
        return {"reachable": True, "reason": "reachable", "vector_ready": True}

    monkeypatch.setattr(dependency_health, "_probe_database", fake_probe)

    asyncio.run(check_knowledge_store())
    asyncio.run(check_knowledge_store())
    assert calls["n"] == 1, "second call should hit the cache"

    asyncio.run(check_knowledge_store(force=True))
    assert calls["n"] == 2, "force must bypass the cache"


def test_probe_timeout_is_bounded(monkeypatch):
    async def slow_probe():
        await asyncio.sleep(5)
        return {"reachable": True, "reason": "reachable", "vector_ready": True}

    monkeypatch.setattr(dependency_health, "_probe_database", slow_probe)
    monkeypatch.setattr(dependency_health, "PROBE_TIMEOUT_SECONDS", 0.05)

    result = asyncio.run(check_knowledge_store(force=True))

    assert result["reachable"] is False
    assert result["reason"] == "timeout"


def test_unexpected_error_does_not_leak_details(monkeypatch):
    async def exploding_probe():
        raise RuntimeError("password authentication failed for user postgres")

    monkeypatch.setattr(dependency_health, "_probe_database", exploding_probe)
    result = asyncio.run(check_knowledge_store(force=True))

    assert result["reachable"] is False
    assert result["reason"] == "probe_error"
    assert "password" not in str(result).lower()


@pytest.mark.parametrize(
    "message, expected",
    [
        ("connection refused", "connection_refused"),
        ("password authentication failed", "auth_failed"),
        ("relation does not exist", "schema_missing"),
        ("network is unreachable", "unreachable"),
        ("something odd", "probe_error"),
    ],
)
def test_classify_returns_fixed_reason(message, expected):
    assert _classify(RuntimeError(message)) == expected


def test_classify_never_returns_the_message():
    secret = "postgresql://user:supersecret@host:5432/db"
    reason = _classify(RuntimeError(secret))
    assert "supersecret" not in reason
    assert reason == "unreachable" or reason == "probe_error"


def test_health_config_has_no_live_neo4j_section():
    from config import settings

    report = settings.health_config()

    assert "database" in report
    assert "gemini" in report
    # Neo4j is no longer configured, probed or reported as a live dependency.
    assert "neo4j" not in report
