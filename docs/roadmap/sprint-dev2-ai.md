# Developer 2 — AI Services

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 26h
> **Assigned To:** Jeff
> **Focus:** Environmental YOLOv8 model, Gremlin graph seeding, Gemini prompts
> **Status:** ✅ **COMPLETE** — All tasks delivered

---

## Team Roster (Updated)

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | Lou | Frontend/UI | Next.js UI, Tailwind, responsive design, Ghost Mode theme |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Gremlin graph, Gemini |
| Dev 3 | Charlyn | Backend/Infrastructure | Laravel API, Supabase, CI/CD, admin portal |
| Dev 4 | Katherine | Integration/PWA/APK | E2E testing, PWA offline, Capacitor APK, demo prep |

> **Note:** Roseby is no longer on the team. Katherine moved from Dev 1 to Dev 4. Lou joined as Dev 1.

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Status | Notes |
|------------|------|-----------|--------|-------|
| Supabase connection | Dev 3 (Charlyn) | Thu evening | ✅ Resolved | DB accessible, seeders running |
| Test images | Dev 4 (Katherine) | Sat | ✅ Resolved | Demo images tested |
| Azure AI Service deployment | Dev 3 (Charlyn) | Sun | 🔄 In Progress | Deploy via ghcr.io (ACR deleted; CI/CD now pushes to GitHub Container Registry) |

---

## Day 1 — Thursday, June 5

### Task 1.1: Research Community Environmental YOLOv8 Models
**Time:** 3h | **Priority:** HIGH | **Status:** ✅ COMPLETE

**Result:** Selected `HrutikAdsare/waste-detection-yolov8` from HuggingFace. Model downloaded at Docker build time via `huggingface-hub`. Custom-trained YOLOv8 for waste/trash detection with good inference speed (nano variant).

**Acceptance Criteria:**
- [x] At least 1 environmental model identified and downloaded
- [x] Model tested on sample images
- [x] Performance metrics documented (mAP, inference speed)
- [x] Decision: use model as-is (no fine-tuning needed)

---

### Task 1.2: Integrate Environmental Model into `image_analysis.py`
**Time:** 5h | **Priority:** HIGH | **Status:** ✅ COMPLETE

**File modified:** `apps/ai-service/image_analysis.py` (+382 lines rewritten)

**What was built:**
- Dual-model detection: COCO (`yolov8n.pt`) + environmental (`waste-detection-yolov8`)
- `ENV_MODEL_CLASS_MAP` updated with actual model classes
- Results merged with deduplication logic
- Environmental detections include severity levels
- Fallback to COCO-only if environmental model fails
- `/analyze/model` endpoint reports both models

**Acceptance Criteria:**
- [x] Environmental model loads at startup
- [x] Dual inference runs on each image (COCO + environmental)
- [x] Results merged with deduplication
- [x] Environmental detections include severity levels
- [x] Fallback to COCO-only if environmental model fails
- [x] `/analyze/base64` endpoint returns enhanced results

---

## Day 2 — Friday, June 6

### Task 2.1: Seed All 16 PH Laws into Gremlin Graph
**Time:** 5h | **Priority:** CRITICAL | **Status:** ✅ COMPLETE

**File modified:** `apps/ai-service/gremlin_upserts/baseline_rules.py` (+478 lines)

**What was built:**
- All 16 PH environmental law vertices with full properties
- 5 baseline jurisdictions (Region VI focus)
- Enforcement agency vertices (DENR, MGB, EMB, etc.)
- `governed_by` and `enforced_by` edges connecting laws → jurisdictions → agencies
- Idempotent upserts (safe to re-run)

**Acceptance Criteria:**
- [x] All 16 laws exist as vertices in Gremlin graph
- [x] Each law has correct properties (code, title, agency, jurisdiction)
- [x] `/graph/topology` returns all 16 laws
- [x] No duplicate vertices on re-run (idempotent upserts)

---

### Task 2.2: Add Violation Types + Hazard-Law Edges
**Time:** 3h | **Priority:** CRITICAL | **Status:** ✅ COMPLETE

**What was built:**
- 11 ViolationType vertices (4 existing + 7 new)
- 18 HazardType vertices
- 40 edges total: `violates`, `enforced_by`, `classified_from`
- Each violation linked to correct PH law

**New Violation Types Seeded:**

| Code | Name | Linked Law |
|------|------|------------|
| `ILLEGAL-LOGGING` | Illegal Logging / Deforestation | PD-705 |
| `WILDLIFE-TRAFFICKING` | Wildlife Trafficking | RA-9147 |
| `MARINE-POLLUTION` | Marine Pollution | PD-979 |
| `OPEN-BURNING` | Open Burning | RA-8749 |
| `MANGROVE-DESTRUCTION` | Mangrove Clearing | RA-7611 |
| `CORAL-REEF-DAMAGE` | Coral Reef Destruction | RA-9147 |
| `PROTECTED-AREA-INTRUSION` | Protected Area Violation | RA-7586 |

**Acceptance Criteria:**
- [x] 7+ new ViolationType vertices in Gremlin
- [x] 9+ HazardType vertices in Gremlin
- [x] `violates` edges connect violations to correct laws
- [x] `/routing/traversal` shows full hazard→law→agency chains

