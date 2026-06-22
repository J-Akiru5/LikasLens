# LikasLens — Winning Submission Action Plan

> Path from "impressive architecture, unproven claims" → measured, demo-able, ASEAN-credible.
> Grounded in the actual codebase (every item points to a real file that already exists or needs a small change).

---

## The diagnosis in one sentence

Both experts are saying the **same thing**: the architecture is impressive but **unproven with numbers**, and the regional-scalability claim is **asserted, not demonstrated**. The good news: the repo already contains most of the evidence — it's just not in the report, and two gaps need real work.

### What the critique is really asking (translated)

| Judge said | What they actually mean |
|---|---|
| "no accuracy figures at all" / "never reports measured performance" | **We don't trust unmeasured AI in a legal-impact tool.** This is the #1 eliminator. |
| "specify the datasets, images, classes, licenses" | **Is this real or prompt-engineered?** Prove the model exists and was trained. |
| "validated on real ASEAN field imagery or only COCO?" | **Does it work HERE, or only in a Western lab?** |
| "false-positive rate… wrong flag carries legal/social consequences" | **You're literally a justice system. Show us you measured the harm rate.** |
| "what happens when LGU cannot reach/respond" | **Does this loop actually close, or does the report vanish?** |
| "expands beyond Philippine pilot… different laws affect the legal graph layer" | **Is the graph actually multi-jurisdictional, or is "ASEAN" just branding?** |
| "track reporting until resolution on different government agencies" | **Show ONE end-to-end traceable example across an agency boundary.** |
| "video… end-to-end flow" | **We can't verify a system we can't see run.** |

### Scorecard: what the code actually proves vs. what the report claims

✅ **Already exists and is real** (just not surfaced in the report):

- `apps/ai-service/image_analysis.py` — real YOLOv8n + dual-model + Roboflow fusion with a published composite-score formula (`compute_composite_score`) and a **3-tier triage gate** (`triage_disposition`: ≥0.70 auto-route / 0.40–0.69 review / <0.40 dismiss). This is a false-positive control mechanism the report never mentions.
- `apps/ai-service/eval_metrics.py` — a **complete** mAP@0.5 / precision / recall / per-class / p50+p95 latency harness. Exists but was never run (`routing_scores.json` is empty `{}`).
- `apps/ai-service/neo4j_upserts/baseline_rules.py` — **16 real Philippine laws** (RA 9729, RA 9003, RA 8749, PD 979, etc.) mapped to issuing agencies, seeded into Neo4j. The grounding layer is real, not hallucinated.
- `apps/ai-service/routing_learner.py` — a real learned-router that tracks avg resolution hours per (violation, LGU) and weights routing by inverse latency. This is the "tracking until resolution" answer — empty now, but the mechanism exists.
- `apps/ai-service/graph_rag.py` — hybrid graph + vector retrieval with jurisdiction filtering; already references `ID-NATIONAL` (Indonesia) in code, but no ID laws are seeded.

⚠️ **Gaps that will cost points if unfilled:**

- `routing_scores.json = {}` — the "self-improving router" has no data. The "track until resolution" question has no evidence to point to.
- No Indonesian/Vietnamese/etc. laws seeded — so "ASEAN scalability" is currently just the PH graph + a code comment.
- The report itself has **zero numbers** — not even the ones the existing harness can produce.

---

## The fastest path to a winning submission (in order)

### 1. 🔴 Generate the metrics (run the harness that already exists)

You already built `apps/ai-service/eval_metrics.py`. You need ~150–200 labeled images (even hand-labeled by the team counts as a "regional field set" — call it what it is). Output goes into a rewritten Section 4 with a KPI table:

```
mAP@0.5 | Precision | Recall | FPR (false-positive rate) | p50/p95 latency
```

This single table converts both experts' #1 complaint from "no numbers" to "measured, per-class, with harm rate." **Per-class precision/recall is what they explicitly asked for.**

**Steps:**
- Assemble a labeled image set (~150 images, Iloilo/Guimaras coastal + urban waste).
- Set `LIKASLENS_METRICS_LOG=/path/to/inference.jsonl` and run inference over the set.
- Hand-label a `ground_truth.jsonl` (one line per image: `{"image_id", "classes", "has_violation"}`).
- Run `python eval_metrics.py --log … --ground-truth … --output metrics_report.json`.
- Insert the resulting `summary` block into the rewritten report Section 4.

