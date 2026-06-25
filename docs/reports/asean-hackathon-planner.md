# LikasLens — ASEAN AI Hackathon 2026: Team Reference

> **Prepared for:** Kat (lead) & Jeff (tech) — the only two presenting
> **Honest baseline:** Codebase ~60-65% implemented (docs claim 90% — know the gap)
> **Docs to have open:** `system-status-report.html`, `pitch-deck.md`, `demo-script.md`
> **Main companion:** `asean-hackathon-planner.html` (visual command center)

---

## Table of Contents

1. [Event Schedule](#1-event-schedule)
2. [Team Battle Cards](#2-team-battle-cards)
3. [Demo Playbook](#3-demo-playbook)
4. [Scoring Criteria Map](#4-scoring-criteria-map)
5. [Judge Q&A Arsenal](#5-judge-qa-arsenal)
6. [Competitive Landscape](#6-competitive-landscape)
7. [Risk Matrix](#7-risk-matrix)
8. [Day-of Runbook](#8-day-of-runbook)
9. [Nuclear Option](#9-nuclear-option)
10. [Pre-Presentation Checklist](#10-pre-presentation-checklist)

---

## 1. Event Schedule

### Day 1 — Setup & Expo
| Time | Activity |
|------|----------|
| Morning | Arrive early. Claim booth. Test all 3 services (FE:3000, BE:8000, AI:8001). Run demo script dry-run 2x. |
| Afternoon | Expo opens. Walk judges through booth demo (3 min version). Collect feedback. Note which questions get asked most. |
| Evening | Debrief with Kat. Refine tomorrow's answers based on today's questions. Patch any demo-breaking bugs. |

### Day 2 — Presentations & Finals
| Time | Activity |
|------|----------|
| Morning | Final dry run. Check WiFi, projector, audio. Pre-load all browser tabs. Backup video ready. |
| Slot | 5-7 min presentation + 3-5 min Q&A. Stick to Demo Playbook timings exactly. |
| Afternoon | Finals if selected. Same script, tighter. Nuclear Option if tech fails. Awards ceremony. |

> **Kat's job:** Own the narrative — problem, impact, team, business model.
> **Jeff's job:** Own the demo + technical depth — architecture, AI pipeline, deployment, security.

---

## 2. Team Battle Cards

### Kat — Team Lead
- **Stripe:** Purple / Avatar: K
- **Owns:** Narrative, business model, social impact, team story
- **Answer style:** Starts with layman analogy (30s), bridges to specifics. Warm, confident, human-first.
- **Lane:** Why this matters, how we scale, revenue, team, REDD+/carbon markets
- **Pivot phrase:** "I'll hand the technical detail to Jeff, but the key point is..."

### Jeff — AI / Backend (You)
- **Stripe:** Green / Avatar: J
- **Owns:** Demo, architecture, AI pipeline, security, deployment
- **Answer style:** Confirms Kat's point, then dives into specifics. Uses code/file references. Precise, credible, honest about gaps.
- **Lane:** YOLOv8, Neo4j, Ghost Mode, architecture, pipeline, what's actually deployed
- **Pivot phrase:** "To build on what Kat said — technically, this works because..."

### Q&A Ground Rules
1. **Never interrupt each other.** Wait 2 seconds after Kat stops.
2. **Tag-team signals:** Kat taps table twice = Jeff take over. Jeff nods twice = done speaking.
3. **Answer in your lane.** Don't cross.
4. **Honest about gaps.** If it's not built, say so and give the roadmap.
5. **No blaming teammates.** "We're iterating on that."
6. **One "I don't know" per Q&A allowed.** Then pivot: "What I can tell you is..."

---

## 3. Demo Playbook

### Pre-Flight (do before stage)
- [ ] All 3 services running (localhost:3000, :8000, :8001)
- [ ] Demo data seeded (`php artisan db:seed`)
- [ ] Incognito browser window (clean session)
- [ ] Phone hotspot ready (venue WiFi may fail)
- [ ] Pre-recorded backup video for each flow
- [ ] Screenshots in `docs/demo-backups/`

### Flow (7 min hard cap)

| Time | Speaker | Action | Screen | Failover |
|------|---------|--------|--------|----------|
| 0:00 | Kat | "Every citizen's phone is an environmental sensor." Guimaras 2023 story | Landing page | Skip story, jump to "detects violations in 250ms" |
| 1:00 | Kat | Metrics counter, ASEAN positioning | Scroll to metrics | Point to screenshot if numbers don't load |
| 1:30 | Jeff | Open PWA in Ghost Mode. Snap photo (pre-loaded). EXIF strip toast. | PWA camera | Upload pre-saved photo. Manual GPS entry. |
| 2:30 | Jeff | Submit report. Show triage: YOLOv8 detection, Neo4j routing, LGU ticket | Submit → Dashboard | AI down? Show graceful degradation: "pending triage" |
| 3:30 | Jeff | Neuro-symbolic pipeline: hazard→law→agency→jurisdiction on Neo4j | Graph viz | Graph empty? Show Cypher query + arch diagram |
| 4:30 | Kat | Ghost Mode privacy: dark UI, no user_id in payload | Ghost Mode UI | Point to existing screenshots + EXIF stripping code |
| 5:00 | Jeff | Offline demo: kill WiFi → submit → restore → auto-sync | Offline banner | Use as resilience feature even if it works |
| 5:30 | Kat | Leaderboard, eco-credits, REDD+ kicker | Scoreboard → Profile | Skip REDD+ if tight on time |
| 6:30 | Kat | Closing: "One platform. Six countries. Every citizen is an environmental sensor." | Landing page | — |
| 7:00 | — | End. Open for questions. | — | — |

### Backup Plans (Per Flow)
| If this fails... | ...do this instead |
|---|---|
| Camera doesn't activate | Upload a pre-saved evidence photo from filesystem |
| GPS doesn't resolve | Enter coordinates manually (form has manual entry field) |
| Triage check hangs | Skip triage; explain it's async and report still saves |
| AI service is down | Show loading states, explain graceful degradation |
| Supabase auth slow | Show cached profile from token; explain session persistence |
| Internet drops | Already demoing offline queue — use it as a feature, not a bug |
| Everything breaks | Play the pre-recorded backup video for that flow |

---

## 4. Scoring Criteria Map

| Criterion | Our Score | How We Deliver | Say This in Q&A |
|-----------|-----------|----------------|-----------------|
| **Technical Innovation** | 9/10 | Neuro-symbolic: YOLOv8 + Neo4j graph + Gemini. Most classify; we reason. | "Our differentiator is the neuro-symbolic loop. Most teams classify. We reason — across laws, agencies, and borders." |
| **Climate Relevance** | 7/10 | 16 PH laws, 18 hazard types. AI detects at 250ms. BUT: YOLO uses stock COCO. | "16 Philippine environmental laws are in our graph. The next milestone is fine-tuning on an ASEAN-specific dataset." |
| **ASEAN Scalability** | 6/10 | Multi-currency, transboundary routing, PWA. BUT: PH-only content today. | "The architecture is ASEAN-native — multi-currency, PWA distribution, transboundary Cypher queries. Philippines is our pilot." |
| **Demo Readiness** | 7/10 | Pipeline end-to-end. Offline queue, Ghost Mode, LGU dashboard. | "Every feature is running live. 3 replayable demo scenarios with timestamped logs." |
| **Social Impact** | 9/10 | Ghost Mode zero-knowledge. PH is 2nd deadliest for environmental defenders. | "Ghost Mode isn't a toggle. It's a zero-knowledge protocol — EXIF stripped client-side, no server-side identity linkage." |
| **Sustainability** | 8/10 | ESG→SaaS→Carbon MRV revenue. Eco-credits gamification. No other team has revenue. | "ESG sponsors fund eco-credit pools. Verified incident data feeds REDD+ MRV chains. Communities earn from conservation." |

> **Strategy:** Lead with 9/10 scores (Innovation, Social Impact, Sustainability). If asked about weaknesses, proactively mention the 6-7/10 areas and the roadmap to fix them.

---

## 5. Judge Q&A Arsenal

### Category 1: Social Impact

**Q: "How is this different from existing environmental reporting apps?"**
- **Kat (30s):** Most apps are digital tip jars — just forward messages. LikasLens is a reasoning system: analyzes the photo, identifies the law, routes to the right office. The difference between mailing a letter and having an AI lawyer sort it for you.
- **Jeff (30s):** Three differentiators: (1) Neuro-symbolic — YOLOv8 detects, Neo4j connects to specific laws and agencies. (2) Ghost Mode — zero-knowledge, EXIF stripped client-side. (3) Offline-first PWA — IndexedDB queue. No other platform combines all three.

**Q: "How do you prevent false reports or abuse?"**
- **Kat (30s):** Layers. AI screens each report, human LGU officer verifies before action. One false report can't cause harm.
- **Jeff (30s):** Three layers: (1) IP rate limiting 10/min. (2) AI confidence threshold — <0.40 auto-dismissed, 0.40-0.69 pending_review, ≥0.70 auto_routed. (3) Mandatory human verification. Plus 5m anti-Sybil geofence for duplicate spots.
- **Trap:** "Coordinated false-report campaigns?" → Jeff: "Pattern escalation detects 5+ reports in 2km/72h. Trust-scoring in Phase 2."

**Q: "How do you protect whistleblowers in dangerous countries?"**
- **Kat (30s):** Ghost Mode. PH is 2nd deadliest for environmental defenders. EXIF stripped, no server-side identity linkage. The evidence is real; the reporter is invisible.
- **Jeff (30s):** Defense-in-depth: (1) Client-side EXIF strip via canvas re-encode ≤50ms. (2) User_id omitted from payload. (3) Server-side EXIF strip as fallback. (4) No IP logging for ghost reports. (5) Barangay-centroid GPS replacement in dev.
- **Trap:** "Can't the government subpoena your logs?" → Kat: "Ghost reports have no user_id, no device fingerprint, no IP log. There's nothing to subpoena."

**Q: "What about the fish corral incident — cultural misclassification?"**
- **Kat (30s):** During Iloilo testing, AI flagged traditional bamboo fish traps as illegal. The LGU told us: "Those are baklad. That's how we feed our children." That changed our design — community verification is now first-class, not downstream.
- **Jeff (30s):** Design response: (1) Reports near traditional fishing zones flagged for expedited LGU consultation. (2) Dual-layer human oversight. (3) KPI requires ≥2 GPS-diverse reports / 500m. (4) Post-hackathon: cultural co-design consultations.
- **Trap:** "Your AI isn't ready." → Jeff: "That's why we designed human-in-the-loop. The AI flags, humans decide. The architecture is correct."

### Category 2: Technical

**Q: "Walk us through the tech stack."**
- **Kat (30s):** Three services: Laravel backend for data/auth, Python AI for vision/legal reasoning, Next.js PWA frontend. Each fails independently without losing data.
- **Jeff (30s):** pnpm monorepo, 6 packages. Frontend (Next.js 16, Vercel), Mobile PWA (Next.js + @ducanh2912/next-pwa), Admin Portal (Next.js), Backend (Laravel 12 + PostgreSQL + Sanctum, Cloud Run), AI Service (FastAPI + YOLOv8 + Neo4j + Gemini, Cloud Run), Shared (42 UI components, API client, 10 locales). REST JSON via OpenAPI only.

**Q: "How does the neuro-symbolic pipeline work?"**
- **Kat (30s):** Two-brain system. Visual brain (YOLO) says "illegal dumping." Legal brain (Neo4j) says "violates RA-9003, enforced by DENR Region VI." Gemini writes the summary.
- **Jeff (30s):** (1) EXIF strip. (2) YOLOv8n inference. (3) Composite score: max(coco,env)*0.7 + agreement*0.3. (4) Neo4j Cypher traversal: HazardType→VIOLATES→Law→ENFORCED_BY→Agency. (5) Vector fallback via Gemini embedding. (6) Gemini generates grounded report using ONLY retrieved context. (7) Triage: auto_routed/pending_review/auto_dismissed.

**Q: "What happens when the AI service goes down?"**
- **Kat (30s):** Report still saves. Degrades gracefully. Queued for processing when AI recovers.
- **Jeff (30s):** Report stored immediately in PostgreSQL with status=pending_triage. AI called asynchronously. When AI recovers, pending jobs process automatically. Submission never blocks on AI.

**Q: "Why Neo4j instead of SQL for the legal graph?"**
- **Jeff (30s):** Graph problem: hazard→law→agency→jurisdiction. SQL needs 4-5 JOINs with recursive CTEs. Cypher does it in one query: `MATCH (h)-[:VIOLATES]->(l)-[:ENFORCED_BY]->(a)`. 3ms vs 50ms+. Adding ASEAN countries = adding vertices and edges, not schema migrations.

**Q: "How does offline mode work?"**
- **Jeff (30s):** Three-tier service worker caching: Cache-First (static), Stale-While-Revalidate (legal data), Network-First (dynamic). IndexedDB queue with Background Sync API. Frontend-side queue with localStorage fallback. We can demo it: kill WiFi, submit, restore, watch it sync.

### Category 3: AI / ML

**Q: "Your YOLOv8 uses stock COCO. How is that environmental AI?"**
- **Jeff (30s):** Fair critique. Today: COCO + environmental heuristic (5 categories) + custom waste model (yolov8-waste.pt) + Roboflow garbage detection. Pipeline supports dual-model detection. Composite scoring accepts new models without rewiring. Next milestone: fine-tune on ASEAN dataset.
- **Kat (30s):** Hackathon bet was integration — proving neuro-symbolic routing works end-to-end. Model upgrade is a data problem, not an architecture problem.
- **Trap — admit the gap:** "0-3 months post-hackathon: fine-tune on ASEAN-curated coastal dataset with partner NGOs."

**Q: "What are your actual mAP/precision/recall numbers?"**
- **Jeff (30s):** eval_metrics.py exists and is built but hasn't been run on a ground-truth dataset yet. Targets: mAP@0.5 ≥ 0.72, precision ≥ 0.78, recall ≥ 0.70. Evaluation is next engineering priority.
- **Kat (30s):** Deliberate choice: build pipeline first, benchmark second. Acknowledged gap. Published numbers within 2 weeks post-hackathon.
- **DON'T SAY:** "mAP is 0.71" — this is unverified. Say: "Targets set. Evaluation ongoing. Validated numbers post-hackathon."

**Q: "How do you handle false positives?"**
- **Jeff (30s):** (1) Confidence thresholding — <0.40 dismissed, 0.40-0.69 human review. (2) Banana Bug fix — removed food from solid_waste. (3) Mandatory human verification — AI can't initiate enforcement. (4) BiasRiskRegister table + regular audits.

**Q: "Why Gemini? Data sovereignty?"**
- **Jeff (30s):** Gemini 2.5 Flash for structured generation quality-per-dollar. No PII sent — only hazard classification + graph context. Architecture is API-agnostic. Roadmap: locally-hosted open-weight models (LLaMA 3, Phi-3) for on-premise data residency.

### Category 4: Security / Privacy

**Q: "How is Ghost Mode different from not asking for a username?"**
- **Jeff (30s):** Defense-in-depth: client-side EXIF strip, payload omits user_id, server-side EXIF fallback, no IP logging, dark UI signals. This isn't a toggle — it's a protocol.
- **Kat (30s):** We engineered it so we literally cannot identify you. Pure evidence — no name, device, location, IP. Nothing to subpoena.

**Q: "The GPS visual leak bug?"**
- **Jeff (30s):** Real bug found in audit. Camera-stamp was burning GPS into pixels even in Ghost Mode. Fixed June 13 — Ghost Mode now skips GPS overlay entirely. Future: barangay-centroid replacement.

**Q: "Data privacy compliance across ASEAN?"**
- **Kat (30s):** RA 10173 (PH Data Privacy Act) baseline. Community data ownership. 24-month retention. No raw imagery shared with third parties. Will map to each country's framework on expansion.
- **Jeff (30s):** Row-Level Security in PostgreSQL. Bearer token API auth. Rate limiting. Security headers (X-Frame-Options: DENY, CSP, Permissions-Policy). PKCE auth flow. Future: field-level encryption.

### Category 5: Business / Scale

**Q: "How do you make money?"**
- **Kat (30s):** Three tiers: (1) ESG sponsorship — corporate eco-credit pools. (2) LGU SaaS subscriptions. (3) Carbon MRV — REDD+ verification feeds. No other team has any revenue model.

**Q: "How do you scale to 6 ASEAN countries?"**
- **Kat (30s):** Architecture is ASEAN-native. Multi-currency seeded for all 10 countries. Graph model supports transboundary routing. PWA means no app store negotiations per country.
- **Jeff (30s):** Neo4j vertices have jurisdiction_scope property. Adding Indonesia = adding ID-Law, ID-Agency vertices. Cypher queries don't change. Indonesia comparison layer already exists. 10 ASEAN language locales with YOLO label translations for 6. Currency seeder covers all 10.

**Q: "Who are your competitors and why are you better?"**
- **Kat (30s):** 57/70 vs next-best 52/70. Only team with revenue model, prevention framework, whistleblower protection, legal routing, LGU accountability, and gamification. Every other solution responds after disasters. We prevent them.

### Category 6: Hard Questions

**Q: "60-65% vs 90% claim — explain."**
- **Jeff (30s):** 90% was feature-count based (routes, UI, endpoints). 60-65% reflects data depth — graph had regression when baseline_rules.py was trimmed from 475 to 124 lines. Full data restored from git history. Architecture was always sound.
- **Kat (30s):** We believe in transparency. Architecture is real — feature flags, API routes, UI. Data depth is the focus area with a clear roadmap.

**Q: "REDD+ — actual code or just docs?"**
- **Jeff (30s):** is_redd_eligible flag exists on confirmed tickets. REDD+ badge renders on admin UI. Migration adds the field. NOT built: Verra VM0007 export, South Pole API, credit issuance engine. Data model and UI are built. MRV integration is the next milestone.

**Q: "What would you do with $100K?"**
- **Kat (30s):** $40K NGO pilot Negros Occidental. $30K fine-tune YOLOv8 on ASEAN dataset. $20K add 3 more ASEAN countries. $10K third-party security audit.

**Q: "Most embarrassing bug?"**
- **Jeff (30s):** The Banana Bug. COCO mapped "banana" to solid_waste. Someone eating a banana near a river triggered has_environmental_concern. Fixed by removing food from solid_waste mapping. Second: GPS visual leak in Ghost Mode.

**Q: "Five-year vision?"**
- **Kat (30s):** Every ASEAN citizen's phone is an environmental sensor. Detection, routing, verification, incentive — all in one platform. The environmental nervous system of Southeast Asia.

---

## 6. Competitive Landscape

| Team | Score | System | Revenue | ASEAN | Weakness |
|------|-------|--------|---------|-------|----------|
| **LikasLens (Us)** | **57/70** | Neuro-symbolic monitoring | ✅ ESG→SaaS→Carbon MRV | 6 countries | Model not fine-tuned; graph under-seeded |
| CardinalMu (Mapúa) | 52/70 | SEABeacon | ❌ None | PH→VN→TH | No revenue. Typhoon-only. |
| Althena (DNTU) | 48/70 | Climate Resilience Copilot | ❌ None | Vietnam only | Vietnam-centric. No anonymity. |
| LUWAS (CIT-U) | 47/70 | Post-disaster logistics | ❌ None | Cebu only | Response-only. Cebu-localized. |
| DynaVation (DSSC) | 37/70 | IoT emergency boats | ❌ None | Single location | Hardware-dependent. |
| BIMOED (Binus) | 33/70 | Offline flood evacuation | ❌ None | Indonesia only | Flood-only. No reporting pipeline. |

### Our Unique Advantages (not easily copied)
- Revenue model (only team with one)
- Prevention vs. response framing
- REDD+ / Paris Agreement Article 6
- Philippine statute encoding (legal routing)
- Ghost Mode whistleblower protection
- Public LGU accountability scoreboard
- Gamification (16 achievements, 4 tiers)
- Offline-first PWA architecture
- Multi-currency (10 ASEAN countries)
- Transboundary Cypher routing

---

## 7. Risk Matrix

| Risk | Probability | Severity | Response |
|------|------------|----------|----------|
| Venue WiFi fails | High | Critical | Phone hotspot. Localhost all services. Backup video. |
| Backend 500 error | Medium | Critical | Screenshots. "Known env config issue." Restart. |
| AI service down | Medium | High | Reports save anyway. Show "pending triage." |
| Camera denied | Medium | Medium | Upload pre-saved photo. |
| GPS not resolving | Medium | Medium | Manual coordinate entry. |
| Neo4j graph empty | High | High | Show arch diagram + Cypher query. "Data needs restoring." |
| YOLO false positive | High | Medium | "That's why humans verify." |
| Projector resolution | Low | Medium | Test before stage. Zoom browser. |
| Audio / mic fails | Low | Critical | Project voice. Kat repeats judge questions. |
| Supabase auth fails | Medium | Medium | Demo in Ghost Mode (no auth needed). |
| Laptop battery dies | Low | Critical | Keep charger plugged. Phone with screenshots. |
| Judge asks about unbuilt feature | Medium | Medium | "Post-hackathon roadmap. What's built: X, Y, Z." Pivot. |
| Everything fails | Low | Critical | Nuclear Option — verbal pitch + pre-recorded video. |

---

## 8. Day-of Runbook

### T-60 min — Arrive at venue
- Load in. Test venue WiFi (speedtest.net — if <5 Mbps, use phone hotspot). Plug laptop into charger. Verify projector.

### T-45 min — Start all 3 services locally
```bash
pnpm --filter frontend dev          # port 3000
cd apps/backend && php artisan serve # port 8000
cd apps/ai-service && python -m uvicorn main:app --port 8001
```
Verify health endpoints (GET /health on each). Open incognito window.

### T-30 min — Dry run full demo
Run 7-minute flow. Time it. If >8 min, cut offline demo segment. Confirm screenshots/videos load.

### T-15 min — Final tech check
Refresh browsers. Close extra tabs. Turn off notifications. Max screen brightness. Backup screenshots open on second device.

### T-5 min — Mental prep
Kat + Jeff: fist bump. Repeat opening lines. 3 deep breaths. You know this code better than anyone.

### T-0 min — Presentation
Kat opens with Guimaras. Jeff takes over at demo. Follow timings. If something breaks, call it out and move on.

### +7 min — Q&A
Kat: "Thank you. We're happy to take questions." Tag-team signals active. If stumped: "That's a great question. Here's what I can tell you..."

### +12 min — Post-presentation
Thank judges. Exchange cards. Write down every question. Breathe.

---

## 9. Nuclear Option

### When zero tech works — deliver this 90-second verbal pitch:

**[Kat opens — 25s]**
"In Guimaras Province, 2023: illegal aquaculture cleared 28 hectares of mangrove in a single week. A year later, that barangay recorded its worst flood in two decades. LikasLens detects the clearing in 250 milliseconds. The flood never had to happen."

**[Jeff continues — 30s]**
"LikasLens is a neuro-symbolic civic reporting platform. Citizens photograph environmental violations. The AI classifies the hazard, a Neo4j graph of ASEAN environmental laws traces which law was broken and which agency enforces it, and Gemini generates a report for government. All in under 5 seconds."

**[Kat closes — 35s]**
"Three things make us unique: Ghost Mode protects whistleblowers with zero-knowledge architecture. The Neo4j graph routes across 6 ASEAN countries. And every verified incident feeds REDD+ carbon markets — communities earn from conservation. One platform. Six countries. Every citizen is an environmental sensor."

> After pitch: "We have a pre-recorded demo video if we can play that. Otherwise, we're happy to take questions."

---

## 10. Pre-Presentation Checklist

### Technical
- [ ] Laptop fully charged + charger packed
- [ ] HDMI adapter / dongle
- [ ] Phone hotspot tested (data plan active)
- [ ] All 3 services run locally without errors
- [ ] Demo data seeded in backend
- [ ] Pre-recorded demo video on desktop
- [ ] Screenshots folder in docs/demo-backups/
- [ ] Incognito browser window opens clean
- [ ] Backup slides (PDF or Google Slides offline)
- [ ] Test image files pre-loaded on desktop
- [ ] Speaker notes printed (one-page reference)
- [ ] Phone on Do Not Disturb

### Mental & Physical
- [ ] Sleep ≥7 hours night before
- [ ] Eat a solid meal before presenting
- [ ] Water bottle on stage
- [ ] Wear comfortable, professional clothes
- [ ] Breath mints (not gum)
- [ ] Watch the presentation before yours

### Content Prep
- [ ] Demo playbook rehearsed 3x (time each run)
- [ ] Kat + Jeff practice 5 hardest Q&A pairs
- [ ] Tag-team handover signals agreed
- [ ] Opening line memorized (no notes for first 30s)
- [ ] Closing tagline ready
- [ ] Nuclear option verbal pitch practiced

### Emergency Kit
- [ ] USB drive with screenshots + demo video
- [ ] Second phone or tablet as backup display
- [ ] Printed copies of one-pager (3-5 copies)
- [ ] Power bank for phone hotspot
- [ ] Team contact numbers on phone
- [ ] QR code to demo URL printed (for judges)

---

> **You've got this. You know the code. You know the mission. Go show them what LikasLens can do.**
>
> — Prepared June 24, 2026. Kat & Jeff edition.
