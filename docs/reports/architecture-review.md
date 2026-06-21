# LikasLens Architecture Review & Recommendations

> **Date:** June 19, 2026
> **Review Type:** Senior AI Solutions Architect — Hackathon Judge Feedback Response
> **Scope:** Stability, error handling, metrics, cross-border scalability, edge cases, end-to-end flow

---

## Executive Summary

The LikasLens implementation is remarkably mature for a hackathon project — a fully functional 6-app monorepo with dual-model YOLOv8, Neo4j graph, Gemini integration, blockchain evidence, and offline-first PWA. The judges' feedback points to four specific gaps: **measured accuracy**, **cross-border legal scalability**, **LGU unresponsive fallback**, and **end-to-end verifiability**. This document addresses each with concrete, implementable recommendations tied to the actual codebase.

---

## 1. Technical Failing Points — Stability & Error Handling

### 1.1 Confidence Threshold Too Permissive

**Location:** `apps/ai-service/image_analysis.py:302`

The default `confidence_threshold=0.25` is dangerously low for a system with legal consequences. A COCO model at 0.25 will produce many false positives on cluttered ASEAN coastal/urban scenes (bottles misidentified as litter, potted plants misidentified as vegetation clearing).

**Recommendation:** Raise default to `0.50` for the COCO model. Add a `--strict` mode (0.65+) for deployment in high-legal-risk contexts. The confidence value should flow through to the `TicketClassification.confidence` field in the backend so admins can filter by it.

### 1.2 No Confidence Aggregation Across Dual Models

**Location:** `apps/ai-service/image_analysis.py:201-226`

When `_merge_detections` replaces a COCO detection with an environmental model detection (line 218-220), it only checks if the env model has higher confidence. There's no composite confidence score that weighs both models. A low-confidence COCO "bottle" can be replaced by a low-confidence env_model "plastic" and still trigger `has_environmental_concern`.

**Recommendation:** Add a composite confidence calculation:
```
composite = max(coco_conf, env_conf) * 0.7 + model_agreement_bonus * 0.3
```
where `model_agreement_bonus` is 1.0 if both models agree on the hazard type, 0.0 otherwise. Gate `has_environmental_concern` on `composite >= 0.50`.

### 1.3 No Retry/Backoff on Gemini Calls

**Location:** `apps/ai-service/hazard_analyzer.py:157-181`

Gemini calls use a single 30s timeout with no retry. In a hackathon demo or production, transient 429/503 errors from Google will cascade into 502s.

**Recommendation:** Add exponential backoff with jitter (3 attempts: 1s, 2s, 4s) wrapping the `asyncio.wait_for` call. ~15 lines of code in `hazard_analyzer.py`.

### 1.4 Routing Learner is File-Based, Not Atomic

**Location:** `apps/ai-service/routing_learner.py:61-70`

`_persist()` uses a temp-file-then-rename pattern (good), but `_scores` is an in-memory dict that gets loaded lazily. Under concurrent FastAPI workers (uvicorn with >1 worker), each worker has its own `_scores` dict, leading to data races and lost resolution records.

**Recommendation:** For the hackathon, pin uvicorn to `--workers 1` and document this constraint. For production, move routing scores to PostgreSQL (a simple `routing_scores` table with upsert).

### 1.5 No Circuit Breaker on AI Service

**Location:** `apps/backend/app/Services/TriageService.php` (called from ReportController)

The backend calls the AI service as "best-effort" (good for resilience), but there's no circuit breaker. If the AI service is down, every report submission still waits for the HTTP timeout before falling back.

**Recommendation:** Add a simple in-memory circuit breaker in the backend: after 3 consecutive AI service failures, skip the AI call for 60 seconds and return a "triage-pending" status. This prevents report submission latency from spiking to 30s+ during AI service outages.

### 1.6 Missing `eval_metrics.py` Ground Truth Dataset

**Location:** `apps/ai-service/eval_metrics.py:159`

