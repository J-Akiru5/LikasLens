# Roboflow Integration Plan — Hackathon Edition (Revised)

> **Deadline:** ~24 hours from now (presentation ~June 22, morning)
> **Current time:** June 21, 09:20 AM PHT
> **Remaining working hours:** ~15 usable hours

---

## ⚡ The Critical Decision: Which Path Do We Take Today?

There are two realistic options. Here's the honest comparison:

### Option A: Hosted API Shortcut (⭐ RECOMMENDED FOR TODAY)

**What it is:** Call a *pre-trained, already-hosted* garbage detection model on Roboflow's servers via their API. Zero training. Zero dataset work.

| Factor | Detail |
|--------|--------|
| **Time to working demo** | **~2 hours** |
| **What you get** | Real-time garbage/litter/plastic detection on submitted photos |
| **What you skip** | Dataset curation, annotation, training, export, model loading |
| **How it works** | Our `ai-service` sends the image to `https://serverless.roboflow.com` → gets back bounding boxes + labels → merges with existing COCO results |
| **Cost** | Free tier: $60/month in credits (~60,000 inferences). More than enough for a hackathon. |
| **Quality** | Good for waste/litter. Public models are trained on thousands of images. |
| **Risk** | Requires internet. If Roboflow API is down, detection falls back to COCO-only (already works today). |

**Candidate public models to use (no training needed):**

| Model | Model ID (approx) | Classes | Why |
|-------|-------------------|---------|-----|
| **TACO (Trash Annotations in Context)** | `taco-trash-annotations-in-context/1` | ~60 waste sub-classes (plastic bag, bottle, cup, can, carton, etc.) | Research-grade, most diverse |
| **yolov8-trash-detections** | `yolov8-trash-detections/11` | General trash, litter, plastic | High community adoption, fast |
| **Garbage Classification** | Various community projects | cardboard, glass, metal, paper, plastic, trash | Good class coverage for sorting |

