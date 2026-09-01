<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://likaslens.syntaxure.dev/logos/likaslens-white.svg">
    <img src="https://likaslens.syntaxure.dev/logos/likaslens.svg" alt="LikasLens" width="320">
  </picture>
</p>

<h1 align="center">LikasLens — AI-Powered Civic Environmental Intelligence</h1>

<p align="center">
  <strong>IPOPHL SRT Innovation Contest 2026</strong> — A neuro-symbolic environmental intelligence infrastructure for Philippine governance
</p>

<p align="center">
  <a href="#-the-problem"><b>Problem</b></a> •
  <a href="#-the-solution"><b>Solution</b></a> •
  <a href="#-features"><b>Features</b></a> •
  <a href="#-architecture"><b>Architecture</b></a> •
  <a href="#-tech-stack"><b>Tech Stack</b></a> •
  <a href="#-getting-started"><b>Getting Started</b></a>
</p>

<br>

---

## 🎯 The Problem

Environmental degradation across the Philippines is accelerating — but reporting is fragmented, anonymous whistleblowing is dangerous, and government accountability is opaque.

Citizens witness violations every day — illegal logging in watersheds, open burning of agricultural waste, factories discharging into rivers, illegal fishing in protected areas, mining violations, wildlife poaching, overflowing garbage, flood hazards, and even fires consuming homes and forests — but they face three systemic barriers:

| Barrier | Impact |
|---------|--------|
| **Who to report to?** | Environmental laws span multiple agencies (DENR, PNP, LGU, NBI, PCG, etc.). Citizens don't know which one handles their specific issue. |
| **Safety risk** | Reporting illegal loggers, polluters, or serious hazards can put whistleblowers in danger. Most platforms expose reporter identity. |
| **Accountability gap** | Once a report is filed, citizens rarely know if it was acted on. There is no public record of government response. |

**If it can be captured by a camera — pollution, flooding, illegal logging, open burning, hazardous waste, wildlife crime, infrastructure damage, or a house on fire — it can be reported through LikasLens.**

---

## 💡 The Solution

**LikasLens** is a neuro-symbolic civic intelligence platform that closes the environmental accountability loop for the Philippines:

1. **📸 Snap a photo** — Any environmental violation, hazard, or emergency captured by a phone camera
2. **🤖 AI analyzes it** — YOLOv8 vision models detect the issue type, severity, and hazard class (dual COCO + environmental models + Roboflow ensemble)
3. **🧠 GraphRAG routes it** — A Neo4j knowledge graph + Gemini 2.5 Flash neural synthesis identifies the exact law violated and the government agency responsible
4. **🏛️ Publicly tracked** — Every report becomes a ticket with a transparent status. LGUs are scored on their response and resolution times
5. **🕵️ Ghost Mode protects you** — EXIF stripping, anonymous submission, GPS fuzzing to barangay centroids — zero trace left behind for dangerous reports

> **Built for the IPOPHL SRT Innovation Contest 2026** — A neuro-symbolic pipeline that identifies Philippine environmental violations, routes them to the correct enforcing agency via a Neo4j knowledge graph, and protects whistleblowers with zero-knowledge Ghost Mode. Architecture supports ASEAN expansion.

---

## 🌟 Features

### Core Platform

