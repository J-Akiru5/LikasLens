# LikasLens Data Flow Diagram (ASCII)

> Neuro-Symbolic Civic Reporting Platform

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LIKASLENS DATA FLOW                                   │
│                    Neuro-Symbolic Civic Reporting Platform                       │
└─────────────────────────────────────────────────────────────────────────────────┘

    STAKEHOLDERS                    SERVICES                      DATA STORES
    ────────────                    ────────                      ───────────

  ┌──────────────┐
  │  👤 Citizen  │──┐
  └──────────────┘  │
                    │         ┌─────────────────────┐
  ┌──────────────┐  │         │  Next.js Frontend   │         ┌─────────────────┐
  │ 👻 Ghost User│──┼────────>│     :3000 (PWA)     │         │  Supabase Auth  │
  └──────────────┘  │         │                     │────────>│  (Identity)     │
                    │         │  /report  /dashboard │         └─────────────────┘
                    │         │  /scoreboard  /laws  │
                    │         └──────────┬──────────┘
                    │                    │
                    │         POST /api/reports
                    │         (image + GPS + user)
                    │                    │
                    │         ┌──────────▼──────────┐
                    │         │  Laravel Backend    │         ┌─────────────────┐
                    │         │     :8000/api       │────────>│  Supabase       │
                    │         │                     │         │  PostgreSQL     │
                    │         │  ReportController   │         │  (Tickets,      │
                    │         │  AuthSync           │         │   Evidence,     │
                    │         │  TriageService      │         │   Users,        │
                    │         │  AchievementService │         │   Achievements) │
                    │         │  RankService        │         └─────────────────┘
                    │         └──────────┬──────────┘
                    │                    │                    ┌─────────────────┐
                    │         Upload image                    │  Supabase       │
                    │                    ├───────────────────>│  Storage        │
                    │                    │                    │  (Evidence      │
                    │         AI triage  │                    │   Photos)       │
                    │         (base64)   │                    └─────────────────┘
                    │                    │
                    │         ┌──────────▼──────────┐
                    │         │  FastAPI AI Service │
                    │         │      :8001          │
                    │         │                     │
                    │         │  ┌───────────────┐  │         ┌─────────────────┐
                    │         │  │   YOLOv8 Nano      │  │         │  Cosmos DB      │
                    │         │  │   Object      │  │         │  Gremlin Graph  │
                    │         │  │   Detection   │  │         │  (Hazard→Law→   │
                    │         │  └───────┬───────┘  │         │   Agency routing│
                    │         │          │          │         └─────────────────┘
                    │         │  ┌───────▼───────┐  │               ▲
                    │         │  │   Gremlin     │──┼───────────────┘
                    │         │  │   Traversal   │  │
                    │         │  │   (Symbolic)  │  │
                    │         │  └───────┬───────┘  │
                    │         │          │          │
                    │         │  ┌───────▼───────┐  │
                    │         │  │   Gemini      │  │
                    │         │  │   2.5 Flash   │  │
                    │         │  │   (Summary)   │  │
                    │         │  └───────────────┘  │
                    │         └─────────────────────┘
                    │
  ┌──────────────┐  │
  │ 📊 Analyst   │──┼────────> Assign tickets → NGOs
  └──────────────┘  │
                    │         ┌─────────────────────┐
  ┌──────────────┐  │         │  Admin Portal       │
  │ 🔧 Super     │──┼────────>│     :3002           │
  │    Admin     │  │         │  Users, NGOs, Laws, │
  └──────────────┘  │         │  Rewards, Audit Logs│
                    │         └─────────────────────┘
  ┌──────────────┐  │
  │ 🏛️ NGO /     │<─┘─────── Ticket assignments
  │   Gov Agency │            (resolve incidents)
  └──────────────┘
  ┌──────────────┐
  │ 💰 ESG       │──────────> Fund CreditPools
  │   Sponsor    │            (eco-credit rewards)
  └──────────────┘
```

## Main Data Flow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MAIN DATA FLOW SEQUENCE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

  1. CAPTURE          2. TRANSMIT         3. STORE            4. ANALYZE
  ──────────          ───────────         ────────            ─────────
  Citizen opens       POST /api/reports   Supabase Storage    AI Service:
  /report page        (base64 image +     (evidence photos)   YOLOv8 Nano detects
  Camera + GPS        GPS + user_id)      PostgreSQL          objects →
  Ghost Mode?         Ghost Mode:         (Ticket + Evidence  Gremlin maps
  strips EXIF         EXIF already        + Report rows)      hazard → law →
                      stripped                                 agency → Gemini
                                                               writes summary

  5. CLASSIFY         6. SCORE            7. ROUTE            8. RESOLVE
  ───────────         ────────            ───────             ─────────
  TicketClassification CredentialService   Analyst reviews     NGO receives
  stored in DB        evaluates criteria   ticket, assigns     assignment,
  (violation_type +   TierService checks   to NGO via          investigates,
  confidence)         for advancement      POST /ticket-       marks resolved
                      Eco-credits from     assignments         LGU verification
                      CreditPool awarded                       triggers citizen
                                                                credentials
```

## Neuro-Symbolic AI Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      NEURO-SYMBOLIC AI PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         NEURAL LAYER                │
                    │                                     │
  Evidence    ┌─────┴─────┐              ┌───────────────┴──┐
  Image  ────>│  YOLOv8 Nano   │──detections──>│  Gemini 2.5     │
              │  Object   │              │  Flash           │
              │  Detection│              │  (Summary)       │
              └─────┬─────┘              └───────────────┬──┘
                    │                                     │
                    │ detected classes                    │ incident summary
                    │                                     │
              ┌─────▼─────┐              ┌───────────────▼──┐
              │  Gremlin  │──query──────>│  Cosmos DB       │
              │  Traversal│<─results─────│  Gremlin Graph   │
              │  (Symbolic)│              │  (Hazard→Law→    │
              └───────────┘              │   Agency)        │
                    │                    └──────────────────┘
                    │
                    │  Classification + Routing
                    ▼
              ┌───────────┐
              │  Output   │
              │  Ticket   │
              │  Classifi-│
              │  cation   │
              └───────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ GRAPH TOPOLOGY                                                              │
  │                                                                             │
  │  Citizen ──REPORTED──> Incident ──CLASSIFIED_AS──> ViolationType            │
  │                              │                           │                  │
  │                              │                      violates                │
  │                              │                           │                  │
  │                         ASSIGNED_TO                    Law                   │
  │                              │                           │                  │
  │                              ▼                      enforced_by             │
  │                            NGO <──────────────────── Agency                 │
  └─────────────────────────────────────────────────────────────────────────────┘
```

## Impact & Credential Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       IMPACT & CREDENTIAL FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

  Report Submitted
        │
        ▼
  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
  │  Credential   │────>│  Earn         │────>│  Impact       │
  │  Service      │     │  Credential   │     │  Score        │
  └───────────────┘     └───────────────┘     └───────┬───────┘
                                                       │
                                                       ▼
                                                 ┌───────────────┐
                                                 │  Tier Service │
                                                 └───────┬───────┘
                                                         │
                     ┌───────────────────────────────────┼───────────────────┐
                     │           CONTRIBUTOR TIERS        │                   │
                     │                                   │                   │
               ┌─────▼────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────▼─────┐
               │ Tier I   │  │ Tier II  │  │ Tier III │  │ Tier IV  │  │  Tier V  │
               │ 0-99     │  │100-999   │  │1K-4.9K   │  │5K-9.9K   │  │ 10K+     │
               │          │  │ +25 cr   │  │ +75 cr   │  │ +200 cr  │  │ +500 cr  │
               └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
                                                         │
                                                         ▼
                                                 ┌───────────────┐
                                                 │  CreditPool   │
                                                 │  (ESG Sponsor)│
                                                 └───────┬───────┘
                                                         │
                                                         ▼
                                                 ┌───────────────┐
                                                 │  Citizen      │
                                                 │  Wallet       │
                                                 └───────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

  Citizen                 Frontend                Supabase Auth           Laravel API
     │                       │                         │                       │
     │  Login/Register       │                         │                       │
     │──────────────────────>│                         │                       │
     │                       │  signIn/signUp          │                       │
     │                       │────────────────────────>│                       │
     │                       │                         │                       │
     │                       │  Session + JWT          │                       │
     │                       │<────────────────────────│                       │
     │                       │                         │                       │
     │                       │  POST /api/auth/sync    │                       │
     │                       │  (supabase_auth_user_id,│                       │
     │                       │   email, name, role)    │                       │
     │                       │────────────────────────────────────────────────>│
     │                       │                         │                       │
     │                       │                         │    Create/Update User │
     │                       │                         │    Return Sanctum Token
     │                       │<────────────────────────────────────────────────│
     │                       │                         │                       │
     │  Dashboard            │  Bearer Token           │                       │
     │<──────────────────────│  (httpOnly cookie)      │                       │
     │                       │                         │                       │
     │  API Request          │  Authorization: Bearer  │                       │
     │──────────────────────>│────────────────────────────────────────────────>│
     │                       │                         │    Verify Token + RBAC│
     │  Response             │<────────────────────────────────────────────────│
     │<──────────────────────│                         │                       │
```
