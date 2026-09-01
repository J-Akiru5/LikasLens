# Sprint Roadmap — dev2 (Jeff)

> **Role:** Backend + Roboflow + AI Workflow
> **Sprint:** v0.9.3 → v0.9.4 (IPOPHL SRT Final Push)
> **Period:** Jun 21 – Jun 28, 2026
> **Monorepo:** `LikasLens` — `apps/backend` (Laravel 12) + `apps/ai-service` (Python 3.12 / FastAPI)

---

## Responsibilities Summary

| Domain | Stack | Location |
|---|---|---|
| Backend Core Logic | Laravel 12, PHP 8.2 | `apps/backend/` |
| AI Service | FastAPI, YOLOv8, Neo4j | `apps/ai-service/` |
| Roboflow Integration | Roboflow Inference API | `apps/ai-service/roboflow_client.py` |
| Composite Scoring & Triage | Python + Laravel bridge | `apps/ai-service/`, `apps/backend/app/Services/` |
| OpenAPI Contract Alignment | YAML/JSON specs | `docs/openapi/` |

---

## Priority Legend

| Priority | Meaning | Deadline |
|---|---|---|
| 🔴 CRITICAL | Blocks hackathon demo | Jun 23 |
| 🟠 HIGH | Degraded UX or security gap | Jun 24 |
| 🟡 MEDIUM | Polish / edge-case fixes | Jun 26 |
| 🔵 LOW | Nice-to-have for demo | Jun 28 |
| ⚪ POST | Post-hackathon backlog | Jul+ |

---

## 🔴 CRITICAL — Must Ship Before Demo

### Backend Fixes

- [ ] **Fix Google OAuth login/signup flow** `~3h`
  **Issue:** #162 — Users cannot authenticate via Google.
  **File:** `apps/backend/app/Http/Controllers/Auth/SocialiteController.php`
  **Action:** Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, callback URL in `config/services.php`. Test full OAuth round-trip. Ensure `Socialite::driver('google')->redirect()` and callback both resolve.
  **Depends on:** dev1 (frontend callback route must match)

- [ ] **Fix session retention on "Back to Home"** `~2h`
  **Issue:** #177 — Session lost when navigating back to landing.
  **File:** `apps/backend/app/Http/Middleware/`, `apps/backend/config/session.php`
  **Action:** Check `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE`, SameSite policy. Verify Sanctum stateful domains include the frontend origin. Test with browser back-button flow.
  **Depends on:** dev1 (frontend must send `X-XSRF-TOKEN` cookie)

### AI Pipeline — End-to-End Validation

- [ ] **Run full pipeline smoke test** `~2h`
  **Scenario:** `image upload → EXIF strip → YOLOv8 detect → hazard_id → hybrid_retrieve → Gemini classify → triage_disposition`
  **Files:**
  - `apps/ai-service/main.py`
  - `apps/ai-service/roboflow_client.py`
  - `apps/ai-service/hybrid_retrieve.py`
  - `apps/ai-service/gemini_client.py`
  - `apps/backend/app/Services/TriageService.php`
  **Action:** Upload a known test image (illegal dumping sample). Verify each stage returns expected shape. Confirm circuit breaker in `TriageService` does NOT trip on healthy calls.
  **Depends on:** None (self-contained)

---

## 🟠 HIGH — Ship Within 24h of Demo

### Backend Infrastructure

- [ ] **Wire `ResolveTenant` middleware into `routes/api.php`** `~1.5h`
  **File:** `apps/backend/routes/api.php`
  **Action:** Register `ResolveTenant` on all tenant-scoped route groups. Verify it extracts `tenant_id` from subdomain or header and binds to request context.
  **Depends on:** None

- [ ] **Register `TenantController` routes** `~1h`
  **File:** `apps/backend/routes/api.php`, `apps/backend/app/Http/Controllers/TenantController.php`
  **Action:** Add CRUD routes (`GET /tenants`, `POST /tenants`, `GET /tenants/{id}`, `PUT /tenants/{id}`, `DELETE /tenants/{id}`). Apply `auth:sanctum` + `ResolveTenant` middleware.
  **Depends on:** `ResolveTenant` wiring above

- [ ] **Fix `AI_SERVICE_API_KEY` missing from `.env.example`** `~15m`
  **File:** `apps/backend/.env.example`
  **Action:** Add `AI_SERVICE_API_KEY=your-ai-service-key` with a comment explaining it's required for backend → ai-service auth.
  **Depends on:** None

### AI Pipeline — Scoring & Triage

- [ ] **Run FPR validation via `eval_metrics.py`** `~2h`
  **File:** `apps/ai-service/eval_metrics.py`
  **Action:** Run evaluation on held-out test set. Confirm false positive rate ≤ 15%. If FPR > 15%, tune confidence threshold in `roboflow_client.py` (currently defaulting to model confidence). Document results in `docs/eval/fpr-report.md`.
  **Depends on:** Test dataset availability

- [ ] **Implement SLA notification dispatch** `~2.5h`
  **File:** `apps/backend/app/Services/SlaService.php:117`
  **Action:** Complete the TODO at line 117. Dispatch `SlaViolationNotification` via Laravel notification system (mail + database channel). Trigger when `sla_breached_at` is set on a report.
  **Depends on:** dev1 (frontend notification bell component)

### Roboflow

