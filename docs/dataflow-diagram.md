# LikasLens Data Flow Diagram

> Neuro-Symbolic Civic Reporting Platform

## System Architecture Overview

```mermaid
flowchart TB
    %% Stakeholders
    Citizen([👤 Citizen])
    GhostUser([👻 Ghost User])
    Analyst([📊 Analyst])
    SuperAdmin([🔧 Super Admin])
    NGO([🏛️ NGO / Gov Agency])
    Sponsor([💰 ESG Sponsor])

    %% Frontend
    subgraph Frontend["Next.js Frontend :3000"]
        ReportPage["/report<br/>Camera + GPS"]
        Dashboard["/dashboard<br/>Impact Stats"]
        Leaderboard["/scoreboard<br/>Rankings"]
        Laws["/laws<br/>Legal Reference"]
        GhostToggle["Ghost Mode Toggle<br/>+ EXIF Strip"]
    end

    %% Admin Portal
    subgraph AdminPortal["Admin Portal :3002"]
        AdminDash["Dashboard"]
        TicketMgmt["Ticket Mgmt"]
        UserMgmt["User Mgmt"]
        NGOMgmt["NGO CRUD"]
        LawMgmt["Law CRUD"]
    end

    %% Backend
    subgraph Backend["Laravel API :8000"]
        AuthSync["Auth Sync<br/>Supabase → Sanctum"]
        ReportCtrl["Report Controller<br/>Store + Validate"]
        TriageSvc["Triage Service"]
        AchieveSvc["Credential Service"]
        RankSvc["Tier Service"]
        TicketCtrl["Ticket Controller"]
        AssignCtrl["Assignment Controller"]
    end

    %% AI Service
    subgraph AIService["FastAPI AI Service :8001"]
        YOLO["YOLOv8<br/>Object Detection"]
        Gremlin["Gremlin Traversal<br/>Law + Agency Routing"]
        Gemini["Gemini 2.5 Flash<br/>Summary + Chatbot"]
    end

    %% Data Stores
    SupabaseDB[("Supabase<br/>PostgreSQL")]
    SupabaseStorage[("Supabase<br/>Storage")]
    CosmosDB[("Cosmos DB<br/>Gremlin Graph")]

    %% Citizen flows
    Citizen -->|photo + GPS| ReportPage
    Citizen -->|view impact| Dashboard
    Citizen -->|view rankings| Leaderboard
    Citizen -->|read laws| Laws
    GhostUser -->|anonymous report| GhostToggle
    GhostToggle -->|stripped photo + GPS| ReportPage

    %% Report submission flow
    ReportPage -->|POST /api/reports| ReportCtrl
    ReportCtrl -->|upload image| SupabaseStorage
    ReportCtrl -->|create ticket + evidence| SupabaseDB
    ReportCtrl -->|image for analysis| TriageSvc

    %% AI Pipeline (Neuro-Symbolic)
    TriageSvc -->|base64 image| YOLO
    YOLO -->|detected objects + classes| Gremlin
    Gremlin -->|hazard → law → agency| Gemini
    Gemini -->|incident summary + routing| TriageSvc
    TriageSvc -->|classification results| SupabaseDB

    %% Impact & Credentials
    ReportCtrl -->|evaluate| AchieveSvc
    AchieveSvc -->|check thresholds| RankSvc
    RankSvc -->|award eco-credits| SupabaseDB

    %% Analyst flows
    Analyst -->|review + assign| TicketMgmt
    TicketMgmt -->|POST /api/ticket-assignments| AssignCtrl
    AssignCtrl -->|link ticket → NGO| SupabaseDB

    %% Super Admin flows
    SuperAdmin --> AdminDash
    SuperAdmin --> UserMgmt
    SuperAdmin --> NGOMgmt
    SuperAdmin --> LawMgmt
    UserMgmt --> SupabaseDB
    NGOMgmt --> SupabaseDB
    LawMgmt --> SupabaseDB

    %% NGO resolution
    NGO <--assigned tickets--> AssignCtrl

    %% ESG Sponsor
    Sponsor -->|fund credits| SupabaseDB

    %% Auth
    Citizen -->|Supabase Auth| AuthSync
    AuthSync -->|Sanctum token| SupabaseDB

    %% Styles
    classDef stakeholder fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef backend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef ai fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef storage fill:#fce4ec,stroke:#c62828,stroke-width:2px

    class Citizen,GhostUser,Analyst,SuperAdmin,NGO,Sponsor stakeholder
    class ReportPage,Dashboard,Leaderboard,Laws,GhostToggle,AdminDash,TicketMgmt,UserMgmt,NGOMgmt,LawMgmt frontend
    class AuthSync,ReportCtrl,TriageSvc,AchieveSvc,RankSvc,TicketCtrl,AssignCtrl backend
    class YOLO,Gremlin,Gemini ai
    class SupabaseDB,SupabaseStorage,CosmosDB storage
```

