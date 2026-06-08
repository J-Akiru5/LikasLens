# LikasLens — ASEAN AI Hackathon One-Pager

---

## The Problem

**Environmental crimes in ASEAN go unreported.** Citizens witness illegal logging, water pollution, wildlife trafficking, and transboundary haze — but lack accessible, safe channels to report them. Existing systems are fragmented, country-specific, and expose whistleblowers to retaliation. Meanwhile, enforcement agencies lack real-time intelligence connecting incidents to the specific laws being violated.

The World Bank estimates environmental crime costs ASEAN economies **$30+ billion annually** — from illegal fishing to deforestation.

---

## Our Solution: LikasLens

**LikasLens** is a neuro-symbolic civic reporting platform that transforms every citizen's smartphone into an environmental sensor. Citizens capture evidence of environmental hazards, and our AI pipeline automatically traces the incident through laws, enforcement agencies, and jurisdictions — all while protecting reporter identities with zero-knowledge Ghost Mode.

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
| **AI Service** | FastAPI + YOLOv8 + Gemini 2.5 Flash | Hazard classification, incident brief generation |
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

## Impact Metrics

| Metric | Target |
|--------|--------|
| Countries covered | 6 ASEAN nations |
| Environmental laws indexed | 25+ |
| Enforcement agencies connected | 10+ |
| Hazard types detectable (YOLOv8) | 18 |
| Violation classifications | 11 |
| Offline reliability | 100% queue retention |
| Report-to-agency latency | <5 seconds (online) |

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

## What's Next

1. **NGO pilot partnerships** — deploy in Negros Occidental, Philippines with Forest Watch and Bantay Kalikasan
2. **Mobile APK distribution** — Capacitor-wrapped PWA for community installs
3. **Additional ASEAN countries** — Cambodia, Laos, Myanmar, Brunei law data
4. **Satellite imagery cross-referencing** — validate citizen reports against remote sensing data
5. **Multi-language AI reports** — Gemini incident summaries in Thai, Vietnamese, Bahasa

---

**LikasLens** — *Every citizen's phone is an environmental sensor.*
