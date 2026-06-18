# LikasLens — Google Cloud Platform (GCP) Deployment Guide

> **Purpose:** Deploy the Laravel backend and FastAPI AI service to Google Cloud Run
> **Last updated:** 2026-06-18
> **Replaces:** `AZURE_DEPLOYMENT.md` (archived)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  Vercel          │     │  Google Cloud Run     │     │  Google Cloud Run     │
│  (Frontend)      │────>│  (Backend)            │────>│  (AI Service)         │
│  likaslens.vercel│     │  likaslens-api        │     │  likaslens-ai         │
│  .app            │     │  :8000                │     │  :8001                │
└─────────────────┘     └──────────┬───────────┘     └──────────┬───────────┘
                                   │                            │
                                   v                            v
                          ┌────────────────┐          ┌─────────────────┐
                          │  Supabase      │          │  Neo4j AuraDB   │
                          │  PostgreSQL +  │          │  (Graph)        │
                          │  Storage (S3)  │          │  Free Tier      │
                          └────────────────┘          └─────────────────┘
```

**Why Cloud Run?** Google provisions servers automatically — wakes on traffic, sleeps when idle. Near-zero cost during the 3-month free credit period.

---

## Phase 1: GCP Project & Billing

> **One project, two services:** Both `likaslens-api` and `likaslens-ai` live in this single project. This simplifies billing, IAM, and Artifact Registry — one setup covers both.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and log in.
2. Click the project dropdown at the top blue bar → **New Project**.
3. Project Name: `likaslens` → Click **Create**.
4. Select the new project in the top bar.
5. Search **Billing** in the top search bar → Link your account to activate free credits.

### Set Up Billing Budget & Alerts (Safety Net)

> **Why:** Cloud Run charges per request + compute time. If a container stays awake or traffic spikes, you want to know immediately — not when the bill arrives.

1. Go to **Billing** → **Budgets & alerts** (left sidebar).
2. Click **+ Create Budget**.
3. Name: `likaslens-budget`
4. Set amount: **$10** (or $5 for tighter control).
5. Under **Alerts**, check all three thresholds: **50%**, **90%**, **100%**.
6. Enter your email under **Notification recipients** → Click **Finish**.

---

## Phase 2: Enable APIs & Artifact Registry

### Enable Artifact Registry (the "parking garage" for Docker containers)

1. Search **Artifact Registry** → Click **Enable** if prompted.
2. Click **+ Create Repository**.
   - **Name:** `likaslens-repo`
   - **Format:** Docker
   - **Mode:** Standard
   - **Location Type:** Region → `asia-southeast1` (Singapore — fastest for PH)
3. Click **Create**.

### Enable Cloud Run

1. Search **Cloud Run** → Click **Enable**.

> **Ignore "Connect Repository":** You'll see options to connect GitHub repos or set up Cloud Build. Skip all of that — your GitHub Actions pipeline handles building and pushing containers. You only need the API enabled.

---

## Phase 2B: Neo4j AuraDB (Graph Database)

Neo4j stores your environmental law knowledge graph (hazards → laws → agencies). The free tier gives you 200K nodes and 400K relationships — more than enough.

1. Go to [neo4j.com/cloud/aura-free](https://neo4j.com/cloud/aura-free/) → Click **Start Free**.
2. Sign up with your email. You'll land on the Neo4j Console.
3. Click **Create Instance**:
   - **Name:** `likaslens-graph`
   - **Region:** Leave default or choose closest to you
4. **Save your credentials immediately** (shown once, cannot be retrieved later):
   - `NEO4J_URI` — looks like `neo4j+s://xxxx.databases.neo4j.io`
   - `NEO4J_USER` — usually `neo4j`
   - `NEO4J_PASSWORD` — auto-generated, copy this now
5. Save these values — you'll paste them into Cloud Run env vars in Phase 4.

> **Save your password now!** Neo4j only shows the password once during instance creation. If you lose it, you'll need to reset the instance.

> **Cost:** AuraDB Free is truly free forever (no credit card required). 200K nodes, 400K relationships, 1 instance. Your 3-month GCP credits are not used here.

---

## Phase 3: Service Account (VIP Pass for GitHub Actions)

1. Search **Service Accounts** (under IAM & Admin).
2. Click **+ Create Service Account**.
   - **Name:** `github-actions-deployer`
   - Click **Create and Continue**.
3. **Grant these 4 roles:**
   - `Cloud Run Admin`
   - `Artifact Registry Administrator`
   - `Storage Admin`
   - `Service Account User`
4. Click **Done**.
5. Click the three dots under **Actions** → **Manage Keys** → **Add Key** → **Create new key** → **JSON** → **Create**.
6. A `.json` file downloads. **Guard this — it is the master key to your server.**

### Connect to GitHub

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
   - **Name:** `GCP_CREDENTIALS`
   - **Secret:** Open the downloaded JSON in Notepad, copy ALL text, paste here.
3. Click **Add secret**.

---

## Phase 4: Manual Deploy + Environment Variables

