# LikasLens — Analytics Foundation Roadmap

**Target:** IPOPHIL SRT Final Judging, Sep 3 2026 (4 days out)
**Repo:** `J-Akiru5/LikasLens` @ branch `development`
**Scope:** `apps/ai-service` (new analytics module + endpoints), `apps/admin-portal` (rewire existing pages)
**Status of this doc:** written after inspecting the actual repo at commit `5e9ccb5`, not from an architectural proposal alone. Every "current state" claim below was verified by reading the code.

---

## 0. Read this before writing any code

The architectural direction (Analytics discovers patterns → PRISM interprets → LGU decides) is sound and worth building. **But four of the specific implementation details in the source proposal do not match this repo's actual schema and will fail if implemented literally.** They are corrected below. Do not implement `reports.groupby("barangay")` — that column does not exist.

### Verified current state

| Claim | Reality (verified) |
|---|---|
| Group reports by barangay | **No `barangay` column exists.** `tickets` has `latitude`, `longitude`, `address_text` (free text, nullable) only. |
| Category distribution | **No `category` column exists.** The API's `category` field is `ai_triage_summary` — a free-text sentence like `"YOLOv8: 3 detection(s). Category: solid_waste."`. The structured category lives inside the `ai_analysis_raw` JSONB blob. |
| Severity statistics | **`urgency_score` is literally assigned `= ai_confidence`** in `services/triage_service.py`. Any "severity" metric built on it measures *model confidence*, not incident severity. A real severity vocabulary (`low`/`medium`/`high`/`critical`) exists in `image_analysis.py`'s indicator map but is **never persisted to a ticket column**. |
| Pandas for data transformation | **pandas is not in `requirements.txt`** (numpy is). See §2 — do not add it. |
| Analytics doesn't exist yet | **It partly does.** `apps/admin-portal/src/app/[locale]/(dashboard)/analytics/page.tsx` already computes status counts, resolution rate, and pending counts — client-side, over `getTickets({ per_page: "100" })`. It is capped at 100 records and silently wrong beyond that. |
| — | **`apps/admin-portal/.../predictions/page.tsx` calls a dead endpoint.** `getAdminPredictions()` → `laravelGet("/admin/predictions")` → `routeRequest()` has no handler for it → falls through to `return { success: true, data: [] }`. The page renders an empty state with **no error**, because `success` is `true`. This is a live demo landmine. |

### The real blocker is data, not code

`seed_demo.py` contains **5 tickets spread over 5 days, all in Metro Manila.** Trend analysis, growth rates, and hotspot concentration over that dataset produce either zeros or nonsense percentages (n=1 → n=2 is "+100%"). Shipping a trends endpoint against this data yields a dashboard that is *technically working and visibly meaningless*.

**Task 1 below (realistic seed data) unlocks more demo value than every other task combined.** If time runs out, do Tasks 1 and 2 and stop.

---

## 1. Decisions needed from Jeff before implementation

Do not guess these. Stop and ask.

**D1 — Schema migration, yes or no?**
Options:
- **(a) Migrate:** add `category VARCHAR` + `severity VARCHAR` columns to `tickets`, backfill from `ai_analysis_raw`, write them on triage. Clean, correct, makes every downstream query trivial.
- **(b) Derive at query time:** extract category from `ai_analysis_raw->>'...'` in the analytics query with a fallback to parsing `ai_triage_summary`. No schema change, no migration risk.

Trade-off: (a) is the right long-term answer but it's a schema change on a shared Supabase instance 4 days before a competition, and the mobile/frontend/admin apps all read this table. (b) is uglier and slower but touches nothing outside the analytics module. **Recommendation: (b) for Sep 3, (a) after.** Jeff decides.

**D2 — The dead predictions page: implement, or hide?**
Options: port hotspot detection into the AI service now (real work, Task 4), or feature-flag the nav item off so nothing empty is on screen during the demo. **Recommendation: hide it for Sep 3 unless Task 4 finishes cleanly with time to spare.** An absent page is invisible; an empty page invites "so it doesn't work?"

**D3 — Does `urgency_score` get fixed, or documented?**
It currently equals `ai_confidence`. If the demo shows anything labelled "severity" or "urgency," that label is wrong. Either derive real severity from the `image_analysis.py` indicator map, or rename every UI label to "AI confidence" and don't claim severity. **Do not ship a severity metric that is secretly confidence.**