> [!IMPORTANT]
> **You need to browse [Roboflow Universe](https://universe.roboflow.com) and pick the exact model.** I can't access it directly, but the process is: search "garbage detection" or "TACO" → click a project → go to the "Deploy" tab → copy the `model_id` (format: `project-name/version`). Takes ~10 minutes.

### Option B: Fork-and-Train on Roboflow

**What it is:** Fork an existing Roboflow Universe dataset (like TACO), optionally tweak it, then train a custom YOLOv8 model on Roboflow's cloud.

| Factor | Detail |
|--------|--------|
| **Time to working demo** | **~6-8 hours** (fork: 15min, train: 1-3hrs depending on dataset size, integrate: 2-3hrs, test: 1hr) |
| **What you get** | Your own model weights, deployable locally OR via API |
| **Advantage over Option A** | Model runs locally (no internet dependency), you own the weights, can fine-tune later |
| **Risk** | Training can fail or produce poor results. Roboflow free-tier training has queue times. |

### 🏆 Verdict

> [!CAUTION]
> **Go with Option A (Hosted API) today.** The fork-and-train path is a post-hackathon Day 2-3 task. With <15 hours left, spending 6-8 hours on training leaves zero margin for bugs, other issues (#177, #162), and demo prep. Option A gives you a working demo in ~2 hours and you pivot to fixing the other open bugs.

---

## 📅 Hour-by-Hour Timeline (Today)

| Time (PHT) | Duration | Task | Issue |
|------------|----------|------|-------|
| **09:30 – 09:45** | 15 min | You: Browse Roboflow Universe, pick a garbage detection model, get the `model_id`. Create free account if needed, grab API key. | #178 |
| **09:45 – 11:45** | 2 hrs | I implement: `roboflow_client.py` module, wire into `image_analysis.py` merge pipeline, add `/roboflow/health` endpoint, update `.env` config | #180 |
| **11:45 – 12:15** | 30 min | Test: Submit a garbage photo through the `/analyze` endpoint, verify Roboflow detections merge with COCO results, check triage scoring | #180 |
| **12:15 – 13:00** | 45 min | Lunch / buffer | — |
| **13:00 – 15:00** | 2 hrs | Fix session retention bug (#177) + Google login (#162) — these are critical for demo | #177, #162 |
| **15:00 – 16:00** | 1 hr | Fix high-visibility mobile bugs: leaderboard overlap (#172), citizen dashboard (#165, #166) | #172, #165, #166 |
| **16:00 – 17:00** | 1 hr | End-to-end demo walkthrough: report → image analysis → Roboflow detection → triage → routing | — |
| **17:00 – 18:00** | 1 hr | Buffer for unexpected issues | — |
| **Evening** | Flexible | Demo prep, slides, final testing | — |

---

## 🔬 What's In Scope Today vs. Post-Hackathon

### ✅ TODAY (Hackathon-Critical)

| Item | Details |
|------|---------|
| Roboflow API key setup | Create account, get API key, add to `.env` |
| `roboflow_client.py` | New module using `inference-sdk` to call Roboflow Hosted API |
| Merge into existing pipeline | Roboflow results merge into `image_analysis.py` as a third detection source alongside COCO + ENV |
| `/roboflow/health` endpoint | Connectivity check for demo |
| Composite confidence update | Three-source scoring (COCO + ENV + Roboflow) |
| Graceful fallback | If Roboflow API is unreachable, silently fall back to COCO-only |

### 🔒 v1 Detection Limitations (Acknowledged, Not Blocked On)

| Class | Status | Why |
|-------|--------|-----|
| Garbage / Litter / Plastic | ✅ Strong | Covered by public TACO/waste models |
| Water pollution | ⚠️ Weak/Absent | No good public dataset; COCO has no water pollution classes |
| Smoke / Fire | ⚠️ Weak | Some models exist but quality varies; can add post-hackathon |
| Deforestation | ❌ Absent | Very niche; requires satellite/drone imagery datasets |
| Oil spill | ❌ Absent | Requires specialized marine imagery |
| Damaged infrastructure | ⚠️ Weak | Some overlap with general object detection but not specific |

> [!NOTE]
> This is fine for the hackathon. The demo story is: *"v1 excels at waste/litter detection — the #1 reported violation type in the Philippines. Our active learning pipeline will expand to water, fire, and deforestation as field data flows in."*

### 📦 POST-HACKATHON (Deferred)

| Item | Issue | Timeline |
|------|-------|----------|
| Fork TACO dataset + train custom model | #179 (revised scope) | Week 1 post-hackathon |
| Export trained `.pt` weights for local inference | #179 | Week 1 |
| Active learning pipeline (image sync to Roboflow) | #181 | Week 2 |
| Expand to fire/smoke/water classes | New issue | Week 2-3 |
| Add our 50 field photos to training set | New issue | Week 2 |

---

## 📖 Active Learning Explained (For Someone New to MLOps)

> *You asked: "What does fine-tuning with field data actually require?"*
> Here's the full picture, explained simply.

### What Is Active Learning?

Think of it like training a new employee:

1. **Day 1:** You give them a textbook (= the public TACO dataset). They can recognize *textbook examples* of garbage.
2. **Week 2:** They start working in the field (= your app goes live). They see garbage that looks different from the textbook — Philippine street litter, tropical vegetation, muddy riverbanks.
3. **The feedback loop:** A supervisor (= admin) reviews the employee's work, corrects mistakes, and the employee gets better.

**Active learning is step 3, automated.** Your users submit photos → your admin reviews them → the corrected photos get sent back to Roboflow → the model retrains → it gets smarter at detecting *Philippine-specific* violations.

### What Does This Require on Our Backend?

Here are the 5 components, mapped to our stack:

#### 1. 📁 Image Storage (Already Exists)
**What:** When a citizen submits a report with a photo, that photo needs to be stored somewhere permanent.
**Our setup:** Photos already go to **Supabase Storage** via the report submission flow. ✅ No new work needed.

#### 2. 👀 Admin Review / Approval Gate
**What:** Before any citizen photo leaves our system for Roboflow, a human (admin/analyst) must review and approve it. This is critical for:
- **Privacy:** Ensuring no faces, license plates, or personal info leaks to a third-party service (Roboflow)
- **Label quality:** The admin confirms *what violation type* the photo actually shows (e.g., "yes, this is illegal dumping" vs "this is just a messy yard")
- **Legal:** Data leaving our system must comply with Philippine Data Privacy Act

**Implementation:**
```
Citizen submits photo → Photo stored in Supabase →
  Admin triage queue (already exists: /admin/triage) →
    Admin clicks "Approve for Training" →
      Photo gets tagged: { approved_for_training: true, violation_type: "illegal_dumping" } →
        Sits in a "training queue" table in our PostgreSQL DB
```

**New backend work needed:**
- Add `approved_for_training` boolean + `training_label` field to the tickets/reports table
- Add an "Approve for Training" button action to the admin triage UI
- Create a `training_queue` table or add a scope/query to existing tickets table

#### 3. 🔄 Sync Job (Artisan Command)
**What:** A scheduled job that takes all admin-approved photos and uploads them to Roboflow's project via their API.

**Implementation:**
```
Laravel Artisan command: php artisan roboflow:sync-images

1. Query DB for tickets WHERE approved_for_training = true AND synced_to_roboflow = false
2. For each ticket:
   a. Download the photo from Supabase Storage
   b. Strip EXIF data (privacy — per AGENTS.md Zero-Knowledge Protocol)
   c. Upload to Roboflow project via their Upload API
   d. Tag the image with the admin-assigned violation_type
   e. Mark synced_to_roboflow = true, synced_at = now()
3. Log the sync results to the audit trail
```

**This runs:** Manually (admin clicks a "Sync to Roboflow" button) or on a schedule (weekly cron).

#### 4. 🏋️ Retraining on Roboflow
**What:** After enough new images accumulate (say 50-100+), you go to Roboflow's web dashboard, review the annotations, and click "Train." Roboflow handles the GPU compute.

**This is NOT automated in v1.** You manually:
1. Log into Roboflow
2. Review the uploaded images (they'll be pre-labeled from our admin step)
3. Fix any annotation errors
4. Click "Train" → wait 1-3 hours
5. New model version appears (e.g., version 2, version 3...)

#### 5. 📋 Model Versioning
**What:** Each time you retrain, Roboflow creates a new version number. You update your `.env` to point to the new version.

```env
# Version 1 = public TACO model (hackathon)
ROBOFLOW_MODEL_ID=taco-trash/1

# Version 2 = fine-tuned with 200 Philippine field photos (post-hackathon)
ROBOFLOW_MODEL_ID=likaslens-env-violations/2

# Version 3 = added water pollution class (month 2)
ROBOFLOW_MODEL_ID=likaslens-env-violations/3
```

**Eventually this could be automated** (Roboflow webhooks notify our backend when training completes, we auto-update the model version), but that's a v3 feature.

### The Full Loop Visualized

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVE LEARNING LOOP                         │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Citizen   │───▶│ Supabase     │───▶│ Admin Triage Queue   │  │
│  │ submits   │    │ Storage      │    │ (review + approve)   │  │
│  │ photo     │    │              │    │                      │  │
│  └──────────┘    └──────────────┘    └──────────┬───────────┘  │
│                                                  │              │
│                                                  ▼              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Update    │◀───│ Roboflow     │◀───│ Sync Job             │  │
│  │ .env      │    │ Dashboard    │    │ (artisan command)    │  │
│  │ model ver │    │ (retrain)    │    │ strips EXIF, uploads │  │
│  └────┬─────┘    └──────────────┘    └──────────────────────┘  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ai-service uses new model → better detections →         │  │
│  │  citizens submit more photos → cycle continues           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 GitHub Issue Updates Needed

### Issue #179 — Revised Scope
**Old title:** "Train custom environmental violation detection model"
**New title:** "Fork TACO dataset on Roboflow + light fine-tune with field data"
**New scope:**
- Fork TACO or best waste detection dataset from Roboflow Universe
- Add our 50 field photos as supplementary training data
- Train YOLOv8n on Roboflow (post-hackathon, not today)
- Export `.pt` weights for local inference
- v1 explicitly covers waste/litter only; water/fire/deforestation deferred to v2

### Issue #181 — Bumped Priority
Active learning pipeline moves from "Phase 4" to "Phase 2" (immediately after hackathon). This is the real long-term data flywheel.

---

## Open Questions

> [!IMPORTANT]
> **Do you already have a Roboflow account and API key?** If not, you need to create one at [app.roboflow.com](https://app.roboflow.com) before I can implement anything. The free tier is sufficient for the hackathon.

> [!IMPORTANT]
> **What time is the actual presentation tomorrow?** This affects whether we have evening hours tonight or need everything locked by end of today.