---

## Day 3 — Saturday, June 7

### Task 3.1: Seed ASEAN-Relevant Hazard Types
**Time:** 3h | **Priority:** MEDIUM | **Status:** ✅ COMPLETE

**File created:** `apps/ai-service/gremlin_upserts/asean_expansion.py` (391 lines)

**What was built:**
- 5 new ASEAN jurisdiction vertices (ID, TH, VN, MY, SG)
- 1 anchor environmental law per country
- 1 enforcement agency/NGO per country
- `governed_by`, `enforced_by`, `violates` edges connecting ASEAN hazards → ASEAN laws
- Supports `--dry-run` and `--gremlin` output modes

**ASEAN Hazards Seeded:**

| Hazard | Region | Laws (PH placeholder) |
|--------|--------|----------------------|
| `peatland_fire` | Indonesia, Malaysia | RA-8749 (air) |
| `rubber_plantation_encroachment` | Thailand, Cambodia | PD-705 (forestry) |
| `hydropower_displacement` | Laos, Vietnam | PD-1586 (EIA) |
| `sand_dredging` | Cambodia, Vietnam | PD-1067 (water) |
| `mangrove_conversion_aquaculture` | Vietnam, Thailand | RA-7611 (palawan) |
| `transboundary_haze` | Indonesia, Malaysia, Singapore | RA-8749 (air) |

**Acceptance Criteria:**
- [x] 6+ ASEAN-specific HazardType vertices
- [x] Each linked to closest PH law equivalent
- [x] Graph traversal returns ASEAN hazards

---

### Task 3.2: Update Gemini System Prompt for Environmental Education
**Time:** 3h | **Priority:** MEDIUM | **Status:** ✅ COMPLETE

**File modified:** `apps/ai-service/chat_proxy.py` (+30 lines)

**What was built:**
- "Likasy" persona with environmental education focus
- Ghost Mode safety guidance for dangerous situations
- Eco-credit system explanation capability
- Philippine law references (RA-9003, RA-8749, RA-9275, PD-705, etc.)
- Grade 8 reading level, non-legal-advisor disclaimer

**Acceptance Criteria:**
- [x] `/api/v1/chat` uses new environmental persona
- [x] Likasy explains laws correctly (references actual law codes)
- [x] Likasy recommends Ghost Mode for dangerous situations
- [x] Likasy explains eco-credit system
- [x] Response quality tested with 5 sample queries

---

## Day 4 — Sunday, June 8

### Task 4.1: End-to-End AI Pipeline Testing
**Time:** 3h | **Priority:** CRITICAL | **Status:** ✅ COMPLETE

**Test Results:**
1. **YOLOv8 Detection** — Dual-model detection working (COCO + environmental)
2. **Gremlin Routing** — 16 laws + 11 violation types + 18 hazard types all traversable
3. **Gemini Summary** — Hazard analysis endpoint returns correct law references
4. **Chatbot** — Likasy persona active with Ghost Mode + eco-credit guidance

**Acceptance Criteria:**
- [x] All 4 test categories pass
- [x] No hallucinated laws in Gemini output
- [x] Gremlin traversal returns correct agency for each hazard
- [x] Environmental model detections are accurate

---

### Task 4.2: Fix Integration Issues
**Time:** 1h | **Priority:** HIGH | **Status:** ✅ COMPLETE

**Commit:** `fa080d4` — "fix(ai): make service deployment-ready"

**Fixes applied:**
- Dockerfile: replaced broken `load_model()` with proper COCO + ENV model preload
- Added HuggingFace model download step in Docker build
- Added `.gitignore` for `models/` directory
- CORS origins configurable via `CORS_ORIGINS` env var
- Preload both models at startup in lifespan handler
- Switched from deprecated `google-generativeai` to `google-genai`
- Added `huggingface-hub` to requirements.txt

**Acceptance Criteria:**
- [x] AI service starts cleanly with new model
- [x] `/health` endpoint works
- [x] `/analyze/model` reports environmental model info
- [x] Dockerfile builds successfully

---

## Risk Items

| Risk | Status | Mitigation |
|------|--------|-----------|
| No community environmental model found | ✅ Resolved | `HrutikAdsare/waste-detection-yolov8` from HuggingFace |
| Model inference too slow | ✅ Resolved | Using `yolov8n` (nano) variant for speed |
| Gremlin connection fails | ✅ Resolved | Fallback handling in `gremlin_client.py`; Cosmos DB online |
| Gemini hallucinates laws | ✅ Resolved | System prompt explicitly forbids invented laws; tested |

---

## Definition of Done

- [x] Environmental YOLOv8 model integrated and detecting hazards
- [x] All 16 PH laws seeded in Gremlin graph
- [x] 7+ violation types with hazard→law→agency edges
- [x] 6+ ASEAN-specific hazard types seeded
- [x] Gemini chatbot has environmental persona (Likasy)
- [x] Full AI pipeline tested end-to-end
- [x] No hallucinated laws in any output
- [x] Service deployment-ready (Dockerfile, CORS, model preload)