### 4A: Deploy Backend (`likaslens-api`)

1. Search **Cloud Run** → Click **+ Create Service**.
2. Select **Test with a sample container**.
   - **Service name:** `likaslens-api`
   - **Region:** `asia-southeast1`
   - **Authentication:** **Allow unauthenticated invocations**
3. Expand **Container, Variables & Secrets, Connections, Security**.
4. Go to **Variables & Secrets** tab → Click **+ Add Variable** for each:

| Variable | Value |
|----------|-------|
| `APP_NAME` | `LikasLens` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `base64:...` (from your existing Azure config) |
| `APP_URL` | *(leave blank — will fill after deploy)* |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `aws-1-ap-northeast-2.pooler.supabase.com` (Session Pooler — IPv4 compatible) |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `postgres` |
| `DB_USERNAME` | `postgres.sfklmmtimelotqvrldni` |
| `DB_PASSWORD` | *(from Supabase Dashboard → Settings → Database)* |
| `LOG_CHANNEL` | `stderr` |
| `LOG_LEVEL` | `warning` |
| `SESSION_DRIVER` | `file` |
| `CACHE_STORE` | `file` |
| `SUPABASE_S3_ENDPOINT` | `https://sfklmmtimelotqvrldni.storage.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_ACCESS_KEY` | *(from Supabase → Settings → Storage → S3 Access Keys)* |
| `SUPABASE_S3_SECRET_KEY` | *(from Supabase → Settings → Storage → S3 Access Keys)* |
| `SUPABASE_S3_REGION` | `ap-southeast-1` |
| `SUPABASE_STORAGE_BUCKET` | `likaslens-evidence` |
| `AI_SERVICE_URL` | *(leave blank — will fill after AI service deploys)* |

5. Click the **Resources** tab → Set **Memory** to **1 GiB** (prevents OOM during heavy requests).
6. Click **Create**. Wait ~1 minute.
7. **Save the public URL** (e.g., `https://likaslens-api-xyz.a.run.app`). This is your new backend URL.
8. Go back to **Edit & Deploy New Revision** → update `APP_URL` with this URL → **Deploy**.

### 4B: Deploy AI Service (`likaslens-ai`)

1. Click **+ Create Service** again.
2. Select **Test with a sample container**.
   - **Service name:** `likaslens-ai`
   - **Region:** `asia-southeast1`
   - **Authentication:** **Allow unauthenticated invocations**
3. Click the **Resources** tab → Set **Memory** to **2 GiB** and **CPU** to **2** (AI workloads need headroom).
4. Expand **Variables & Secrets** → **+ Add Variable** for each:

| Variable | Value |
|----------|-------|
| `AI_SERVICE_PORT` | `8001` |
| `GOOGLE_API_KEY` | *(from Google AI Studio → API Keys)* |
| `NEO4J_URI` | `neo4j+s://<your-instance>.databases.neo4j.io` (from Neo4j AuraDB) |
| `NEO4J_USER` | `neo4j` |
| `NEO4J_PASSWORD` | *(from Neo4j AuraDB console)* |
| `CORS_ORIGINS` | `https://likaslens.syntaxure.dev,https://likasadmin.syntaxure.dev,https://likaslens-api-1096292232709.asia-southeast1.run.app` |
| `ENVIRONMENT` | `production` |
| `APP_DEBUG` | `false` |

5. Click **Create**. Wait ~1 minute.
6. **Save the public URL** (e.g., `https://likaslens-ai-xyz.a.run.app`).

### 4C: Link Backend → AI Service

1. Go back to **Cloud Run** → `likaslens-api` → **Edit & Deploy New Revision**.
2. Update `AI_SERVICE_URL` with the AI service URL (e.g., `https://likaslens-ai-xyz.a.run.app`).
3. **Deploy**.

---

## Phase 5: GitHub Actions Pipeline (CI/CD)

The workflows are already in your repo:

- `.github/workflows/gcp-backend-deploy.yml` — Deploys backend on push to `main` when `apps/backend/**` changes.
- `.github/workflows/gcp-ai-service-deploy.yml` — Deploys AI service on push to `main` when `apps/ai-service/**` changes.

Both workflows:
1. Run the CI gate (Pint, php artisan test, flake8, typecheck)
2. Build the Docker image
3. Run Trivy vulnerability scanner (HIGH/CRITICAL)
4. Push to Artifact Registry
5. Deploy to Cloud Run

> **Test containers are replaced automatically:** The sample containers you deployed in Phase 4 are temporary placeholders. When you push to `main`, GitHub Actions builds your real Docker image and deploys it — the test container is replaced automatically. Your env vars are preserved because they're stored in the Cloud Run service config, not inside the container.

**To trigger:** Commit and push to `main`. Watch the GitHub Actions tab.

---

## Phase 6: Running Seeders

Use the GCP Cloud Shell (terminal icon `>_` at the top right of the GCP console).

### Seed Neo4j Graph Database (Required for AI Service)

This seeds the graph with 16 PH environmental laws, 18 hazard types, 5 agencies, 3 locations (Iloilo), and all their relationships.