The eval harness references `apps/ai-service/test_data/ground_truth.jsonl` but this file doesn't exist. The judges specifically asked for measured metrics on real ASEAN imagery.

**Recommendation:** Create `apps/ai-service/test_data/` with at minimum 200 labeled images covering:
- 50 images with illegal dumping (bottles, bags, mixed waste in coastal/urban settings)
- 50 images with open burning (smoke, fire in agricultural/urban contexts)
- 50 images with water pollution (discolored water, oil slicks, dead fish)
- 50 clean/negative images (no violation — critical for false-positive rate)

---

## 2. Metrics & Data — Proving Accuracy on ASEAN Imagery

### 2.1 Current State

The project has `eval_metrics.py` computing mAP@0.5, precision, and recall, and `INFERENCE_METRICS.md` documenting opt-in JSONL logging. This is a solid foundation. What's missing is the actual dataset and the numbers.

### 2.2 Recommended Dataset Strategy

For a hackathon, you don't need thousands of images. You need **200-300 well-labeled images** that represent real ASEAN field conditions:

| Source | Count | Purpose |
|--------|-------|---------|
| **Your own field photos** (Iloilo) | 50-80 | Proof of concept on real terrain |
| **Open-source ASEAN datasets** | 100-150 | Generalization proof |
| **Synthetic negatives** | 50-70 | False-positive rate measurement |

**Open-source dataset recommendations:**
- **TrashNet** (Kaggle) — waste classification images, many from Southeast Asian contexts
- **FloodNet** — flood damage imagery (relevant for ASEAN coastal reporting)
- **Custom Google Image Search** — download 100 images of "illegal dumping Philippines", "open burning Indonesia", "water pollution Vietnam" and manually label them

### 2.3 Required Metrics Table for Submission

| Metric | COCO-only | COCO+Environmental | Target |
|--------|-----------|-------------------|--------|
| mAP@0.5 | X.XX | X.XX | ≥0.75 |
| Precision | X.XX | X.XX | ≥0.80 |
| Recall | X.XX | X.XX | ≥0.70 |
| False-Positive Rate | X.XX | X.XX | ≤0.15 |
| Inference Latency (p50) | Xms | Xms | ≤500ms |
| Inference Latency (p95) | Xms | Xms | ≤1000ms |

### 2.4 False-Positive Mitigation Architecture

The judges specifically flagged that "wrong flags carry legal consequences." The current pipeline has no human-in-the-loop confirmation before routing to an LGU.

**Recommendation:** Add a **confidence-gated review step**:

```
CONFIDENCE ≥ 0.70  → Auto-route to LGU (high confidence)
0.40 ≤ CONFIDENCE < 0.70 → Queue for analyst review (medium confidence)
CONFIDENCE < 0.40 → Auto-dismiss with "low confidence" flag (low confidence)
```

This should be implemented in `TriageService` as a new field `triage_disposition` on the ticket: `auto_routed`, `pending_review`, or `auto_dismissed`.

---

## 3. Cross-Border Scalability — Legal Graph Layer Across ASEAN

### 3.1 Current State

The graph is 100% Philippines-specific:
- **16 Philippine laws** (RA-9003, RA-8749, etc.) in `baseline_rules.py`
- **5 Philippine NGOs** all in Western Visayas
- **3 Philippine locations** (Iloilo City, Iloilo Province, Western Visayas)
- **SLA configs** default to `country_code = 'PH'` in `SlaConfig.php:30`

The good news: the architecture already has the right primitives:
- `Tenant` model with `country_code` field
- `CountryCode` model with `eco_credit_rate` and `is_active`
- `SlaConfig.forViolation()` accepts `$countryCode` parameter
- Graph vertices have `jurisdictionCode` property
- OpenAPI has `X-Tenant-Slug` header support

### 3.2 Recommended Cross-Border Graph Schema

Extend `baseline_rules.py` with a **jurisdiction-aware seeding pattern**:

