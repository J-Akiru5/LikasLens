# LikasLens — Google Cloud Platform (GCP) Deployment Guide

> **Purpose:** Deploy the Laravel backend and FastAPI AI service to Google Cloud Run
> **Last updated:** 2026-06-17
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
                          │  Supabase      │          │  Cosmos DB      │
                          │  PostgreSQL +  │          │  Gremlin        │
                          │  Storage (S3)  │          │  (Graph)        │
                          └────────────────┘          └─────────────────┘
```

**Why Cloud Run?** Google provisions servers automatically — wakes on traffic, sleeps when idle. Near-zero cost during the 3-month free credit period.

---

## Phase 1: GCP Project & Billing

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and log in.
2. Click the project dropdown at the top blue bar → **New Project**.
3. Project Name: `likaslens-backend` → Click **Create**.
4. Select the new project in the top bar.
5. Search **Billing** in the top search bar → Link your account to activate free credits.

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
| `DB_HOST` | `db.sfklmmtimelotqvrldni.supabase.co` |
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

5. Click **Create**. Wait ~1 minute.
6. **Save the public URL** (e.g., `https://likaslens-api-xyz.a.run.app`). This is your new backend URL.
7. Go back to **Edit & Deploy New Revision** → update `APP_URL` with this URL → **Deploy**.

### 4B: Deploy AI Service (`likaslens-ai`)

1. Click **+ Create Service** again.
2. Select **Test with a sample container**.
   - **Service name:** `likaslens-ai`
   - **Region:** `asia-southeast1`
   - **Authentication:** **Allow unauthenticated invocations**
3. Expand **Variables & Secrets** → **+ Add Variable** for each:

| Variable | Value |
|----------|-------|
| `AI_SERVICE_PORT` | `8001` |
| `GOOGLE_API_KEY` | *(from Google AI Studio → API Keys)* |
| `COSMOS_GREMLIN_ENDPOINT` | `wss://<account>.gremlin.cosmos.azure.com:443/` |
| `COSMOS_GREMLIN_KEY` | *(from Azure Cosmos DB → Keys)* |
| `COSMOS_GREMLIN_DATABASE` | `likaslens` |
| `COSMOS_GREMLIN_GRAPH` | `routing_graph` |
| `COSMOS_GREMLIN_PARTITION_KEY` | `likaslens-routing-seed` |
| `CORS_ORIGINS` | `https://likaslens.vercel.app,https://likaslens-admin.vercel.app,https://likaslens-api-xyz.a.run.app` |
| `ENVIRONMENT` | `production` |
| `APP_DEBUG` | `false` |

4. Click **Create**. Wait ~1 minute.
5. **Save the public URL** (e.g., `https://likaslens-ai-xyz.a.run.app`).

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

**To trigger:** Commit and push to `main`. Watch the GitHub Actions tab.

---

## Phase 6: Running Seeders

Use the GCP Cloud Shell (terminal icon `>_` at the top right of the GCP console):

```bash
# Create a one-off job to run migrations
gcloud run jobs create migrate-job \
  --image asia-southeast1-docker.pkg.dev/likaslens-backend/likaslens-repo/likaslens-backend:latest \
  --command "php,artisan,migrate,--force" \
  --region asia-southeast1

# Execute the job
gcloud run jobs execute migrate-job --region asia-southeast1
```

> **Note:** The `start.sh` entrypoint already runs `php artisan migrate --force` on every container boot, so migrations happen automatically. This step is only needed if you want to run seeders manually.

To run seeders:
```bash
gcloud run jobs create seed-job \
  --image asia-southeast1-docker.pkg.dev/likaslens-backend/likaslens-repo/likaslens-backend:latest \
  --command "php,artisan,db:seed,--force" \
  --region asia-southeast1

gcloud run jobs execute seed-job --region asia-southeast1
```

---

## Phase 7: Update Frontend Env Vars (Vercel)

Go to **Vercel Dashboard** → Project → **Settings** → **Environment Variables**:

| Variable | New Value |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://likaslens-api-xyz.a.run.app/api` |
| `NEXT_PUBLIC_AI_SERVICE_URL` | `https://likaslens-ai-xyz.a.run.app` |

Then **Redeploy** the latest deployment.

---

## Verify Endpoints

```bash
# Backend health check
curl https://likaslens-api-xyz.a.run.app/api/health
# Expected: {"status":"ok","service":"likaslens-backend","timestamp":"..."}

# AI service health check
curl https://likaslens-ai-xyz.a.run.app/health
# Expected: {"status":"ok"}

# Frontend
# Open https://likaslens.vercel.app in browser
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend returns 500 on DB endpoints | Missing/wrong `DB_*` env vars | Check Supabase is active, verify credentials |
| Backend returns 500 on `/api/reports` | Missing `SUPABASE_S3_*` env vars | Set S3 credentials in Cloud Run |
| AI service returns 502 | Missing `GOOGLE_API_KEY` | Set Gemini API key |
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
| Cosmos DB endpoint + key | Azure Portal → Cosmos DB → Keys |
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