## Report Submission Sequence

```mermaid
sequenceDiagram
    actor Citizen
    participant PWA as Frontend PWA
    participant API as Laravel API
    participant Storage as Supabase Storage
    participant DB as PostgreSQL
    participant AI as AI Service
    participant YOLO as YOLOv8
    participant Graph as Gremlin Graph
    participant LLM as Gemini

    Citizen->>PWA: Capture photo + GPS
    PWA->>PWA: Strip EXIF (Ghost Mode)

    Note over PWA,AI: Pre-submission Triage Check
    PWA->>API: POST /api/reports/triage
    API->>AI: POST /analyze/base64
    AI->>YOLO: Run inference
    YOLO-->>AI: Detections (objects, classes)
    AI-->>API: Environmental assessment
    API-->>PWA: Triage result

    alt High-risk detected
        PWA->>Citizen: Edge Interceptor Modal
        Citizen->>PWA: Proceed Anonymously (Ghost Mode)
    end

    Note over PWA,DB: Report Submission
    PWA->>API: POST /api/reports (image + GPS + user)
    API->>Storage: Upload evidence image
    Storage-->>API: Storage path
    API->>DB: Create Ticket + Evidence + Report
    DB-->>API: Ticket ID

    Note over API,LLM: AI Classification (async, non-blocking)
    API->>AI: POST /analyze/base64
    AI->>YOLO: Run inference
    YOLO-->>AI: Object detections
    AI->>Graph: Traverse hazard → law → agency
    Graph-->>AI: Violated laws + enforcing agencies
    AI->>LLM: Generate incident summary
    LLM-->>AI: 2-sentence summary
    AI-->>API: Classification + routing
    API->>DB: Store TicketClassification

    Note over API,DB: Impact Scoring
    API->>DB: Evaluate credentials
    API->>DB: Check tier thresholds
    API->>DB: Award eco-credits

    API-->>PWA: { ticket_id, evidence_id, triage }
    PWA->>Citizen: Report submitted confirmation
```

## Neuro-Symbolic AI Pipeline

```mermaid
flowchart LR
    subgraph Neural["Neural Layer"]
        YOLO["YOLOv8<br/>Object Detection<br/>(yolov8n.pt)"]
        Gemini["Gemini 2.5 Flash<br/>NL Summarization"]
    end

    subgraph Symbolic["Symbolic Layer"]
        Gremlin["Gremlin Traversal<br/>Graph Query"]
        GraphDB[("Cosmos DB<br/>Hazard→Law→Agency")]
    end

    Image[("Evidence<br/>Image")] --> YOLO
    YOLO -->|detected classes| Gremlin
    Gremlin -->|graph query| GraphDB
    GraphDB -->|matched laws + agencies| Gremlin
    Gremlin -->|structured data| Gemini
    Gemini -->|incident summary| Output["Classification<br/>+ Routing"]

    style Neural fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style Symbolic fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
```

## Impact & Credential Flow

```mermaid
flowchart LR
    Report["Report<br/>Submitted"] --> Achieve["Credential<br/>Service"]
    Achieve -->|evaluate criteria| Earn["Earn<br/>Credential"]
    Earn -->|award score| Impact["Impact<br/>Score"]
    Impact -->|check thresholds| Tier["Tier<br/>Service"]
    Tier -->|advance| Credits["Eco-Credit<br/>Bonus"]
    Credits -->|from pool| Pool["CreditPool<br/>(ESG Sponsor)"]
    Credits -->|deposit| Wallet["Citizen<br/>Wallet"]

    subgraph Tiers["Contributor Tiers"]
        T1["Tier I<br/>0-99"]
        T2["Tier II<br/>100-999"]
        T3["Tier III<br/>1000-4999"]
        T4["Tier IV<br/>5000-9999"]
        T5["Tier V<br/>10000+"]
    end

    Tier --> Tiers
```