| Feature | Description |
|---------|-------------|
| **AI-Powered Image Analysis** | Dual YOLOv8 models (COCO + environmental) detect 80+ COCO classes + waste/fire/deforestation/water pollution classes. Roboflow Serverless API as a third ensemble model for maximum accuracy. |
| **Neuro-Symbolic Routing** | Hybrid GraphRAG pipeline — Neo4j graph traversal for exact law matching + Gemini 2.5 Flash vector search fallback. Outputs violated laws, enforcing agencies, and grounded legal summaries. |
| **Adaptive Routing Learner** | ML system that learns which LGUs resolve which violation types fastest, continuously optimizing routing decisions based on historical resolution times. |
| **Ghost Mode (Whistleblower Protection)** | End-to-end anonymous reporting: EXIF metadata stripped at capture → GPS fuzzed via barangay centroids → submitted as anonymous ghost user → zero identifiable data stored. Toggle per-report. |
| **Cryptographic Evidence Hashing** | SHA-256 evidence hashing with append-only audit trail and Supabase Vault storage for tamper-proof evidentiary chain of custody. |
| **Report Chaining & Corroboration** | GPS-proximity clustering links related reports into chains. Community corroboration (>50m distance, different user) auto-escalates priority. Anti-Sybil 5m geofence blocks spam. |
| **Public Impact Dashboard** | Real-time aggregated stats: total reports, resolution rate, reports by type, recently resolved, top barangays. Publicly accessible without login. |
| **Public Scoreboard** | LGU performance transparency — resolution rates, average response times, SLA compliance. Publicly accessible at `/public-record`. |
| **Rewards & Achievements** | Eco-credit economy: earn reward points for reporting, get achievements for milestones, redeem at partner stores (SM, Jollibee, Globe, Mercury Drug, 7-Eleven). |
| **Multi-Tenancy** | Country/jurisdiction-scoped tenants. Each tenant has its own laws, agencies, violation types, and routing rules. |
| **LGU Performance Monitoring** | Color-coded (green/amber/red) LGU card with resolution rates, SLA breaches, escalations, and platform-wide averages. |
| **SLA Engine** | Automated SLA monitoring with configurable deadlines per violation type. Automatic escalation on breach. |
| **REDD+ MRV Eligibility** | Verified deforestation/habitat destruction reports flagged as REDD+ (Reducing Emissions from Deforestation) eligible for carbon credit mechanisms. |
| **Pattern Escalation (LUWAS-Inspired)** | Detects spatial-temporal patterns — e.g. 5+ illegal dumping reports in the same barangay within 48 hours triggers automatic escalation. |
| **AI Bias Risk Register** | Ongoing audit of AI classification bias across demographics, geographies, and violation types. |
| **Predictive Hotspot Detection** | ML-based prediction of environmental violation hotspots based on historical patterns and seasonal factors. |
| **Notification System** | Real-time notifications for ticket status changes, SLA breaches, achievement unlocks, and reward redemptions. |
| **Offline Queue** | IndexedDB-backed offline report queue with automatic sync when connectivity resumes. Batch syncs up to 50 queued reports. |
| **On-Device AI (ONNX Runtime)** | YOLOv8 ONNX models run directly in the browser via WebAssembly. On-device triage works without internet connectivity. |
| **Multi-Language** | Full i18n across 10 locales (English, Filipino, Vietnamese, Indonesian, Malay, Tamil, Thai, Khmer, Burmese, Lao). Filipino, Vietnamese, and Indonesian fully translated; Tamil and Malay substantially translated; Thai, Khmer, Burmese, and Lao in progress. |
| **PDF Certificate Generation** | Download verified report certificates as PDF with blockchain evidence hashes and QR codes. |
| **Interactive Maps** | MapLibre GL + deck.gl with hexagon layers, heatmap layers, scatterplot layers, satellite overlays (NASA GIBS), and time-lapse playback. |
| **3D Globe Visualization** | Interactive 3D globe using cobe.js showing Philippine deployment with ASEAN expansion roadmap, drag-to-rotate and auto-rotation. |
| **ECharts Analytics** | Rich analytics dashboards with time-series charts, violation donut charts, Sankey flow diagrams (Source → Violation → Agency), AQI gauges, and hotspot lists. |
| **PWA + PWABuilder** | Progressive Web App with custom service worker, offline caching, push notifications, and background sync. Android `.apk`/`.aab` generated via **PWABuilder**. iOS installable via Safari home screen with native splash screen support. |
| **Likasy AI Chatbot** | Gemini-powered legal assistant that answers citizen questions about environmental laws, violations, and rights. |

### Applications

| App | Port | Audience | Capabilities |
|-----|------|----------|-------------|
| **Frontend** | `:3000` | Public & Citizens | Landing page, citizen dashboard, report submission, impact dashboard, scoreboard, laws library, contact, profile, knowledge graph, interactive maps, PDF certificates |
| **Mobile PWA** | `:3003` | Mobile Citizens | Camera-first capture, offline queue, on-device AI triage, Ghost Mode toggle, native bottom sheet, haptic feedback, onboarding carousel, iOS splash screens, wallet/rewards, achievements. Android `.apk`/`.aab` built via **PWABuilder**. iOS via PWA install guide (home screen). |
| **Admin Portal** | `:3002` | Analysts & Super Admins | Dashboard, ticket triage queue, LGU analytics, user management, NGO CRUD, laws CRUD, rewards catalog, audit logs, pattern escalation, bias register, prediction engine, notifications, bulk operations |

