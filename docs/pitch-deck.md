# LikasLens — Pitch Deck (7 Slides)

> **ASEAN AI Hackathon 2026**
> **Design:** Eco-Brutalism (dark green/neon/amber palette)
> **Target:** 5-7 minute presentation

---

## Slide 1 — Title

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              L I K A S L E N S                      │
│                                                     │
│     Every Citizen's Phone is an Environmental       │
│     Sensor.                                         │
│                                                     │
│     [LikasLens Logo — Leaf/Lens Icon]               │
│                                                     │
│     Neuro-Symbolic Civic Reporting                   │
│     for the ASEAN Region                            │
│                                                     │
│     ASEAN AI Hackathon 2026                         │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "Likas" = Filipino for "natural" / "inherent"
- "Lens" = the lens through which citizens document environmental truth
- Tagline captures our philosophy: democratizing environmental monitoring
```

---

## Slide 2 — The Problem

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ENVIRONMENTAL CRIMES IN ASEAN                   │
│     ARE GOING UNREPORTED                            │
│                                                     │
│     ┌──────────┬──────────┬──────────┐              │
│     │  Illegal │   Water  │ Wildlife │              │
│     │  Logging │ Pollution│Traffick- │              │
│     │          │          │   ing    │              │
│     ├──────────┼──────────┼──────────┤              │
│     │ $30B+ annual economic cost (World Bank)       │
│     │ 5.7M hectares of forest lost annually (ASEAN) │
│     │ 70% of environmental crimes unreported        │
│     │ Whistleblowers face physical danger           │
│     └────────────────────────────────────────┘      │
│                                                     │
│     THE GAP: Citizens witness crimes but lack       │
│     safe channels to report them. Agencies lack     │
│     real-time intelligence and legal traceability.  │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "Environmental crime is the 4th largest illicit enterprise globally"
- "ASEAN is disproportionately affected — 15% of global tropical forests, 34% of coastal mangroves"
- "Citizens see it every day. They just can't report it safely."
```

---

## Slide 3 — Our Solution

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     LIKASLENS: 4 CORE CAPABILITIES                  │
│                                                     │
│     1️⃣ CAPTURE & REPORT                             │
│        Photo + GPS → One-tap submission             │
│        Works offline with PWA + IndexedDB queue     │
│                                                     │
│     2️⃣ NEURO-SYMBOLIC AI                            │
│        YOLOv8 detects hazard → Gremlin graph        │
│        traces it through LAW → AGENCY →             │
│        JURISDICTION → Gemini 2.5 Flash brief        │
│                                                     │
│     3️⃣ GHOST MODE (Zero-Knowledge)                  │
│        EXIF stripping, anonymous submission,        │
│        no server-side identity linkage              │
│                                                     │
│     4️⃣ ASEAN GRAPH DATABASE                         │
│        6 countries, 25+ laws, 10+ agencies          │
│        Transboundary routing via Gremlin            │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "We don't just classify what's in the photo"
- "We reason about which law was broken, who enforces it, and where jurisdiction lies"
- "Ghost Mode is not a toggle — it's a zero-knowledge protocol"
```

---

## Slide 4 — Architecture

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     SYSTEM ARCHITECTURE                             │
│                                                     │
│     ┌─────────┐     ┌─────────┐     ┌──────────┐   │
│     │ Next.js │     │ Laravel │     │ FastAPI  │   │
│     │ PWA     │────▶│ API     │────▶│ YOLOv8   │   │
│     │ :3000   │     │ :8000   │     │ Gemini   │   │
│     └─────────┘     └───┬─────┘     └────┬─────┘   │
│          │              │                │         │
│          │              ▼                ▼         │
│          │         ┌─────────┐     ┌──────────┐   │
│          │         │  MySQL  │     │  Cosmos  │   │
│          │         │  (RDB)  │     │  Gremlin │   │
│          │         └─────────┘     │  (Graph) │   │
│          │                         └──────────┘   │
│          ▼                                         │
│     ┌─────────┐                                    │
│     │Supabase │    Auth + Social Login              │
│     │  Auth   │                                    │
│     └─────────┘                                    │
│                                                     │
│     All services communicate via REST JSON          │
│     OpenAPI contracts. PWA deploys on Vercel.       │
│     Backend + AI on Azure.                          │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "Three services, strictly separated, communicating only via REST"
- "Next.js PWA is installable on any device — no app store needed"
- "Cosmos Gremlin handles the graph traversal for neuro-symbolic reasoning"
```

---

