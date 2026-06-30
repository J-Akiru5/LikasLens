# LikasLens Data Architecture

> Auto-generated from codebase analysis — `June 10, 2026`

---

## Overview

LikasLens uses a **dual-database architecture**:

| Database | Type | Purpose |
|----------|------|---------|
| **Supabase** | PostgreSQL (Relational) | Users, reports, incidents, sessions, laws, queue, cache, file storage |
| **Cosmos DB Gremlin** | Graph Database (Azure) | Citizen → Incident → Violation → Law → Agency relationship graph |

---

## 1. Supabase (PostgreSQL) — Primary Relational Database

| Service | Usage |
|---------|-------|
| Backend (Laravel) | Primary database for all app data (users, reports, incidents, sessions, etc.) |
| Frontend | `NEXT_PUBLIC_SUPABASE_URL` → `sfklmmtimelotqvrldni.supabase.co` |
| Admin Portal | Supabase client for admin dashboard |
| Mobile PWA | Supabase client for mobile data |
| Supabase Storage | Evidence photo storage (S3-compatible bucket: `likaslens-evidence`) |

### What lives here

- User accounts & authentication
- Incident reports & submissions
- Environmental law records
- Sessions, queues, cache
- Achievements
- All relational CRUD data

---

## 2. Azure Cosmos DB (Gremlin API) — Graph Database

| Service | Usage |
|---------|-------|
| AI Service (Python/FastAPI) | Connected via `gremlin_client.py` to `wss://<account>.gremlin.cosmos.azure.com:443/` |

### Graph Relationships

| Vertex/Edge | Description |
|-------------|-------------|
| **Citizen** → `REPORTED` → **Incident** | A citizen reports an incident |
| **Incident** → `CLASSIFIED_AS` → **ViolationType** | An incident is classified by violation type |
| **ViolationType** → `violates` → **Law** | A violation type is linked to a law |
| **Law** → `enforced_by` → **Agency** | A law is enforced by an agency |
| **Incident** → `ASSIGNED_TO` → **NGO** | An incident may be assigned to an NGO |

### Purpose

The Gremlin graph is the **"symbolic layer"** of the neuro-symbolic AI pipeline. It maps hazard types to Philippine environmental laws and enforcing agencies. This data is queried during hazard analysis and then passed to **Google Gemini** (the "neural layer") to generate formal incident summaries.

---

## 3. Environment Variables Reference

| Variable | File(s) | Value |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `frontend/.env.local`, `admin-portal/.env.example`, `mobile-pwa/.env.example` | `https://sfklmmtimelotqvrldni.supabase.co` |
| `NEXT_PUBLIC_LARAVEL_API_URL` | `frontend/.env.local` | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_AI_SERVICE_URL` | `frontend/.env.local`, `frontend/.env.example` | `http://localhost:8001` |
| `AI_SERVICE_URL` | `backend/.env.example`, `backend/.env.production` | `http://127.0.0.1:8001` / `http://likaslens-ai-service:8001` |
| `COSMOS_GREMLIN_ENDPOINT` | `ai-service/.env.example` | `wss://<account>.gremlin.cosmos.azure.com:443/` |
| `COSMOS_GREMLIN_DATABASE` | `ai-service/.env.example` | `likaslens` |
| `COSMOS_GREMLIN_GRAPH` | `ai-service/.env.example` | `routing_graph` |
| `DB_CONNECTION` | `backend/.env.example` | `pgsql` (Supabase PostgreSQL) |
| `DB_HOST` | `backend/.env.example` | `db.your-project-ref.supabase.co` |

---

## 4. Data Flow Diagram

```
┌──────────────┐    REST API     ┌──────────────┐   PostgreSQL   ┌──────────────┐
│  Frontend    │ ──────────────→ │   Backend    │ ────────────→ │   Supabase   │
│  Mobile PWA  │                 │   (Laravel)  │               │  (Users,     │
│  Admin Portal│                 │              │               │   Reports,   │
└──────────────┘                 └──────────────┘               │   Laws, etc) │
       │                             │                          └──────────────┘
       │         AI Service          │
       └────────────────────────────→├────────────────────────→ ┌──────────────┐
                                     │   Gremlin traversal      │ Cosmos DB    │
                                     │   (Graph relationships)  │ (Graph:      │
                                     │                          │  Citizen,    │
                                     │                          │  Incident,   │
                                     │                          │  Violation,  │
                                     │                          │  Law, Agency)│
                                     └─────────────────────────→└──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ Google Gemini│
                                          │ (AI Summary) │
                                          └──────────────┘
```

---

## 5. Key Takeaway

**Both databases are actively used**, but for different purposes:

- **Supabase** = relational data (users, reports, CRUD operations)
- **Cosmos DB Gremlin** = graph relationships (hazard → law → agency mapping for the AI pipeline)