---

## 2. Library decisions — corrected

**Do NOT add pandas to the AI service for Sep 3.**

Reasoning: every aggregation in the Phase-1 scope is a `GROUP BY` over a Postgres table already reachable via async SQLAlchemy. Doing it in SQL is one round trip returning a handful of rows. Doing it in pandas means `SELECT *` — pulling the entire tickets table over the wire into a memory-constrained Render instance, on an image that already carries `ultralytics` + `torch`. That is strictly worse on latency, memory, and cold-start size, and it gets worse as the table grows. Pandas earns its place when you need rolling windows and resampling that are genuinely awkward in SQL — and even those are reachable with `date_trunc` + window functions at this scale.

- **SQLAlchemy `func.count` / `func.date_trunc` / window functions → the aggregation layer.** This is the actual implementation.
- **numpy → already present**, fine to use for the small statistical bits (stddev, percentile) if needed.
- **pandas / seaborn / matplotlib → development-only, not in `requirements.txt`.** Legitimate for exploring the data and validating that an aggregation is correct before writing the SQL version. Never in the request path.

If the pitch wants to name the analytics stack honestly: *"aggregations run in Postgres; pandas and seaborn were used to validate the analytical model during development."* That is true and defensible under questioning. "We use pandas in production" would not survive a judge asking where it runs.

---

## 3. Phase 1 scope — what actually ships by Sep 3

Ordered by value. Stop wherever time runs out; each task leaves the system in a shippable state.

### Task 1 — Realistic seed dataset *(highest leverage, do first)*

Rewrite `apps/ai-service/seed_demo.py` to generate a defensible demo dataset:

