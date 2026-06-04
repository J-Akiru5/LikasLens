# Developer 2 — AI Services

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 26h
> **Focus:** Environmental YOLOv8 model, Gremlin graph seeding, Gemini prompts

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| Supabase connection | Dev 3 (Backend) | Thu evening | Need DB accessible for violation type seeding |
| Test images | Dev 4 (Integration) | Sat | Demo images of environmental hazards for testing |
| Azure AI Service deployment | Dev 3 (Backend) | Sun | Deploy updated model to production |

---

## Day 1 — Thursday, June 5

### Task 1.1: Research Community Environmental YOLOv8 Models
**Time:** 3h | **Priority:** HIGH

**Search for pre-trained YOLOv8 models that detect environmental hazards:**

**Target Models (in order of preference):**
1. **Waste Detection** — `yolov8-waste-detection` (trash, litter, illegal dumping)
2. **Deforestation Detection** — Satellite/aerial imagery models for tree canopy loss
3. **Smoke/Fire Detection** — `yolov8-fire-detection` for open burning, factory emissions
4. **Water Pollution** — Oil spill, turbidity detection models

**Search Sources:**
- Ultralytics Hub: https://hub.ultralytics.com/
- Roboflow Universe: https://universe.roboflow.com/
- HuggingFace: https://huggingface.co/models?search=yolov8+environment
- GitHub: search "yolov8 waste detection", "yolov8 deforestation"

**Acceptance Criteria:**
- [ ] At least 1 environmental model identified and downloaded
- [ ] Model tested on sample images
- [ ] Performance metrics documented (mAP, inference speed)
- [ ] Decision: use model as-is OR fine-tune on additional data

---

### Task 1.2: Integrate Environmental Model into `image_analysis.py`
**Time:** 5h | **Priority:** HIGH

**File to modify:** `apps/ai-service/image_analysis.py`

**Current State:** Uses `yolov8n.pt` (COCO classes) with generic object mappings.

**Target State:** Use environmental model alongside COCO model for dual detection.

**Implementation Plan:**

```python
# Add environmental model loading
ENV_MODEL_PATH = os.getenv("ENV_MODEL_PATH", "models/yolov8-waste.pt")

class EnvironmentalDetector:
    def __init__(self):
        self.coco_model = YOLO("yolov8n.pt")  # Keep COCO for general objects
        self.env_model = YOLO(ENV_MODEL_PATH)  # Environmental-specific

    def analyze(self, image):
        coco_results = self.coco_model(image)
        env_results = self.env_model(image)
        return self.merge_detections(coco_results, env_results)
```

**Update `ENVIRONMENTAL_INDICATORS` mapping:**
```python
ENVIRONMENTAL_INDICATORS = {
    # From environmental model
    "trash": {"type": "solid_waste", "severity": "high"},
    "litter": {"type": "solid_waste", "severity": "medium"},
    "illegal_dumping": {"type": "solid_waste", "severity": "critical"},
    "smoke": {"type": "air_pollution", "severity": "high"},
    "fire": {"type": "open_burning", "severity": "critical"},
    "oil_spill": {"type": "water_pollution", "severity": "critical"},
    "deforestation": {"type": "habitat_destruction", "severity": "critical"},
    # Keep COCO fallbacks
    "bottle": {"type": "solid_waste", "severity": "low"},
    "cup": {"type": "solid_waste", "severity": "low"},
}
```

**Acceptance Criteria:**
- [ ] Environmental model loads at startup
- [ ] Dual inference runs on each image (COCO + environmental)
- [ ] Results merged with deduplication
- [ ] Environmental detections include severity levels
- [ ] Fallback to COCO-only if environmental model fails
- [ ] `/analyze/base64` endpoint returns enhanced results

---

## Day 2 — Friday, June 6

### Task 2.1: Seed All 16 PH Laws into Gremlin Graph
**Time:** 5h | **Priority:** CRITICAL

**File to modify:** `apps/ai-service/gremlin_upserts/baseline_rules.py`

**Current State:** Only 2 laws seeded (RA-9003, RA-8749).

**Target State:** All 16 Philippine environmental laws as vertices.

**Laws to Add:**