### 2. 🟡 Seed Indonesia (make "ASEAN" demonstrable)

Add ~6 Indonesian laws to `apps/ai-service/neo4j_upserts/baseline_rules.py` with `jurisdictionCode: ID-NATIONAL`:
- UU 32/2009 — Environmental Protection & Management (PPLH)
- UU 18/2008 — Waste Management
- UU 27/2007 — Coastal & Small Island Management
- UU 41/1999 — Forestry
- PP 22/2021 — Environmental Approval / AMDAL
- UU 32/2014 — Marine (amending 27/2007)

`graph_rag.py` already handles jurisdiction filtering. After seeding, "ASEAN scalable" = *"here's PH + ID running on the same traversal, switchable by jurisdiction."* That's a demo-able claim, not a slogan.

**Verify:** `query_hazard_laws_and_agencies(hazard_code, location, jurisdiction="ID-NATIONAL")` returns ID laws + agencies.

### 3. 🟡 Draft ONE concrete cross-agency traceability example + escalation policy

Pick a real incident type (e.g., coastal illegal dumping in Guimaras) and walk it through end-to-end:

1. Detection → routed to **DENR-EMB Region VI** per **RA 9003**.
2. Escalates to **PCG (Philippine Coast Guard)** under **PD 979** if the dumping reaches the marine buffer.
3. Resolution time recorded by `routing_learner.py` (the `record_resolution()` / `get_best_lgu()` mechanism).

This is Expert 2's exact ask: *"is it really possible to track until resolution across agencies?"* — answer: yes, here's the trace.

**Escalation policy** (Expert 1's "what happens when LGU cannot reach/respond"):
- SLA: if no LGU acknowledgement within **48h**, auto-escalate to the parent agency node in the graph (e.g., DENR regional → DENR central).
- Notify the originating citizen of the escalation (closes the loop on Ghost Mode reporting).
- Implement as a timeout hook on top of `routing_learner` (1 paragraph in the report + small code addition).

### 4. 🔴 Rewrite the report (lead with numbers + FP story, 800–1000 words)

Restructure so the report **opens** with measured performance and the triage-gate false-positive containment story, not architecture:

- **New Section 4 (Assessment of AI Output)** — lead with the KPI table, then explicitly state: *"Any composite confidence below 0.70 is never auto-routed — it parks in human review. The model cannot trigger enforcement action above the FP rate of the ≥0.70 band, which measured X%."* This directly answers "wrong flag carries legal consequences."
- Keep the Gemini-fish-corral incident (Section 6) — it's strong and uniquely yours.
- Trim redundant architecture prose (Section 3) to make room for numbers within the word cap.

### 5. 🟢 Record the demo video (~4 min, narrated, end-to-end)

Only the team can record this, but an exact shot-list can be handed over from the existing `docs/demo-script.md`. The required flow:

```
image captured → (EXIF strip, <50ms) → YOLOv8 detect
→ graph traversal (show the actual Neo4j path: HazardType → ENFORCED_BY → Agency)
→ Gemini summary → LGU verify → Eco-Credit
```

They literally said: *"Showing it working would close that gap."* Backup screenshots in `docs/demo-backups/` plus a pre-recorded fallback clip (per the existing demo-script pre-flight checklist) so a live failure doesn't sink the pitch.

---

## Tier ranking (impact per effort)

| Priority | Item | Why it matters |
|---|---|---|
| 🔴 Tier 1 | **#1 Metrics** | Converts the #1 eliminator ("no numbers") into measured evidence |
| 🔴 Tier 1 | **#4 Rewrite report** | The numbers are worthless if they're not in the submission |
| 🟡 Tier 2 | **#2 Seed Indonesia** | Makes "ASEAN" demonstrable instead of asserted |
| 🟡 Tier 2 | **#3 Cross-agency trace + escalation** | Directly answers both experts' process questions |
| 🟢 Tier 3 | **#5 Demo video** | Highest leverage but team-only; use existing shot-list |

---

## Sequencing recommendation

Run **#1 (metrics) + #2 (Indonesia seed) + #4 (rewrite)** together — those three flip both experts' core objections in a single pass. #3 (traceability write-up) and #5 (video) follow naturally once the data exists.

> **Net:** the architecture is already there. The fix is *measured evidence* (metrics), *one more jurisdiction* (Indonesia), *one concrete trace* (cross-agency), and *showing it run* (video). None of it requires re-architecting — only running what's built and writing it up honestly.
