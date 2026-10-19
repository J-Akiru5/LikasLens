"""
Tests for /health/config Neo4j reachability reporting.

Context: the endpoint used to report `neo4j: {"status": "configured"}` purely
from env presence. The configured host did not resolve, so "configured" read as
healthy. These tests pin the three states — not_configured / configured /
configured_but_unreachable — the short cached probe, and the fact that no
hostname, URI or credential is exposed.
"""

from __future__ import annotations

import asyncio
import json
import os
import socket
import sys
import time
from unittest.mock import patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import dependency_health  # noqa: E402
from config import settings  # noqa: E402
from dependency_health import (  # noqa: E402
    CACHE_TTL_SECONDS,
    check_neo4j_reachability,
)

FAKE_URI = "neo4j+s://secret-host.invalid:7687"
FAKE_USER = "secret-user"
FAKE_PASSWORD = "secret-password"


@pytest.fixture(autouse=True)
def _reset_probe_cache():
    dependency_health._reset_cache()
    yield
    dependency_health._reset_cache()


@pytest.fixture
def _neo4j_configured():
    with patch.object(settings, "neo4j_uri", FAKE_URI), \
         patch.object(settings, "neo4j_user", FAKE_USER), \
         patch.object(settings, "neo4j_password", FAKE_PASSWORD):
        yield


@pytest.fixture
def _neo4j_unconfigured():
    with patch.object(settings, "neo4j_uri", ""), \
         patch.object(settings, "neo4j_user", ""), \
         patch.object(settings, "neo4j_password", ""):
        yield


# ---------------------------------------------------------------------------
# Probe behaviour
# ---------------------------------------------------------------------------

def test_not_configured_is_not_probed(_neo4j_unconfigured, monkeypatch):
    def boom():
        raise AssertionError("must not probe an unconfigured dependency")

    monkeypatch.setattr(dependency_health, "_probe_neo4j_tcp", boom)

    result = asyncio.run(check_neo4j_reachability())

    assert result == {"reachable": False, "reason": "not_configured"}


def test_dns_failure_reports_unreachable_without_leaking_host(
    _neo4j_configured, monkeypatch
):
    def dns_failure(*_args, **_kwargs):
        raise socket.gaierror("name or service not known")

    monkeypatch.setattr(dependency_health.socket, "getaddrinfo", dns_failure)

    reachable, reason = dependency_health._probe_neo4j_tcp()
    result = {"reachable": reachable, "reason": reason}

    assert result == {"reachable": False, "reason": "dns_failed"}
    assert "secret-host" not in json.dumps(result)
    assert FAKE_USER not in json.dumps(result)
    assert FAKE_PASSWORD not in json.dumps(result)


def test_reachable_host_reports_reachable(_neo4j_configured, monkeypatch):
    address_info = [
        (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("192.0.2.1", 7687)),
    ]

    class _Socket:
        def __init__(self):
            self.connected = None
            self.closed = False

        def settimeout(self, _timeout):
            pass

        def connect(self, address):
            self.connected = address

        def close(self):
            self.closed = True

    opened = []

    def make_socket(*_args, **_kwargs):
        sock = _Socket()
        opened.append(sock)
        return sock

    monkeypatch.setattr(dependency_health.socket, "getaddrinfo", lambda *_a, **_k: address_info)
    monkeypatch.setattr(dependency_health.socket, "socket", make_socket)

    reachable, reason = dependency_health._probe_neo4j_tcp()

    assert (reachable, reason) == (True, "reachable")
    assert opened[0].connected == ("192.0.2.1", 7687)
    assert opened[0].closed is True


def test_connection_refused_is_reported(_neo4j_configured, monkeypatch):
    address_info = [
        (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("192.0.2.1", 7687)),
    ]

    class _Socket:
        def settimeout(self, _timeout):
            pass

        def connect(self, _address):
            raise ConnectionRefusedError()

        def close(self):
            pass

    monkeypatch.setattr(dependency_health.socket, "getaddrinfo", lambda *_a, **_k: address_info)
    monkeypatch.setattr(dependency_health.socket, "socket", lambda *_a, **_k: _Socket())

    reachable, reason = dependency_health._probe_neo4j_tcp()

    assert (reachable, reason) == (False, "connection_refused")


def test_result_is_cached(_neo4j_configured, monkeypatch):
    calls = []

    def fake_probe():
        calls.append(1)
        return True, "reachable"

    monkeypatch.setattr(dependency_health, "_probe_neo4j_tcp", fake_probe)

    first = asyncio.run(check_neo4j_reachability())
    second = asyncio.run(check_neo4j_reachability())

    assert first == second == {"reachable": True, "reason": "reachable"}
    assert len(calls) == 1, "second call must be served from cache"

    asyncio.run(check_neo4j_reachability(force=True))
    assert len(calls) == 2, "force=True must bypass the cache"

    assert CACHE_TTL_SECONDS > 0


def test_probe_timeout_is_bounded(_neo4j_configured, monkeypatch):
    def slow_probe():
        time.sleep(0.3)
        return True, "reachable"

    monkeypatch.setattr(dependency_health, "_probe_neo4j_tcp", slow_probe)
    monkeypatch.setattr(dependency_health, "PROBE_TIMEOUT_SECONDS", 0.05)

    started = time.monotonic()
    result = asyncio.run(check_neo4j_reachability())
    elapsed = time.monotonic() - started

    assert result == {"reachable": False, "reason": "timeout"}
    assert elapsed < 0.5, f"probe delayed the response by {elapsed:.2f}s"


# ---------------------------------------------------------------------------
# /health/config shape
# ---------------------------------------------------------------------------

def test_health_config_reports_unreachable_plainly(_neo4j_configured):
    report = settings.health_config(
        neo4j_probe={"reachable": False, "reason": "dns_failed"}
    )

    assert report["neo4j"]["status"] == "configured_but_unreachable"
    assert report["neo4j"]["reachable"] is False
    assert report["neo4j"]["detail"] == "dns_failed"

    serialized = json.dumps(report)
    assert "secret-host" not in serialized
    assert FAKE_URI not in serialized
    assert FAKE_USER not in serialized
    assert FAKE_PASSWORD not in serialized


def test_health_config_reports_reachable(_neo4j_configured):
    report = settings.health_config(
        neo4j_probe={"reachable": True, "reason": "reachable"}
    )

    assert report["neo4j"]["status"] == "configured"
    assert report["neo4j"]["reachable"] is True
    assert report["neo4j"]["detail"] == "reachable"


def test_health_config_without_probe_does_not_imply_health(_neo4j_configured):
    report = settings.health_config()

    assert report["neo4j"]["status"] == "configured"
    assert report["neo4j"]["reachable"] is None
    assert report["neo4j"]["detail"] == "not_probed"


def test_health_config_reports_not_configured(_neo4j_unconfigured):
    report = settings.health_config()

    assert report["neo4j"]["status"] == "not_configured"
    assert report["neo4j"]["missing"] == [
        "NEO4J_URI",
        "NEO4J_USER",
        "NEO4J_PASSWORD",
    ]