```python
# New field on every vertex: "jurisdiction": "PH" | "MY" | "ID" | "TH" | "VN" | "SG" | "BN" | "KH" | "LA" | "MM"
# New edge property: "jurisdiction" to scope GOVERNED_BY, VIOLATES, ENFORCED_BY

ASEAN_LAWS = {
    "PH": [...],  # existing 16 laws
    "MY": [
        {"code": "ACT-672", "title": "Environmental Quality Act 1974", ...},
        {"code": "ACT-733", "title": "Environmental Quality (Prescribed Premises) Regulations", ...},
    ],
    "ID": [
        {"code": "UU-32-2009", "title": "Environmental Protection and Management Law", ...},
    ],
    # ... etc for each ASEAN country
}
```

### 3.3 Graph Traversal Must Be Jurisdiction-Scoped

**Location:** `apps/ai-service/graph_rag.py` (hybrid_retrieve)

The current graph traversal queries don't filter by jurisdiction. When the system scales beyond PH, a query for `illegal_dumping` in Malaysia would still return Philippine laws.

**Recommendation:** Add a `jurisdiction` parameter to every Cypher query in `hybrid_retrieve`:

```cypher
MATCH (l:Law)-[:VIOLATES]-(h:HazardType {code: $hazard_code})
WHERE l.jurisdictionCode = $jurisdiction
MATCH (l)-[:ENFORCED_BY]->(a:Agency)
RETURN l, a
```

The `jurisdiction` should be derived from the report's GPS coordinates via reverse geocoding, or from the tenant's `country_code`.

### 3.4 Tenant-Scoped Law Management

**Location:** `apps/backend/app/Models/Tenant.php`

The `Tenant` model already has `country_code` and `config` (JSON). Add a `legal_jurisdiction` property to the tenant config that maps to the graph's jurisdiction code. The admin portal (`apps/admin-portal`) should allow super_admins to manage laws per jurisdiction.

### 3.5 Recommended ASEAN Expansion Seed Data (Minimum Viable)

For the hackathon demo, seed 2-3 additional countries to prove the pattern works:

| Country | Key Laws | Key Hazard |
|---------|----------|------------|
| **Philippines** | RA-9003, RA-8749, RA-9275 (existing) | illegal_dumping |
| **Malaysia** | Environmental Quality Act 1974 | open_burning (haze) |
| **Indonesia** | UU-32/2009 | peatland_fire, transboundary_haze |

This demonstrates the architectural capability without requiring exhaustive legal research for all 10 countries.

---

## 4. Edge Cases — LGU Unresponsive Workflow

### 4.1 Current State

The SLA system (`SlaService.php`) already has:
- `sla_deadline_response` and `sla_deadline_resolution` fields on tickets
- `checkBreaches()` that marks tickets as breached
- `escalate()` that finds an admin and records escalation
- `runEscalationCheck()` that runs the full cycle

**What's missing:** The escalation just records `escalated_to` and logs an alert. There's no:
1. Automatic re-routing to an alternative LGU
2. Citizen notification that their report is stuck
3. Public scoreboard impact (breached tickets should be visible)
4. Escalation chain (admin → regional supervisor → national)

### 4.2 Recommended LGU Unresponsive Workflow

```
LGU UNRESPONSIVE WORKFLOW
══════════════════════════

T+0h     Report auto-routed to primary LGU (based on location + routing learner)
T+24h    SLA response deadline breached
         → System attempts re-route to secondary LGU (routing_learner.get_best_lgu)
         → Citizen notified: "Your report is being reassigned"
T+72h    SLA resolution deadline breached
         → Ticket escalated to admin
         → Public scoreboard flags ticket as "overdue"
         → Citizen notified: "Your report has been escalated"
T+168h   (7 days) No resolution
         → Ticket marked "unresolved - escalated to regional authority"
         → Public accountability record created
         → Citizen can provide supplementary evidence
```

### 4.3 Implementation Details

