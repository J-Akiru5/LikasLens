"""
Post-deploy smoke check for the AI service.

Run this against a deployed instance after a redeploy to prove the new build is
actually live. It is deliberately strict: the last deploy was missed because
nobody checked, and the old build kept answering 200 while reporting Neo4j.

    python smoke_deploy.py
    python smoke_deploy.py --base-url https://likaslens-ai-service.onrender.com

Exit code 0 means every check passed. Exit code 1 prints exactly which contract
the running service violates.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_URL = os.environ.get("AI_BASE_URL", "http://127.0.0.1:8001")
TIMEOUT = 90  # Render free tier cold starts are slow


def get(base: str, path: str) -> tuple[int, object]:
    headers = {"Accept": "application/json"}
    # /graph/knowledge requires the service key when the deployment has one set.
    api_key = os.environ.get("AI_SERVICE_API_KEY")
    if api_key:
        headers["X-API-Key"] = api_key
    req = urllib.request.Request(f"{base.rstrip('/')}{path}", headers=headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        body = res.read().decode("utf-8")
        try:
            return res.status, json.loads(body)
        except json.JSONDecodeError:
            return res.status, body


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_URL)
    args = parser.parse_args()
    base = args.base_url

    failures: list[str] = []
    checks = 0

    def check(label: str, condition: bool, detail: str = "") -> None:
        nonlocal checks
        checks += 1
        mark = "PASS" if condition else "FAIL"
        print(f"  [{mark}] {label}{'' if condition else f'  -> {detail}'}")
        if not condition:
            failures.append(label)

    print(f"Smoke checking {base}\n")

    # 1. Liveness
    try:
        status, _ = get(base, "/health")
        check("GET /health returns 200", status == 200, f"HTTP {status}")
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"  [FAIL] GET /health unreachable -> {exc}")
        return 1

    # 2. Knowledge store is the new backend, not Neo4j
    status, config = get(base, "/health/config")
    if not isinstance(config, dict):
        return 1
    store = config.get("knowledge_store")
    check("health/config exposes knowledge_store", isinstance(store, dict), "key missing (old build)")
    if isinstance(store, dict):
        check("knowledge store reachable", store.get("reachable") is True, str(store.get("reason")))
        check("pgvector ready", store.get("vector_ready") is True, "vector extension missing")
        embedded = store.get("embedded_laws")
        check("laws embedded", isinstance(embedded, int) and embedded >= 16, f"embedded_laws={embedded}")

    neo4j = config.get("neo4j") or {}
    check(
        "neo4j is reported as removed, not configured",
        neo4j.get("status") == "removed",
        f"status={neo4j.get('status')} (old build still reports configured)",
    )

    # 3. Topology declares the new backend
    _, topo = get(base, "/graph/topology")
    check(
        "graph topology backend is postgres+pgvector",
        isinstance(topo, dict) and topo.get("backend") == "postgres+pgvector",
        f"backend={topo.get('backend') if isinstance(topo, dict) else topo}",
    )

    # 4. The knowledge endpoint returns the full mapping
    _, knowledge = get(base, "/graph/knowledge")
    if not isinstance(knowledge, dict):
        check("GET /graph/knowledge returns JSON", False, str(type(knowledge)))
        return 1

    hazards = knowledge.get("hazards") or []
    check("all 11 violation types present", len(hazards) == 11, f"got {len(hazards)}")
    unlinked = [h.get("code") for h in hazards if not h.get("linked")]
    check("every violation type has a linked statute", not unlinked, f"unlinked: {unlinked}")

    selected = knowledge.get("selected") or {}
    check("selected hazard resolves relationally", selected.get("method") == "relational", str(selected.get("method")))

    # 5. The corrected mangrove mapping must not regress
    _, coral = get(base, "/graph/knowledge?hazard=CORAL-REEF-DAMAGE")
    coral_laws = [law.get("code") for law in (coral.get("selected") or {}).get("laws", [])]
    check("coral damage maps to RA-10654", coral_laws == ["RA-10654"], str(coral_laws))

    _, mangrove = get(base, "/graph/knowledge?hazard=MANGROVE-DESTRUCTION")
    mangrove_laws = [law.get("code") for law in (mangrove.get("selected") or {}).get("laws", [])]
    check("mangrove no longer maps to RA-7611", "RA-7611" not in mangrove_laws, str(mangrove_laws))
    check("mangrove maps to RA-10654", "RA-10654" in mangrove_laws, str(mangrove_laws))

    print()
    if failures:
        print(f"FAILED {len(failures)}/{checks} checks. This build is not the expected one.")
        for name in failures:
            print(f"  - {name}")
        return 1

    print(f"PASSED {checks}/{checks} checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