```bash
# 1. Clone the repo (if not already)
git clone https://github.com/J-Akiru5/LikasLens.git
cd LikasLens/apps/ai-service

# 2. Install dependencies
pip install neo4j python-dotenv google-generativeai

# 3. Set environment variables
export NEO4J_URI="neo4j+s://your-instance.databases.neo4j.io"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your-password"
export GOOGLE_API_KEY="your-gemini-key"  # optional, enables vector embeddings

# 4. Run the seed script
python seed_neo4j.py

# To clear and re-seed (e.g., after schema changes):
python seed_neo4j.py --drop
```

**What it does:**
- Creates uniqueness constraints (Law.code, HazardType.code, etc.)
- Seeds all vertex nodes (laws, hazards, agencies, violations, locations)
- Seeds all edges (GOVERNED_BY, VIOLATES, ENFORCED_BY, CLASSIFIED_AS)
- If `GOOGLE_API_KEY` is set: creates vector index and embeds 16 PH laws for GraphRAG

**Verify in Neo4j Console:**
1. Go to https://console.neo4j.io
2. Open your instance → Query tab
3. Run: `MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC`
4. You should see: Law (16), HazardType (18), Agency (5), ViolationType (11), Location (3)

### Backend Seeders (Optional)

> **Note:** The `start.sh` entrypoint already runs `php artisan migrate --force` on every container boot, so migrations happen automatically.

To run Laravel seeders (sample data):
```bash
gcloud run jobs create seed-job \
  --image asia-southeast1-docker.pkg.dev/likaslens/likaslens-repo/likaslens-backend:latest \
  --command "php,artisan,db:seed,--force" \
  --region asia-southeast1

gcloud run jobs execute seed-job --region asia-southeast1
```

---

## Phase 7: Update Frontend Env Vars (Vercel)

Go to **Vercel Dashboard** → Project → **Settings** → **Environment Variables**:

| Variable | New Value |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://likaslens-api-1096292232709.asia-southeast1.run.app/api` |
| `NEXT_PUBLIC_AI_SERVICE_URL` | `https://likaslens-ai-1096292232709.asia-southeast1.run.app` |

Then **Redeploy** the latest deployment.

---

## Verify Endpoints

```bash
# Backend health check
curl https://likaslens-api-1096292232709.asia-southeast1.run.app/api/health
# Expected: {"status":"ok","service":"likaslens-backend","timestamp":"..."}

# AI service health check
curl https://likaslens-ai-1096292232709.asia-southeast1.run.app/health
# Expected: {"status":"ok"}

# Frontend
# Open https://likaslens.vercel.app in browser
```

**Verify Neo4j:**
1. Go to https://console.neo4j.io → Open your instance
2. Run in Query tab: `MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC`
3. Expected: Law (16), HazardType (18), Agency (5), ViolationType (11), Location (3)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend returns 500 on DB endpoints | Missing/wrong `DB_*` env vars | Check Supabase is active, verify credentials |
| Backend returns 500 on `/api/reports` | Missing `SUPABASE_S3_*` env vars | Set S3 credentials in Cloud Run |
| AI service returns 502 | Missing `GOOGLE_API_KEY` | Set Gemini API key |
| AI service returns 500 on `/api/v1/analyze-hazard` | Missing `NEO4J_*` env vars | Set Neo4j credentials in Cloud Run |
| Frontend shows "Failed to fetch" | Wrong `NEXT_PUBLIC_API_URL` | Check exact Cloud Run backend URL |
| CORS errors | Missing `CORS_ORIGINS` on AI service | Add Vercel + Cloud Run domains |
| Supabase connection refused | Project paused | Resume in Supabase dashboard |
| Container keeps restarting | `APP_KEY` missing or invalid | Verify `APP_KEY` is set correctly in Cloud Run |

---

## Quick Reference — Where to Get Credentials

| Credential | Location |
|-----------|----------|
| Supabase DB password | Supabase Dashboard → Settings → Database → Connection string |
| Supabase S3 keys | Supabase Dashboard → Settings → Storage → S3 Access Keys |
| Supabase anon key | Supabase Dashboard → Settings → API → anon public |
| Google Gemini API key | Google AI Studio → API Keys |
| Neo4j AuraDB credentials | Neo4j Console → https://console.neo4j.io |
| GCP Service Account JSON | GCP Console → IAM & Admin → Service Accounts → Keys |
| Cloud Run URLs | GCP Console → Cloud Run → Service → URL |

---

## What Changed from Azure

| Before (Azure) | After (GCP) |
|----------------|-------------|
| Azure Container Apps | Google Cloud Run |
| GHCR (GitHub Container Registry) | Artifact Registry (asia-southeast1) |
| Azure OIDC login | GCP service account JSON |
| Azure `container-apps-deploy-action` | `gcloud run deploy` |
| Internal DNS for AI service (`http://likaslens-ai-service:8001`) | Public Cloud Run URL |
| Azure deployment workflows (deleted) | GCP deployment workflows (new) |