**Backend changes needed:**

1. **Add `reassigned_at` and `reassigned_to` fields to Ticket** — track when a ticket is re-routed
2. **Add `escalation_level` enum** to Ticket: `none`, `lgu`, `admin`, `regional`, `national`
3. **Modify `SlaService::runEscalationCheck()`** to:
   - At response breach: call `routing_learner.get_best_lgu()` for alternative, re-assign
   - At resolution breach: escalate to next level
   - At 7 days: mark as public accountability record

4. **Add notification events** (even if the notification system is TODO, fire the events):
   ```php
   event(new TicketReassigned($ticket, $oldLgu, $newLgu));
   event(new TicketEscalated($ticket, $escalationLevel));
   event(new TicketOverdue($ticket));
   ```

5. **Public scoreboard query** should include overdue counts:
   ```sql
   SELECT lgu_id,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
          COUNT(*) FILTER (WHERE sla_resolution_breached = true) as overdue
   FROM tickets GROUP BY lgu_id
   ```

### 4.4 Frontend/Mobile PWA Changes

- **Report status page:** Show "Your report is being reassigned" when `reassigned_at` is set
- **Public scoreboard:** Add "Overdue Reports" column per LGU
- **Admin portal:** Add escalation queue view with `escalation_level` filter

---

## 5. End-to-End Data Flow — For Prototype Video

Here is the exact, verifiable flow to demonstrate:

### Step 1: Citizen Capture (Mobile PWA)

```
Citizen opens mobile-pwa → /report
→ Camera activates (useCamera hook, environment-facing)
→ Photo taken of illegal waste dumping near Iloilo River
→ GPS coordinates captured (navigator.geolocation)
→ EXIF metadata stripped via canvas re-encode (stripExif)
→ Incident type selected: "Illegal Dumping"
→ Optional description via voice input (use-voice-input hook)
→ Ghost Mode toggle OFF (visible report)
→ Citizen taps "Submit Report"
```

### Step 2: Backend Receipt (Laravel :8000)

```
POST /api/reports
→ Request validation (Laravel request rules)
→ Server-side EXIF stripping (GD re-encode, double-strip)
→ Supabase Storage upload (evidence photo → likaslens-evidence bucket)
→ Database transaction begins:
  → Ticket created (status: "open")
  → TicketEvidence created (photo URL, GPS, timestamp)
  → Report created (linked to ticket)
→ ChainService runs (duplicate detection, Haversine 100m)
→ TriageService called (→ Step 3)
→ SLA deadlines calculated (SlaService.calculateDeadlines)
→ Blockchain hash computed (Ethereum Sepolia, best-effort)
→ Response returned to citizen with ticket ID
```

### Step 3: AI Triage (FastAPI AI Service :8001)

```
POST /analyze/base64 (base64 image payload)
→ YOLOv8 Nano (COCO model) inference:
  → Detects: bottle (conf: 0.82), trash bag (conf: 0.71)
→ Environmental model inference (if ENV_MODEL_PATH set):
  → Detects: plastic (conf: 0.78), garbage (conf: 0.69)
→ Detections merged, IoU deduplication applied
→ classify_environmental_risk():
  → Matched indicators: "solid_waste" (severity: high)
  → has_environmental_concern: TRUE
  → hazard_ids: ["illegal_dumping"]
→ Response returned to backend with:
  → detections[], environmental_assessment{}, latency_ms
```

### Step 4: Graph Traversal (Neo4j)

```
POST /api/v1/analyze-hazard (hazard_id: "illegal_dumping", location: "Iloilo City")
→ Graph traversal (Cypher):
  → MATCH (h:HazardType {code: "illegal_dumping"})-[:VIOLATES]->(l:Law)
  → WHERE l.jurisdictionCode = "PH-NATIONAL"
  → MATCH (l)-[:ENFORCED_BY]->(a:Agency)
  → Result: Law RA-9003 (Ecological Solid Waste Management Act)
  → Result: Agency "Green Dingle Initiative"
→ Vector search fallback (if graph returns nothing):
  → Gemini text-embedding-004 → Neo4j vector index
→ GraphRAG returns: {violated_laws: ["RA-9003"], agencies: ["Green Dingle Initiative"]}
```