## Slide 5 — Neuro-Symbolic AI Pipeline

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     FROM REPORT TO ENFORCEMENT IN <5 SECONDS        │
│                                                     │
│     ┌──────────────────────────────────────────┐    │
│     │ REPORT: "Illegal logging near forest      │    │
│     │          boundary, Negros Occidental"     │    │
│     └────────────────┬─────────────────────────┘    │
│                      ▼                               │
│     ┌──────────────────────────────────────────┐    │
│     │ YOLOv8: Detects logged stumps, heavy     │    │
│     │         machinery → hazard: deforestation │    │
│     └────────────────┬─────────────────────────┘    │
│                      ▼                               │
│     ┌──────────────────────────────────────────┐    │
│     │ GREMLIN GRAPH TRAVERSAL:                 │    │
│     │  illegal_logging ──violates──▶ PD-705    │    │
│     │  PD-705 ──enforced_by──▶ Forest Watch    │    │
│     │  PD-705 ──governed_by──▶ PH-NATIONAL     │    │
│     └────────────────┬─────────────────────────┘    │
│                      ▼                               │
│     ┌──────────────────────────────────────────┐    │
│     │ GEMINI 2.5 FLASH: Generates natural-    │    │
│     │  language incident brief for agency      │    │
│     └──────────────────────────────────────────┘    │
│                                                     │
│     This is not classification. It is REASONING.    │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "The Gremlin graph is the secret weapon — it connects hazards to laws, agencies, and jurisdictions"
- "Same pipeline handles transboundary incidents — haze from Indonesia triggers Singapore laws"
- "Gemini generates a human-readable brief that any agency officer can act on"
```

---

## Slide 6 — Ghost Mode & Offline PWA

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     SAFETY + RELIABILITY                            │
│                                                     │
│     LEFT COLUMN                RIGHT COLUMN          │
│     ────────────               ────────────          │
│     GHOST MODE                 OFFLINE PWA           │
│                                                     │
│     🔒 EXIF stripped         📦 IndexedDB queue     │
│     🔒 GPS removed           📡 Auto-sync on         │
│     🔒 Device ID cleared       reconnect             │
│     🔒 No user linkage       🗂️  Three-tier cache:   │
│     🔒 Anonymous submission    • Static: CacheFirst  │
│                                • API data: SWR       │
│                                • Dynamic: NetFirst   │
│                                                     │
│     "The evidence is real.     "No internet?         │
│      The reporter is            No problem."         │
│      invisible."                                      │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "Ghost Mode was designed for the Philippines, where environmental defenders are the second-deadliest country for activists"
- "The PWA handles spotty ASEAN field connectivity — 4G is not everywhere"
- "The offline queue means field workers in remote forests can submit reports that sync when they return to town"
```

---

## Slide 7 — Impact & Roadmap

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     IMPACT TODAY            WHAT'S NEXT             │
│     ────────────            ────────────            │
│                                                     │
│     ✅ 6 ASEAN countries    🔜 NGO pilot in Negros   │
│     ✅ 25+ laws indexed        Occidental, PH       │
│     ✅ 18 hazard types      🔜 Capacitor APK for     │
│     ✅ Offline-capable PWA     community installs    │
│     ✅ Zero-knowledge Ghost 🔜 Cambodia, Laos,       │
│        Mode                    Myanmar data         │
│                              🔜 Satellite imagery    │
│                                 cross-referencing    │
│                              🔜 Multi-language       │
│                                 AI briefs (Thai,     │
│                                 Vietnamese, Bahasa)  │
│                                                     │
│     LIKASLENS                                                │
│     Every citizen's phone is an environmental       │
│     sensor.                                         │
│                                                     │
│     [QR code to demo / repo]                        │
└─────────────────────────────────────────────────────┘

Speaker notes:
- "We started with the Philippines as our pilot — 16 laws, 5 NGOs, verified with real legal data"
- "ASEAN expansion is our core differentiator — no other platform covers 6 countries with jurisdictional routing"
- "Our next phase is NGO partnerships for field validation and community distribution"
- "Thank the judges. Open for questions."
```

---

## Design Notes (for slide builder)

| Element | Value |
|---------|-------|
| Primary color | `#1B4332` (deep forest green) |
| Secondary | `#2DE1C2` (neon teal/cyan) |
| Accent | `#FFB703` (amber/yellow) |
| Font (headings) | Montserrat, 700-900 weight, uppercase |
| Font (body) | Inter, 400-500 weight |
| Font (code/data) | Space Mono |
| Border style | 4px solid, brutalist (no border-radius) |
| Shadow | `8px 8px 0px #1B4332` (hard offset) |
| Ghost Mode variant | Invert: dark background `#081C15`, neon accents |
| Logo | Lens icon overlapping a leaf silhouette |

### Slide deck file recommendations:
- **Google Slides** — easiest to collaborate and present
- **Canva** — if you want the Eco-Brutalism aesthetic with custom graphics
- **Figma / PowerPoint export** — for offline presentation backup
