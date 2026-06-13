# LikasLens — ASEAN AI Hackathon One-Pager

---

## The Problem

> **The Problem.** "In Guimaras Province, 2023: illegal aquaculture expansion cleared 28 hectares of coastal mangrove in a single week. A year later, the barangay upstream recorded its worst flooding event in two decades. The connection was only confirmed after the damage was done. LikasLens detects the clearing in real time. The flood never had to happen."

**REDD+ angle:** Verified incident data from LikasLens feeds South Pole / Verra MRV chains for carbon market access under Paris Agreement Article 6.

---

## Our Solution: LikasLens

**LikasLens** is a neuro-symbolic civic reporting platform that transforms every citizen's smartphone into an environmental sensor. Citizens capture evidence of environmental hazards, and our AI pipeline automatically traces the incident through laws, enforcement agencies, and jurisdictions — all while protecting reporter identities with zero-knowledge Ghost Mode.

*Prevention over post-mortem response. The same verified data feed is REDD+ MRV-eligible — turning local monitoring into carbon market revenue.*

**LikasLens** — *Every citizen's phone is an environmental sensor.*

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  CITIZEN REPORTS        │  AI CLASSIFIES    │  SYSTEM RESPONDS  │
│  ─────────────          │  ────────         │  ────────         │
│  1. Capture photo/video │  3. YOLOv8 hazard │  6. Gremlin graph  │
│     with GPS auto-tag   │     detection     │     traversal      │
│                         │                  │                    │
│  2. Select incident     │  4. Triaging      │  7. Match hazard   │
│     type + describe     │     pre-check     │     → law → agency │
│                         │                  │     → jurisdiction  │
│  (Ghost Mode strips     │  5. Gemini 2.5    │                    │
│   EXIF metadata before  │     Flash incident│  8. Route to        │
│   transmission)         │     summary       │     correct NGO     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | Next.js 14 PWA + Tailwind | Citizen app, offline-capable with IndexedDB queue |
| **Backend API** | Laravel 12 (PHP) + Sanctum | Report ingestion, user management, leaderboard |
| **Auth** | Supabase Auth | Identity, social login |
| **AI Service** | FastAPI + YOLOv8 Nano + Gemini 2.5 Flash | Hazard classification, incident brief generation |
| **Graph DB** | Cosmos DB Gremlin | Neuro-symbolic routing: hazard → law → agency → jurisdiction |
| **PWA Offline** | Service Worker + IndexedDB | Three-tier caching, offline report queue, auto-sync |

---

## Key Innovations

### 1. Neuro-Symbolic AI Pipeline
Unlike traditional classification-only systems, LikasLens uses a Gremlin knowledge graph to **reason about incidents** — tracing detected hazards through the specific environmental laws they violate, identifying the correct enforcement agency, and routing reports to the appropriate jurisdiction. This is not just "what is it?" — it's "what law was broken, who enforces it, and where?"

### 2. Ghost Mode (Zero-Knowledge Protection)
Environmental whistleblowers in ASEAN face real physical danger. Ghost Mode strips all EXIF metadata (GPS, device ID, timestamp) before transmission, uses anonymous submissions, and ensures **no server-side linkage** between reporter identity and report content. The evidence is real; the reporter is invisible.

### 3. ASEAN Jurisdiction Graph
The Gremlin graph spans **6 ASEAN countries** (PH, ID, TH, VN, MY, SG) with 25+ environmental laws, 10+ enforcement agencies, and jurisdiction vertices at national, provincial, and regional levels. Transboundary incidents (e.g., haze crossing from Indonesia to Singapore) are traced across borders.

### 4. Offline-First PWA
Field reporters often lack connectivity. The PWA caches critical resources with a three-tier strategy (Cache-First, Stale-While-Revalidate, Network-First) and queues reports in IndexedDB for automatic sync when connectivity returns. **No data is ever lost.**

---

## Reach

6 ASEAN countries · 25+ environmental laws · 10+ enforcement agencies · 18 hazard types · 11 violation classifications

## Impact Metrics

| Metric | Target |
|--------|--------|
| YOLOv8 Nano inference | <= 250ms on Android <= 2GB |
| mAP@0.5 (5 hazard classes) | >= 0.72 |
| Precision / Recall | >= 0.78 / >= 0.70 |
| Community corroboration | >= 2 GPS-diverse reports / 500m |
| Ghost Mode EXIF strip | <= 50ms on-device |
| Cosmos legal routing | 100% agency-correct on 20 test cases |
| Eco-Credit issuance | <= 5s post LGU confirmation |
| Demo repeatability | 3 scenarios replayable |

---

## ASEAN Scalability

LikasLens is built for ASEAN from day one:

- **Multi-currency eco-credits** — PHP, IDR, THB, VND, MYR, SGD already seeded
- **Country-specific laws** — each country has its anchor environmental legislation in the graph
- **Jurisdictional routing** — national, provincial, and regional vertices enable precise agency matching
- **Language-ready** — Next.js i18n with `next-intl` for localization
- **PWA distribution** — no app store needed; installable from URL

---

## Team

| Role | Member |
|------|--------|
| Frontend / PWA | Dev 1 |
| AI / Neuro-symbolic | Dev 2 |
| Backend / API | Dev 3 |
| Integration / DevOps / ASEAN Data | Dev 4 |

---

## Roadmap

- **0–3 months:** NGO pilot in Negros Occidental, PH (Forest Watch, Bantay Kalikasan). Capacitor-wrapped APK for community installs. First REDD+ MRV pilot with one community partner.
- **3–6 months:** Cambodia, Laos, Myanmar, Brunei law data. Multi-language AI briefs (Thai, Vietnamese, Bahasa). Satellite imagery cross-referencing for high-confidence auto-confirmation.
- **6–12 months:** Indonesia and Vietnam national rollouts. South Pole / Verra MRV chain integration. Government API partnerships in 2+ ASEAN countries.

---

**REDD+ eligible:** Verified incident data feeds South Pole / Verra MRV chains for carbon market access under Paris Agreement Article 6.

**LikasLens** — *Every citizen's phone is an environmental sensor.*