### Backend API

**REST API** — 80+ authenticated + public endpoints — covering:

- Report submission with EXIF stripping, AI triage, blockchain hashing, chaining, and duplication detection
- Ticket management with status transitions, SLA monitoring, timeline events, and explainability
- LGU performance analytics with platform-wide benchmarks
- User wallet, rewards catalog, redemption flow
- Achievement system with rank progression
- **Leaderboard (weekly, monthly, barangay, spotlight, stats)** — API endpoints defined; UI rendering in progress
- NGO registration, verification, and management
- Environmental laws database with CRUD
- Notification delivery and preferences
- Multi-tenant administration
- Audit logging for compliance
- Public API for third-party integrations (Sanctum token auth)
- Contact message inbox
- Chat proxy to AI service for Likasy chatbot

### AI Service (FastAPI Microservice)

| Endpoint | Function |
|----------|----------|
| `POST /analyze` | YOLOv8 dual-model inference (COCO + environmental) on uploaded image |
| `POST /analyze/base64` | YOLOv8 inference on base64-encoded image |
| `POST /analyze/similarity` | Image feature extraction + embedding similarity search |
| `POST /api/v1/analyze-hazard` | Neuro-symbolic pipeline: Neo4j GraphRAG + Gemini 2.5 Flash legal synthesis |
| `POST /api/v1/chat` | Likasy chatbot proxy (Gemini-powered) |
| `POST /routing/incident` | Full graph routing: Citizen → Incident → Violation → Agency |
| `POST /routing/record-resolution` | Feed resolution times to the routing learner |
| `GET /routing/stats` | Learned routing performance data |
| `GET /graph/topology` | Graph vertex/edge labels and properties |
| `GET /roboflow/health` | Roboflow Serverless API connectivity check |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        MONOREPO (pnpm)                             │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  Frontend    │  │ Mobile PWA  │  │Admin Portal │               │
│  │  Next.js 16  │  │  Next.js 16 │  │  Next.js 16 │               │
│  │  Port 3000   │  │  Port 3003  │  │  Port 3002  │               │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘               │
│         │                 │                │                        │
│  ┌──────┴─────────────────┴────────────────┴──────┐               │
│  │              @likaslens/shared                  │               │
│  │   Components · API Client · Types · i18n ·     │               │
│  │   ONNX Runtime · Offline Queue · Design Tokens │               │
│  └─────────────────────┬──────────────────────────┘               │
│                        │                                           │
│         ┌──────────────┴──────────────┐                            │
│         │     API Rewrites (next.config.ts)                       │
│         └──────────────┬──────────────┘                            │
└────────────────────────┼──────────────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────────────┐
│              REST API  │  (JSON via OpenAPI contract)              │
│                         │                                           │
│  ┌──────────────────────┴──────────────────────┐                  │
│  │           Laravel 12 Backend                 │                  │
│  │   PHP 8.2 · Sanctum Auth · PostgreSQL        │                  │
│  │                                              │                  │
│  │  ┌────────────────────────────────────────┐  │                  │
│  │  │  Services: AI Triage · Blockchain ·    │  │                  │
│  │  │  Chaining · SLA · Ranking · Location   │  │                  │
│  │  │  Fuzzing · Achievement · Prediction    │  │                  │
│  │  └────────────────────────────────────────┘  │                  │
│  └──────────────────────┬───────────────────────┘                  │
│                         │                                           │
│  ┌──────────────────────┴───────────────────────┐                  │
│  │           FastAPI AI Service                  │                  │
│  │  Python 3.12 · YOLOv8 · Gemini 2.5 Flash     │                  │
│  │                                              │                  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │                  │
│  │  │ YOLOv8   │  │ Roboflow │  │ Gemini   │   │                  │
│  │  │ Vision   │  │ Ensemble │  │ Neural   │   │                  │
│  │  └──────────┘  └──────────┘  └──────────┘   │                  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │                  │
│  │  │ Neo4j    │  │ ONNX     │  │ Routing  │   │                  │
│  │  │ GraphRAG │  │ Embed.   │  │ Learner  │   │                  │
│  │  └──────────┘  └──────────┘  └──────────┘   │                  │
│  └──────────────────────────────────────────────┘                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  Data Layer                                               │      │
│  │  ┌──────────────┐  ┌──────────┐  ┌────────────────────┐  │      │
│  │  │  Supabase     │  │ Neo4j   │  │ Blockchain Network  │  │      │
│  │  │  PostgreSQL   │  │ AuraDB  │  │ (Evidence Hashing)  │  │      │
│  │  │  + Storage    │  │ Graph   │  │                     │  │      │
│  │  └──────────────┘  └──────────┘  └────────────────────┘  │      │
│  └──────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend & Mobile