| Law Code | Title | Hazard Types |
|----------|-------|-------------|
| RA-9729 | Climate Change Act of 2009 | climate_change, adaptation |
| RA-10121 | DRRM Act of 2010 | disaster_risk, flooding |
| RA-9003 | Solid Waste Management Act | illegal_dumping, waste ✅ (exists) |
| RA-8749 | Clean Air Act | air_emission, open_burning ✅ (exists) |
| RA-9275 | Clean Water Act | water_pollution, discharge |
| RA-6969 | Toxic Substances Act | hazardous_waste, chemical |
| PD-1586 | Environmental Impact System | project_eia |
| PD-1151 | Philippine Environmental Policy | framework |
| PD-979 | Marine Pollution Decree | oil_spill, marine_pollution |
| PD-1067 | Water Code | water_resources |
| PD-856 | Code on Sanitation | sanitation, public_health |
| RA-7611 | Strategic Env Plan for Palawan | biodiversity, palawan |
| AM-09-6-8-SC | Writ of Kalikasan | judicial_enforcement |
| PD-705 | Revised Forestry Code | illegal_logging, deforestation |
| RA-9147 | Wildlife Conservation Act | wildlife_trafficking |
| RA-7586 | NIPAS Act | protected_areas |

**Gremlin Query Pattern:**
```python
g.addV('Law')
  .property('id', 'RA-9729')
  .property('law_code', 'RA-9729')
  .property('title', 'Climate Change Act of 2009')
  .property('issuing_agency', 'CCC')
  .property('jurisdiction_scope', 'national')
  .property('country', 'PH')
```

**Acceptance Criteria:**
- [ ] All 16 laws exist as vertices in Gremlin graph
- [ ] Each law has correct properties (code, title, agency, jurisdiction)
- [ ] `/graph/topology` returns all 16 laws
- [ ] No duplicate vertices on re-run (idempotent upserts)

---

### Task 2.2: Add Violation Types + Hazard-Law Edges
**Time:** 3h | **Priority:** CRITICAL

**Add ViolationType vertices and `violates` edges:**

**New Violation Types:**

| Code | Name | Linked Law |
|------|------|------------|
| `ILLEGAL-LOGGING` | Illegal Logging / Deforestation | PD-705 |
| `WILDLIFE-TRAFFICKING` | Wildlife Trafficking | RA-9147 |
| `MARINE-POLLUTION` | Marine Pollution | PD-979 |
| `OPEN-BURNING` | Open Burning | RA-8749 |
| `MANGROVE-DESTRUCTION` | Mangrove Clearing | RA-7611 |
| `CORAL-REEF-DAMAGE` | Coral Reef Destruction | RA-9147 |
| `PROTECTED-AREA-INTRUSION` | Unauthorized Entry to Protected Areas | RA-7586 |

**Gremlin Edge Pattern:**
```python
g.addV('ViolationType')
  .property('id', 'ILLEGAL-LOGGING')
  .property('code', 'ILLEGAL-LOGGING')
  .property('name', 'Illegal Logging / Deforestation')

g.V('ILLEGAL-LOGGING').addE('violates').to(g.V('PD-705'))
  .property('confidence', 1.0)
  .property('source', 'philippine-law')
```

**Also seed HazardType vertices:**
```python
hazard_types = [
    'illegal_logging', 'open_burning', 'mangrove_clearing',
    'oil_spill', 'wildlife_trafficking', 'coral_reef_damage',
    'illegal_dumping', 'chemical_spill', 'sand_mining'
]
```

**Acceptance Criteria:**
- [ ] 7+ new ViolationType vertices in Gremlin
- [ ] 9+ HazardType vertices in Gremlin
- [ ] `violates` edges connect violations to correct laws
- [ ] `/routing/traversal` shows full hazard→law→agency chains

---

## Day 3 — Saturday, June 7

### Task 3.1: Seed ASEAN-Relevant Hazard Types
**Time:** 3h | **Priority:** MEDIUM

**Add hazard types common across ASEAN:**

| Hazard | Region | Laws (PH placeholder) |
|--------|--------|----------------------|
| `peatland_fire` | Indonesia, Malaysia | RA-8749 (air) |
| `rubber_plantation_encroachment` | Thailand, Cambodia | PD-705 (forestry) |
| `hydropower_displacement` | Laos, Vietnam | PD-1586 (EIA) |
| `sand_dredging` | Cambodia, Vietnam | PD-1067 (water) |
| `mangrove_conversion_aquaculture` | Vietnam, Thailand | RA-7611 (palawan) |
| `transboundary_haze` | Indonesia, Malaysia, Singapore | RA-8749 (air) |