- [ ] **Validate `roboflow_client.py` error handling** `~1h`
  **File:** `apps/ai-service/roboflow_client.py` (202 lines)
  **Action:** Test with: invalid API key, model not found, network timeout, malformed image. Ensure each returns a structured error dict (not raw exception). Confirm circuit breaker state transitions.
  **Depends on:** None

---

## 🟡 MEDIUM — Polish & Edge Cases

### Backend

- [ ] **Add overdue counts to public leaderboard query** `~1.5h`
  **File:** `apps/backend/app/Http/Controllers/LeaderboardController.php`, `apps/backend/app/Models/Report.php`
  **Action:** Add `where('status', 'overdue')->count()` aggregate to leaderboard response. Include `overdue_count` field per tenant in JSON response.
  **Depends on:** None

### AI Pipeline — Regional Scenario Tests

- [ ] **PH scenario: illegal_dumping in Iloilo** `~1.5h`
  **Input:** Test image of illegal dumping site
  **Expected:** `hazard_id = illegal_dumping` → `hybrid_retrieve` returns RA-9003 (Philippine Ecological Solid Waste Management Act) → Gemini labels `Green Dingle Initiative` as relevant local action
  **Files:**
  - `apps/ai-service/hybrid_retrieve.py`
  - `apps/ai-service/data/` (legal corpus)
  **Action:** Run end-to-end. Verify Neo4j returns PH-specific legal node. Verify Gemini prompt includes PH context.
  **Depends on:** Neo4j populated with PH legal data

- [ ] **ID scenario: illegal_dumping in Jakarta** `~1.5h`
  **Input:** Test image of illegal dumping site (Indonesian context)
  **Expected:** `hazard_id = illegal_dumping` → `hybrid_retrieve` returns UU-18-2008 (Indonesian Waste Management Law) → Gemini returns Indonesian agency reference
  **Files:**
  - `apps/ai-service/hybrid_retrieve.py`
  - `apps/ai-service/data/` (legal corpus)
  **Action:** Run end-to-end. Verify Neo4j returns ID-specific legal node. Verify locale detection drives correct retrieval.
  **Depends on:** Neo4j populated with ID legal data

---

## 🔵 LOW — Demo Nice-to-Have

- [ ] **Add health check endpoint for AI service** `~30m`
  **File:** `apps/ai-service/main.py`
  **Action:** Add `GET /health` returning `{"status": "ok", "model_loaded": true, "neo4j_connected": true}`. Useful for demo dashboard.
  **Depends on:** None

- [ ] **Add request logging to AI service** `~1h`
  **File:** `apps/ai-service/main.py`
  **Action:** Log request method, path, response status, latency to stdout (structured JSON). Helps demo-time debugging.
  **Depends on:** None

---

## ⚪ POST — Post-Hackathon Backlog

- [ ] **Train custom Roboflow model** `~2-3 days`
  **Issue:** #179
  **Action:** Curate dataset from collected evidentiary images. Annotate with Roboflow annotation tool. Train YOLOv8 custom model targeting LikasLens-specific hazard classes (illegal_dumping, flood_debris, oil_spill, etc.). Evaluate mAP@50. Replace generic model endpoint in `roboflow_client.py`.
  **Depends on:** #181 (dataset annotation pipeline)

- [ ] **Dataset annotation pipeline** `~1-2 days`
  **Issue:** #181
  **Action:** Build semi-automated annotation workflow: pre-label with current model → human review → export to Roboflow format. Include active learning loop: flag low-confidence predictions for human review.
  **Depends on:** Sufficient collected images (>500 per class)

---

## Dependency Map

```
dev1 (Frontend)                    dev2 (Jeff — Backend + AI)
─────────────────                  ──────────────────────────
Google OAuth callback route  ←──── #162 Google login fix
X-XSRF-TOKEN cookie handling ←──── #177 Session retention
Notification bell component  ←──── SLA notification dispatch
EXIF strip in upload UI      ────→ AI pipeline smoke test
Public leaderboard UI        ←──── Overdue counts query
```

---

## Daily Standup Focus

| Day | Focus Area |
|---|---|
| Jun 21 (Sat) | 🔴 CRITICAL — #162 Google OAuth, session fix, end-to-end pipeline test |
| Jun 22 (Sun) | 🟠 HIGH — ResolveTenant wiring, TenantController routes, FPR validation |
| Jun 23 (Mon) | 🟠 HIGH — SLA dispatch, roboflow error handling, .env.example fix |
| Jun 24 (Tue) | 🟡 MEDIUM — PH + ID scenario tests, overdue counts |
| Jun 25 (Wed) | 🟡 MEDIUM — Bug fixes from integration testing with dev1 |
| Jun 26 (Thu) | 🔵 LOW — Health check, logging, demo rehearsal |
| Jun 27 (Fri) | 🎯 DEMO PREP — Full dry run, smoke tests, rollback plan |
| Jun 28 (Sat) | 🏆 HACKATHON SUBMISSION |

---

## Notes

- All backend routes must be Sanctum-protected and tenant-scoped.
- AI service communicates with backend **only** via OpenAPI-defined REST endpoints.
- EXIF stripping happens **before** image leaves the frontend — backend/AI never receive raw GPS.
- Composite scoring weights are configurable in `apps/ai-service/config/scoring.yaml`.
- Circuit breaker in `TriageService` trips after 3 consecutive AI service failures — resets after 60s.
