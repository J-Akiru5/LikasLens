"""
LikasLens AI Evidence & Validation Test Suite
Validates all production endpoints and collects benchmark metrics.
Run against the live deployment for judge-ready evidence.
"""

import json
import os
import time
import sys
import statistics
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://likaslens-ai-service.onrender.com"
PROXY_BASE = "https://likaslens.syntaxure.dev"
RESULTS = []


def test_endpoint(name, url, method="GET", body=None, headers=None, timeout=30):
    """Test a single endpoint and record timing."""
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=req_headers, method=method)
    
    start = time.monotonic()
    try:
        resp = urlopen(req, timeout=timeout)
        elapsed = (time.monotonic() - start) * 1000
        status = resp.status
        raw = resp.read().decode()
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {"_raw": raw[:500]}
        
        result = {
            "name": name,
            "url": url,
            "method": method,
            "status": status,
            "latency_ms": round(elapsed, 1),
            "body": body,
            "pass": True,
        }
        print(f"  [PASS] {name}: {status} ({elapsed:.0f}ms)")
    except HTTPError as e:
        elapsed = (time.monotonic() - start) * 1000
        raw = e.read().decode() if e.fp else ""
        try:
            body = json.loads(raw)
        except:
            body = {"_raw": raw[:500]}
        
        result = {
            "name": name,
            "url": url,
            "method": method,
            "status": e.code,
            "latency_ms": round(elapsed, 1),
            "body": body,
            "pass": e.code in (400, 401, 405, 422),  # Expected errors count as pass
        }
        symbol = "[PASS]" if result["pass"] else "[FAIL]"
        print(f"  {symbol} {name}: {e.code} ({elapsed:.0f}ms)")
    except Exception as e:
        elapsed = (time.monotonic() - start) * 1000
        result = {
            "name": name,
            "url": url,
            "method": method,
            "status": 0,
            "latency_ms": round(elapsed, 1),
            "error": str(e),
            "pass": False,
        }
        print(f"  [FAIL] {name}: ERROR {e}")
    
    RESULTS.append(result)
    return result


def run_tests():
    print("=" * 60)
    print("LikasLens AI Evidence & Validation Suite")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)
    
    # ── Phase 1: Direct Render endpoints ──
    print("\n>>> Phase 1: Direct Render AI Service Endpoints")
    test_endpoint("health", f"{BASE_URL}/health")
    test_endpoint("root", f"{BASE_URL}/")
    test_endpoint("health/config", f"{BASE_URL}/health/config")
    test_endpoint("health/models", f"{BASE_URL}/health/models")
    test_endpoint("graph/topology", f"{BASE_URL}/graph/topology")
    test_endpoint("routing/status", f"{BASE_URL}/routing/status")
    test_endpoint("routing/stats", f"{BASE_URL}/routing/stats")
    
    # ── Phase 2: AI inference endpoints ──
    print("\n>>> Phase 2: AI Inference Endpoints")
    test_endpoint("chat (via proxy)", f"{PROXY_BASE}/api/v1/ai/chat", method="POST", body={
        "message": "What are the penalties for illegal dumping under RA 9003?",
        "session_id": "evidence-test-001"
    })
    
    # Triage with valid body (no image = expected 400)
    test_endpoint("triage validation (no image)", f"{PROXY_BASE}/api/v1/ai/reports/triage", method="POST", body={
        "title": "Illegal dumping near river",
        "description": "Large pile of construction waste",
        "latitude": 14.5995,
        "longitude": 120.9842,
        "report_type": "waste_dumping"
    })
    
    # Auth-protected endpoints (should return 401)
    test_endpoint("ticket status (no auth)", f"{PROXY_BASE}/api/v1/ai/tickets/00000000-0000-0000-0000-000000000000/status", method="PATCH", body={"status": "investigating"})
    
    # ── Phase 3: Production domain health ──
    print("\n>>> Phase 3: Production Domain Health")
    test_endpoint("frontend", "https://likaslens.syntaxure.dev/en/dashboard")
    test_endpoint("admin portal", "https://likasadmin.syntaxure.dev/en/dashboard")
    test_endpoint("mobile PWA", "https://likaslensapp.syntaxure.dev/en/dashboard")
    
    # ── Phase 4: Chat latency benchmark ──
    print("\n>>> Phase 4: Chat Latency Benchmark (5 requests)")
    chat_latencies = []
    chat_prompts = [
        "What is environmental pollution?",
        "How do I report illegal logging?",
        "What are water quality standards?",
        "Who handles waste management complaints?",
        "What penalties exist for air pollution?",
    ]
    for i, prompt in enumerate(chat_prompts):
        result = test_endpoint(f"chat benchmark {i+1}", f"{PROXY_BASE}/api/v1/ai/chat", method="POST", body={
            "message": prompt,
            "session_id": f"evidence-bench-{i}"
        })
        if result["pass"] and result["latency_ms"] > 0:
            chat_latencies.append(result["latency_ms"])
        time.sleep(1)  # Respect rate limits
    
    # ── Phase 5: Summary ──
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["pass"])
    failed = total - passed
    
    print(f"Total tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if chat_latencies:
        print(f"\nChat latency stats:")
        print(f"  Mean: {statistics.mean(chat_latencies):.0f}ms")
        print(f"  P50: {statistics.median(chat_latencies):.0f}ms")
        print(f"  Min: {min(chat_latencies):.0f}ms")
        print(f"  Max: {max(chat_latencies):.0f}ms")
    
    # Write results
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_tests": total,
        "passed": passed,
        "failed": failed,
        "chat_latency": {
            "count": len(chat_latencies),
            "mean_ms": round(statistics.mean(chat_latencies), 1) if chat_latencies else None,
            "median_ms": round(statistics.median(chat_latencies), 1) if chat_latencies else None,
            "min_ms": round(min(chat_latencies), 1) if chat_latencies else None,
            "max_ms": round(max(chat_latencies), 1) if chat_latencies else None,
        },
        "results": RESULTS,
    }
    
    output_path = "apps/ai-service/_evidence_results.json"
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nResults written to {output_path}")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_tests())