| Technology | Purpose |
|------------|---------|
| **Next.js 16** (App Router) | React framework with SSR, SSG, ISR for all web apps |
| **TypeScript 5** | Type-safe development across all apps |
| **Tailwind CSS 4** | Utility-first styling with custom design tokens |
| **Framer Motion 12** | Production-grade animations and transitions |
| **next-intl** | Internationalization (10 languages) |
| **Lucide React** | Consistent iconography |
| **MapLibre GL** | Vector tile maps with custom styling |
| **deck.gl** | GPU-powered hexagon/heatmap/scatterplot layers |
| **Leaflet + leaflet.heat** | Lightweight heatmap visualization |
| **Recharts** | Responsive chart components |
| **next-pwa** / @ducanh2912/next-pwa | Progressive Web App capabilities |
| **Embla Carousel** | Lightweight, performant carousel |
| **jsPDF + html2canvas** | Client-side PDF certificate generation |
| **cobe** | 3D globe visualization |
| **clsx + tailwind-merge** | Utility-first class merging |
| **ONNX Runtime Web** | Browser-side YOLOv8 inference (WebAssembly) |
| **Supabase SSR** | Server-side auth helpers |

### Backend

| Technology | Purpose |
|------------|---------|
| **Laravel 12** | Full-featured PHP framework |
| **PHP 8.2+** | Modern, typed backend runtime |
| **Laravel Sanctum** | SPA / token-based authentication |
| **Supabase PostgreSQL** | Managed PostgreSQL with Realtime |
| **Laravel Queue** | Async job processing (achievements, notifications) |
| **Laravel Events** | Event-driven architecture for status changes |
| **Laravel Cache** | Redis/file-based caching for public endpoints |
| **Doctrine DBAL** | Schema-safe column type migrations |
| **League Flysystem (S3)** | Supabase Storage / S3-compatible file storage |
| **Laravel Pint** | PHP code style enforcement |

### AI & Machine Learning

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python async microservice |
| **YOLOv8** (Ultralytics) | State-of-the-art real-time object detection (COCO + environmental models) |
| **Google Gemini 2.5 Flash** | Legal text synthesis, hazard report generation, chatbot |
| **Neo4j AuraDB** | Graph database for environmental law knowledge graph |
| **GraphRAG** | Hybrid retrieval: graph traversal + vector similarity search |
| **Roboflow Serverless API** | Third-party ensemble model for cross-validation |
| **ONNX Runtime Web** | Browser-deployed YOLOv8 inference via WebAssembly |
| **NumPy + Pillow** | Image preprocessing and numerical computation |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **pnpm Workspaces** | Monorepo management with strict dependency isolation |
| **Vercel** | Frontend/Mobile/Admin hosting |
| **Google Cloud Run** | Backend + AI service container hosting |
| **Docker** | Containerized backend + AI service |
| **GitHub Actions** | CI/CD with vulnerability scanning (Trivy) |
| **ESLint + Laravel Pint** | Code quality across all stacks |

---

## 📦 Project Structure