- **90 days** of history (not 5), with `created_at` distributed non-uniformly — the trend endpoints need something to actually detect.
- **~150–300 tickets.** Enough that percentages are meaningful, small enough to seed fast.
- **Iloilo / Western Visayas coordinates**, not Metro Manila. Dingle, Pototan, Passi, Iloilo City. The judges are being pitched a Philippine LGU system by an Iloilo team — Metro Manila coordinates undercut that.
- **Category mix drawn from the real routing vocabulary** in `services/triage_service.py`: `illegal_dumping`, `solid_waste`, `water_pollution`, `air_pollution`, `deforestation`, `illegal_burning`, `sewage_discharge`, `chemical_spill`, `noise_pollution`. Do not invent new category strings.
- **Deliberate, explainable patterns** — the analytics must have something true to find:
  - one barangay-scale cluster with rising `illegal_dumping` over the last 30 days
  - one category in clear decline
  - a realistic resolved/unresolved split per the `ALLOWED_TRANSITIONS` state machine in `db/models.py`
  - a subset with `ghost_mode=True` and correctly fuzzed coordinates (run them through `services/ghost_mode.fuzz_location`, don't hand-write fuzzed values)
- Populate `ai_analysis_raw` with a structurally realistic blob, not `None` — the analytics layer reads from it under decision D1(b).
- Make it idempotent and re-runnable (clear prior demo rows, or upsert on a marker).

### Task 2 — Server-side analytics endpoints

New module `apps/ai-service/analytics/` + router at prefix `/api/v1/analytics`, matching the existing router convention in `routers/`.

```
apps/ai-service/
├── analytics/
│   ├── __init__.py
│   ├── aggregations.py   # counts, distributions — SQL GROUP BY
│   ├── trends.py         # daily/weekly series, growth rate — date_trunc + window fns
│   ├── hotspots.py       # grid-cell concentration (see Task 4)
│   └── schemas.py        # Pydantic response models
└── routers/
    └── analytics.py      # /api/v1/analytics/*
```

Endpoints for Phase 1:

| Endpoint | Returns |
|---|---|
| `GET /api/v1/analytics/summary` | total reports, by status, resolution rate, median time-to-resolution (from `resolved_at - created_at`), all over the **full table** — not a 100-row page |
| `GET /api/v1/analytics/categories` | category distribution + share, per D1's resolution |
| `GET /api/v1/analytics/trends?days=30` | daily counts series + period-over-period growth rate, overall and per category |

Rules:
- Every endpoint returns structured JSON. No chart images, no server-rendered plots. Frontend already has its visualization stack.
- Every response includes a `meta` block: `{ total_reports_analyzed, window_days, generated_at }`. A number without its denominator is not an analytic.
- **Ghost-mode safety is non-negotiable.** These endpoints aggregate over a table that contains `reporter_user_id` and `ghost_mode`. Never select, return, or group by identity fields. Re-read `services/ghost_mode.py:IDENTITY_FIELDS` before writing a query. An aggregate that lets you narrow to n=1 is a de-anonymisation vector — apply a minimum-cell-size floor (suppress or bucket any group with fewer than 5 reports) on anything location-scoped.
- Auth: mirror the existing pattern. LGU-scoped analytics use `require_lgu_role`; anything intended for the public landing page uses the `/api/v1/public` prefix and returns nothing identity-adjacent.

### Task 3 — Rewire the admin analytics page

`apps/admin-portal/src/app/[locale]/(dashboard)/analytics/page.tsx` currently fetches 100 tickets and aggregates in the browser. Replace those computations with calls to the new endpoints. Keep the existing visual components and layout — this is a data-source swap, not a redesign. Add the API client functions to `apps/shared/src/api/` following the existing export pattern in `admin.ts`.

Delete the client-side `statusCounts` / `resolutionRate` computation once the endpoint is live. Leaving both paths in place means two sources of truth that will disagree.

### Task 4 — Hotspots *(only if Tasks 1–3 are done and verified)*

**Do not attempt barangay attribution.** It requires PSGC boundary polygons + point-in-polygon lookup, and it directly conflicts with ghost mode — fuzzed coordinates snap to a ~1km grid, and a 1km cell straddles barangay boundaries, so any barangay label on a ghost report would be a guess presented as a fact.

Use the **grid cell as the spatial unit instead.** `services/ghost_mode.fuzz_location` already rounds to a 0.01° (~1km) grid — reuse exactly that function as the bucketing key so ghost and non-ghost reports land in the same coordinate space. Report hotspots as grid cells with a representative centroid and a nearby-place label derived from `address_text` where available, explicitly labelled as approximate.

This is not a downgrade to explain away — it is the honest spatial resolution the data supports, and "our hotspot resolution is deliberately capped at 1km because reporter anonymity is a design guarantee" is a stronger answer to a judge than a barangay name that might be wrong.

---

## 4. Explicitly out of scope for Sep 3

- **Predictive / forecasting models.** Trend direction from a 30-day window is honest; "may experience increased incidents next month" from 90 days of synthetic data is not a claim to make under questioning.
- **PRISM prescriptive layer (Level 4).** Wiring a second Gemini call into the demo path adds latency and a new live failure mode on stage. The architecture diagram can show it as designed-for; the demo shouldn't depend on it.
- **Neo4j graph analytics.** Neo4j is already load-bearing for routing with a circuit breaker around it. Don't add a second consumer 4 days out.
- **Any new infrastructure** — no queue, no warehouse, no separate analytics service, no scheduled jobs. Compute on request; cache later if it's ever slow.

---

## 5. Definition of done

- [ ] Seed script produces 90 days of Iloilo-based tickets with a detectable trend, and is re-runnable
- [ ] `/api/v1/analytics/summary`, `/categories`, `/trends` return correct values verified against a hand-checked SQL query — not just "the endpoint returned 200"
- [ ] Admin analytics page reads from the API, client-side aggregation removed
- [ ] No identity field appears in any analytics response; small-cell suppression applied to location-scoped aggregates
- [ ] Predictions page either works or is hidden — it does not render a silent empty state
- [ ] Nothing labelled "severity" is actually `ai_confidence`
- [ ] `pandas` is not in `requirements.txt`
- [ ] Endpoints work against the deployed Render service, not just locally

---

## 6. Known adjacent issue (do not fix in this task, but be aware)

`AI_SERVICE_API_KEY` gates the Gemini/Roboflow endpoints in `main.py`, and `verify_api_key()` no-ops entirely when it is unset. Confirm it is configured on Render before the demo. Flagged here only so it isn't discovered on Sep 3 — it is out of scope for this analytics work.