### Step 5: Gemini Summary (Neural Layer)

```
→ generate_grounded_report():
  → Prompt: "A vision model detected illegal_dumping in Iloilo City..."
  → Gemini 2.5 Flash generates 2-sentence formal report:
    "Illegal dumping of solid waste detected in Iloilo City violates
     RA-9003 (Ecological Solid Waste Management Act of 2000).
     This incident should be routed to Green Dingle Initiative
     for investigation and enforcement."
→ Response returned to backend
```

### Step 6: Ticket Completion (Backend)

```
→ TicketClassification created:
  → violation_type: "SWM-ILLEGAL-DUMPING"
  → confidence: 0.78
  → ai_summary: (Gemini output)
  → violated_laws: ["RA-9003"]
  → enforcing_agencies: ["Green Dingle Initiative"]
→ Ticket status updated: "triaged"
→ Achievement evaluated (AchievementService)
→ Rank updated (RankService)
→ Citizen response: "Report submitted! Ticket #T-2026-001 is being reviewed."
```

### Step 7: LGU Routing & Verification

```
→ Admin/Analyst reviews ticket in admin-portal /triage
→ Assigns to Green Dingle Initiative via POST /ticket-assignments
→ NGO receives assignment notification
→ NGO investigates, updates ticket status
→ SLA tracking: response deadline (24h), resolution deadline (72h)
→ If LGU unresponsive → re-routing workflow (Section 4)
→ Resolution recorded → citizen notified → eco-credits awarded
```

### Step 8: Public Accountability

```
→ Public scoreboard (/scoreboard) updates:
  → Report count, resolution rate, avg response time per LGU
  → Overdue reports highlighted
→ Dashboard (/dashboard) shows impact metrics
→ Achievement unlocked for citizen
```

---

## 6. Priority Implementation Plan

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Create ground truth dataset (200 images) | 2-3 days | Judges require measured metrics |
| **P0** | Run eval_metrics.py, publish results table | 1 day | Judges require precision/recall/FPR numbers |
| **P0** | Raise confidence threshold to 0.50 | 1 hour | Reduces false positives immediately |
| **P1** | Implement LGU re-routing on SLA breach | 1 day | Judges require unresponsive fallback |
| **P1** | Add jurisdiction scoping to graph traversal | 0.5 day | Enables cross-border demo |
| **P1** | Seed 2 additional ASEAN countries | 1 day | Proves cross-border architecture |
| **P2** | Add circuit breaker to backend AI calls | 0.5 day | Stability improvement |
| **P2** | Add Gemini retry with backoff | 0.5 day | Stability improvement |
| **P2** | Add confidence-gated review step | 1 day | False-positive mitigation |
| **P3** | Add escalation chain (admin→regional→national) | 1 day | Production readiness |

---

## 7. Documentation Updates Required

The existing docs still reference **Cosmos DB Gremlin** in several places. Since the project has fully migrated to Neo4j, these should be updated:

| File | Line(s) | Current | Replace With |
|------|---------|---------|--------------|
| `docs/dataflow-ascii.md` | 50-58 | "Cosmos DB Gremlin Graph" | "Neo4j Graph Database" |
| `docs/dataflow-ascii.md` | 134-138 | "Gremlin Traversal" | "Cypher Traversal" |
| `docs/data-architecture.md` | 14 | "Cosmos DB Gremlin (Graph Database)" | "Neo4j AuraDB (Graph Database)" |
| `docs/data-architecture.md` | 39-94 | Entire Cosmos DB section | Neo4j section |
| `AGENTS.md` | — | "Gremlin DB ONLY" | "Neo4j DB ONLY" |