```
likaslens/
├── apps/
│   ├── frontend/           # Next.js 16 web app (port 3000)
│   │   └── src/
│   │       ├── app/        # App Router pages
│   │       ├── components/ # UI components
│   │       ├── hooks/      # Custom React hooks
│   │       ├── i18n/       # Translation messages
│   │       └── utils/      # Utilities
│   │
│   ├── mobile-pwa/         # Next.js 16 PWA (port 3003)
│   │   └── src/
│   │       ├── app/        # App Router pages
│   │       ├── components/ # Mobile-specific components
│   │       ├── hooks/      # Custom hooks (haptics, swipe, voice)
│   │       └── worker/     # Service worker (offline queue)
│   │
│   ├── admin-portal/       # Next.js 16 admin dashboard (port 3002)
│   │   └── src/
│   │       ├── app/        # App Router pages
│   │       └── components/ # Admin-specific components
│   │
│   ├── backend/            # Laravel 12 REST API
│   │   ├── app/
│   │   │   ├── Http/Controllers/  # 30+ API controllers
│   │   │   ├── Models/            # Eloquent models
│   │   │   ├── Services/          # Business logic services
│   │   │   └── Console/Commands/  # Artisan commands
│   │   ├── database/
│   │   │   ├── migrations/        # 30+ database migrations
│   │   │   └── seeders/           # Data seeders
│   │   └── routes/api.php         # API route definitions
│   │
│   ├── ai-service/         # Python 3.12 FastAPI (port 8001)
│   │   ├── main.py         # FastAPI application
│   │   ├── image_analysis.py      # YOLOv8 inference engine
│   │   ├── hazard_analyzer.py     # Neuro-symbolic pipeline
│   │   ├── neo4j_client.py        # Neo4j graph database client
│   │   ├── graph_rag.py           # Hybrid GraphRAG retrieval
│   │   ├── routing_learner.py     # Adaptive LGU routing
│   │   ├── image_similarity.py    # Feature embedding search
│   │   ├── chat_proxy.py          # Likasy chatbot proxy
│   │   └── roboflow_client.py     # Roboflow API integration
│   │
│   └── shared/             # Shared library
│       └── src/
│           ├── ui/         # Reusable components
│           ├── types/      # TypeScript types
│           ├── api/        # API client
│           ├── i18n/       # Translation config & messages
│           ├── lib/        # Utilities (offline queue, ONNX)
│           └── hooks/      # Shared React hooks
│
├── docs/                   # Documentation
│   ├── archive/            # Historical docs
│   ├── audit/              # SEO & audit reports
│   ├── roadmap/            # Sprint plans & roadmaps
│   └── reports/            # Architecture & system reports
│
├── scripts/                # Utility scripts (i18n, translations, icons)
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # Workspace definition
└── openapi.yaml            # OpenAPI contract
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **pnpm** ≥ 8.0.0
- **PHP** ≥ 8.2 with Composer
- **Python** ≥ 3.12
- **Docker** (optional, for containerized deployment)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/J-Akiru5/LikasLens.git
cd LikasLens

# Install Node.js dependencies (all apps)
pnpm install

# Install PHP dependencies (backend)
cd apps/backend && composer install && cd ../..

# Install Python dependencies (AI service)
cd apps/ai-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### 2. Configure Environments

Copy the environment templates and fill in your credentials:

```bash
# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local

# Mobile PWA
cp apps/mobile-pwa/.env.example apps/mobile-pwa/.env.local

# Admin Portal
cp apps/admin-portal/.env.example apps/admin-portal/.env.local

# Backend
cp apps/backend/.env.example apps/backend/.env

# AI Service
cp apps/ai-service/.env.example apps/ai-service/.env
```

**Key environment variables:**

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Frontend/Mobile/Admin | Laravel backend URL (http://localhost:8000/api) |
| `NEXT_PUBLIC_AI_SERVICE_URL` | Frontend | AI service URL (http://localhost:8001) |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend/Mobile/Admin | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend/Mobile/Admin | Supabase anonymous key |
| `DB_HOST` / `DB_PASSWORD` | Backend | Supabase PostgreSQL credentials |
| `GOOGLE_API_KEY` | AI Service | Gemini API key |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | AI Service | Neo4j AuraDB credentials |
| `ROBOFLOW_API_KEY` / `ROBOFLOW_MODEL_ID` | AI Service | Roboflow Serverless API credentials |
| `AI_SERVICE_API_KEY` | AI Service | API key for AI service authentication |

### 3. Run Development Servers

```bash
# Terminal 1: Backend (Laravel)
cd apps/backend && php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2: AI Service (FastAPI)
cd apps/ai-service
# Activate venv first, then:
uvicorn main:app --reload --port 8001

