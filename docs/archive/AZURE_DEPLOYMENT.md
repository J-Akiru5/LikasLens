# LikasLens — Azure Production Deployment Guide

> **Purpose:** Get the production demo working on Azure Container Apps + Vercel
> **Last updated:** 2026-06-08

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  Vercel          │     │  Azure Container Apps │     │  Azure Container Apps │
│  (Frontend)      │────>│  (Backend)            │────>│  (AI Service)         │
│  likaslens.vercel│     │  likaslens-backend    │     │  likaslens-ai-service │
│  .app            │     │  :8000                │     │  :8001 (internal)     │
└─────────────────┘     └──────────┬───────────┘     └──────────┬───────────┘
                                   │                            │
                                   v                            v
                          ┌────────────────┐          ┌─────────────────┐
                          │  Supabase      │          │  Cosmos DB      │
                          │  PostgreSQL +  │          │  Gremlin        │
                          │  Storage (S3)  │          │  (Graph)        │
                          └────────────────┘          └─────────────────┘
```

---

## Step 1: Verify Supabase is Active

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check project `sfklmmtimelotqvrldni` is **Active** (not paused)
3. If paused, click **Resume** and wait ~2 minutes

---

## Step 2: Azure Container App — Backend (`likaslens-backend`)

Go to **Azure Portal** → Container Apps → `likaslens-backend` → **Environment variables**

Set these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `APP_KEY` | `base64:isMyFTXZYcT+KplXlw37lFSrpd8k95X3lzIS3G2nJiI=` | From sprint-dev3-backend.md |
| `APP_URL` | `https://likaslens-backend.<your-subdomain>.azurecontainerapps.io` | Get exact URL from Azure Portal |
| `DB_CONNECTION` | `pgsql` | |
| `DB_HOST` | `db.sfklmmtimelotqvrldni.supabase.co` | |
| `DB_PORT` | `5432` | |
| `DB_DATABASE` | `postgres` | |
| `DB_USERNAME` | `postgres.sfklmmtimelotqvrldni` | |
| `DB_PASSWORD` | *(from Supabase dashboard → Settings → Database)* | |
| `LOG_CHANNEL` | `stderr` | |
| `LOG_LEVEL` | `warning` | |
| `CACHE_STORE` | `file` | |
| `SESSION_DRIVER` | `file` | |
| `AI_SERVICE_URL` | `http://likaslens-ai-service:8001` | Internal DNS — same resource group |
| `SUPABASE_S3_ENDPOINT` | `https://sfklmmtimelotqvrldni.storage.supabase.co/storage/v1/s3` | |
| `SUPABASE_S3_ACCESS_KEY` | *(from Supabase → Settings → Storage → S3 Access Keys)* | |
| `SUPABASE_S3_SECRET_KEY` | *(from Supabase → Settings → Storage → S3 Access Keys)* | |
| `SUPABASE_S3_REGION` | `ap-southeast-1` | |
| `SUPABASE_STORAGE_BUCKET` | `likaslens-evidence` | |

**After setting env vars:** Click **Save**, then **Revision management** → **Create revision** to restart.

---

## Step 3: Azure Container App — AI Service (`likaslens-ai-service`)

Go to **Azure Portal** → Container Apps → `likaslens-ai-service` → **Environment variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `AI_SERVICE_PORT` | `8001` | |
| `GOOGLE_API_KEY` | *(your Google Gemini API key)* | |
| `COSMOS_GREMLIN_ENDPOINT` | `wss://<account>.gremlin.cosmos.azure.com:443/` | From Azure Cosmos DB portal |
| `COSMOS_GREMLIN_KEY` | *(from Cosmos DB → Keys)* | |
| `COSMOS_GREMLIN_DATABASE` | `likaslens` | |
| `COSMOS_GREMLIN_GRAPH` | `routing_graph` | |
| `COSMOS_GREMLIN_PARTITION_KEY` | `likaslens-routing-seed` | |
| `CORS_ORIGINS` | `https://likaslens.vercel.app,https://likaslens-admin.vercel.app,https://likaslens-backend.<subdomain>.azurecontainerapps.io` | Comma-separated origins |
| `ENVIRONMENT` | `production` | |

**After setting env vars:** Click **Save**, then **Revision management** → **Create revision**.

---

## Step 4: Vercel — Frontend

Go to **Vercel Dashboard** → `likaslens` project → **Settings** → **Environment Variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://likaslens-backend.<subdomain>.azurecontainerapps.io/api` | Get exact URL from Azure Portal |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sfklmmtimelotqvrldni.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from Supabase → Settings → API → anon public)* | |
| `NEXT_PUBLIC_ADMIN_PORTAL_URL` | `https://likaslens-admin.vercel.app` | |

**After setting env vars:** Go to **Deployments** → **Redeploy** the latest deployment.

---

## Step 5: Vercel — Admin Portal

Go to **Vercel Dashboard** → `likaslens-admin` project → **Settings** → **Environment Variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://likaslens-backend.<subdomain>.azurecontainerapps.io/api` | Same as frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sfklmmtimelotqvrldni.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from Supabase → Settings → API → anon public)* | |

---

## Step 6: Verify Endpoints

After all env vars are set and services restarted:

```bash
# Backend health check
curl https://likaslens-backend.<subdomain>.azurecontainerapps.io/api/health

# Expected: {"status":"ok","service":"likaslens-backend","timestamp":"..."}

# AI service health check (from backend, not public)
curl https://likaslens-backend.<subdomain>.azurecontainerapps.io/api/v1/chat \
  -X POST -H "Content-Type: application/json" \
  -d '{"message":"hello","history":[]}'

# Frontend
# Open https://likaslens.vercel.app in browser
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend returns 500 on DB endpoints | Missing/wrong `DB_*` env vars | Check Supabase is active, verify credentials |
| Backend returns 500 on `/api/reports` | Missing `SUPABASE_S3_*` env vars | Set S3 credentials in Azure |
| AI service returns 502 | Missing `GOOGLE_API_KEY` | Set Gemini API key |
| Frontend shows "Failed to fetch" | Wrong `NEXT_PUBLIC_API_URL` | Check exact Azure backend URL |
| CORS errors | Missing `CORS_ORIGINS` on AI service | Add Vercel + Azure domains |
| Supabase connection refused | Project paused | Resume in Supabase dashboard |

---

## Quick Reference — Where to Get Credentials

| Credential | Location |
|-----------|----------|
| Supabase DB password | Supabase Dashboard → Settings → Database → Connection string |
| Supabase S3 keys | Supabase Dashboard → Settings → Storage → S3 Access Keys |
| Supabase anon key | Supabase Dashboard → Settings → API → anon public |
| Google Gemini API key | Google AI Studio → API Keys |
| Cosmos DB endpoint + key | Azure Portal → Cosmos DB → Keys |
| Azure Container App URLs | Azure Portal → Container Apps → Overview → Application Url |