**Acceptance Criteria:**
- [ ] 6+ ASEAN-specific HazardType vertices
- [ ] Each linked to closest PH law equivalent
- [ ] Graph traversal returns ASEAN hazards

---

### Task 3.2: Update Gemini System Prompt for Environmental Education
**Time:** 3h | **Priority:** MEDIUM

**File to modify:** `apps/ai-service/chat_proxy.py`

**Current:** Generic Gemini chatbot with no environmental persona.

**Target:** "Likasy" as an environmental education assistant.

**New System Prompt:**
```
You are Likasy, the AI assistant for LikasLens — a civic environmental reporting platform for ASEAN.

Your role:
1. Help citizens understand environmental hazards they encounter
2. Explain Philippine environmental laws (RA-9003, RA-8749, RA-9275, PD-705, etc.) in simple terms
3. Guide users on how to file environmental reports safely
4. Educate about Ghost Mode for anonymous reporting of dangerous situations
5. Explain the eco-credit reward system and how citizens earn rewards

Guidelines:
- Use simple, accessible language (grade 8 reading level)
- Reference specific Philippine environmental laws when relevant
- Always prioritize citizen safety — recommend Ghost Mode for illegal logging, mining, or organized crime
- Never reveal the identity of anonymous reporters
- Be encouraging — every report helps protect the environment
- For non-Philippine users, acknowledge their local laws may differ

You are NOT a legal advisor. Always recommend consulting a lawyer for legal matters.
```

**Acceptance Criteria:**
- [ ] `/api/v1/chat` uses new environmental persona
- [ ] Likasy explains laws correctly (references actual law codes)
- [ ] Likasy recommends Ghost Mode for dangerous situations
- [ ] Likasy explains eco-credit system
- [ ] Response quality tested with 5 sample queries

---

## Day 4 — Sunday, June 8

### Task 4.1: End-to-End AI Pipeline Testing
**Time:** 3h | **Priority:** CRITICAL

**Test the full pipeline:**

1. **YOLOv8 Detection Test**
   - Upload test image of waste/trash → expect `solid_waste` detection
   - Upload test image of smoke/fire → expect `air_pollution` detection
   - Upload test image of forest → expect `vegetation` (informational)

2. **Gremlin Routing Test**
   - `POST /routing/incident` with `illegal_logging` → expect PD-705 + DENR
   - `POST /routing/incident` with `illegal_dumping` → expect RA-9003 + NSWMC
   - Verify all 16 laws are reachable via traversal

3. **Gemini Summary Test**
   - `POST /api/v1/analyze-hazard` with hazard_id → expect 2-sentence summary
   - Verify summary references correct law codes
   - Verify no hallucinated laws

4. **Chatbot Test**
   - "What is RA-9003?" → expect correct explanation
   - "I saw illegal logging, what should I do?" → expect Ghost Mode recommendation
   - "How do eco-credits work?" → expect reward system explanation

**Acceptance Criteria:**
- [ ] All 4 test categories pass
- [ ] No hallucinated laws in Gemini output
- [ ] Gremlin traversal returns correct agency for each hazard
- [ ] Environmental model detections are accurate

---

### Task 4.2: Fix Integration Issues
**Time:** 1h | **Priority:** HIGH

- Fix any issues found during E2E testing
- Ensure AI service starts cleanly with new model
- Verify `/health` endpoint still works
- Update `/analyze/model` to report environmental model info

---

## Risk Items

| Risk | Mitigation |
|------|-----------|
| No community environmental model found | Use COCO model + expanded environmental keyword mapping as fallback |
| Model inference too slow | Use `yolov8n` (nano) variant for speed; batch processing later |
| Gremlin connection fails | Cosmos DB has fallback handling; test with local Gremlin if needed |
| Gemini hallucinates laws | System prompt explicitly forbids invented laws; test thoroughly |

---

## Definition of Done

- [ ] Environmental YOLOv8 model integrated and detecting hazards
- [ ] All 16 PH laws seeded in Gremlin graph
- [ ] 7+ violation types with hazard→law→agency edges
- [ ] Gemini chatbot has environmental persona
- [ ] Full AI pipeline tested end-to-end
- [ ] No hallucinated laws in any output