# Terminal 3: Frontend (Next.js)
pnpm --filter frontend dev

# Terminal 4: Mobile PWA (Next.js)
pnpm --filter mobile-pwa dev

# Terminal 5: Admin Portal (Next.js)
pnpm --filter admin-portal dev
```

> **Or run all at once** (if you have the backend & AI service running): `pnpm dev`

### 4. Database Setup (Backend)

```bash
cd apps/backend
php artisan migrate
php artisan db:seed --class=DatabaseSeeder
```

### 5. Neo4j Graph Database (AI Service)

```bash
cd apps/ai-service
# Activate venv, then:
python seed_neo4j.py  # Seeds the knowledge graph with laws, agencies, and locations
```

---

## 🔧 Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Public website + web application |
| Mobile PWA | http://localhost:3003 | Installable mobile app |
| Admin Portal | http://localhost:3002 | Admin dashboard |
| Backend API | http://localhost:8000/api | Laravel REST API |
| AI Service | http://localhost:8001 | FastAPI microservice |
| AI Docs (Swagger) | http://localhost:8001/docs | Interactive API documentation |

---

## 🌐 Localization

LikasLens supports **10 language locales** across all applications:

| Code | Language | Native | Status |
|------|----------|--------|--------|
| `en` | English | English | Complete (baseline) |
| `fil` | Filipino | Filipino | Complete |
| `vi` | Vietnamese | Tiếng Việt | Complete |
| `id` | Indonesian | Bahasa Indonesia | Complete |
| `ms` | Malay | Bahasa Melayu | Substantial |
| `ta` | Tamil | தமிழ் | Substantial |
| `th` | Thai | ไทย | Partial (nav + landing translated) |
| `km` | Khmer | ភាសាខ្មែរ | Partial (nav + landing translated) |
| `my` | Burmese | မြန်မာ | Partial (nav + landing translated) |
| `lo` | Lao | ລາວ | Partial (nav + landing translated) |

YOLO detection labels are also translated for on-device inference display.

---

## 🧪 Testing

```bash
# Backend tests
cd apps/backend && php artisan test

# Backend code style
cd apps/backend && ./vendor/bin/pint

# Shared library tests
pnpm --filter shared test

# Shared type checking
pnpm --filter shared typecheck

# Frontend lint
pnpm --filter frontend lint
```

---

## 📊 Deployment

The platform is deployed on **Vercel** (frontends) and **Google Cloud Run** (backend + AI service):

```bash
# Build all apps
pnpm build

# Build individual apps
pnpm --filter frontend build
pnpm --filter mobile-pwa build
pnpm --filter admin-portal build
```

See `docs/GCP_DEPLOYMENT.md` for complete cloud deployment instructions.

---

## 🛡️ Security

- **EXIF Stripping**: All uploaded images have metadata removed server-side (Imagick → GD fallback chain)
- **Ghost Mode**: Anonymous submission with GPS fuzzing to barangay centroids
- **Anti-Sybil**: 5m geofence prevents duplicate reports from the same user within 24 hours
- **Corroboration**: 50m GPS diversity requirement + distinct user requirement
- **Cryptographic Evidence**: SHA-256 evidence hashing with encrypted Supabase Vault storage
- **CORS**: Strictly configured per environment
- **API Keys**: AI service requires `X-API-Key` header in production
- **Rate Limiting**: Per-IP and per-endpoint throttling (10–60 req/min)
- **JWT Auth**: Supabase-signed JWTs verified server-side by Laravel middleware
- **Sanctum Tokens**: Optional API token auth for third-party integrations

---

## 🤝 Contributing

This project was built for the **IPOPHL SRT Innovation Contest 2026**. For contribution guidelines, please refer to the project's issue tracker and pull request process.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ for the IPOPHL SRT Innovation Contest 2026 · University of Makati, Philippines</sub>
</p>
