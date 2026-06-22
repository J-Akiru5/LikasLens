# Jeff's Manual Configuration Roadmap

> **Purpose:** Tasks that require dashboard access, GCP console, or Supabase admin — cannot be automated via code.
> **Date:** June 21, 2026
> **Status:** Pending manual action

---

## 1. Google OAuth Setup (Issue #162)

### Step 1: Create GCP OAuth Credentials
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select or create a project
- [ ] Navigate to APIs & Services > Credentials
- [ ] Click "Create Credentials" > "OAuth 2.0 Client ID"
- [ ] Application type: "Web application"
- [ ] Name: "LikasLens"
- [ ] Authorized redirect URIs — add ALL of these:
  ```
  https://sfklmmtimelotqvrldni.supabase.co/auth/v1/callback
  http://localhost:3000/auth/callback
  http://localhost:3001/auth/callback
  http://localhost:3002/auth/callback
  ```
- [ ] Copy the **Client ID** and **Client Secret**

### Step 2: Enable Google Provider in Supabase
- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Select project: `sfklmmtimelotqvrldni`
- [ ] Navigate to Authentication > Providers
- [ ] Find "Google" and enable it
- [ ] Paste the GCP **Client ID** and **Client Secret**
- [ ] Save

### Step 3: Verify Redirect URLs in Supabase
- [ ] In Supabase Dashboard > Authentication > URL Configuration
- [ ] Add Site URLs:
  ```
  http://localhost:3000
  http://localhost:3001
  http://localhost:3002
  ```
- [ ] Add Redirect URLs:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3001/auth/callback
  http://localhost:3002/auth/callback
  https://likaslens.syntaxure.dev/auth/callback
  ```

### Step 4: Test
- [ ] Run `pnpm --filter frontend dev`
- [ ] Go to login page
- [ ] Click "Sign in with Google"
- [ ] Verify redirect to Google, then back to `/auth/callback`
- [ ] Verify session is established and redirected to dashboard

---

## 2. Vercel Deployment (When Limit Resets)

### Frontend
- [ ] Deploy `apps/frontend` to Vercel
- [ ] Set env vars in Vercel dashboard:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://sfklmmtimelotqvrldni.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env>
  NEXT_PUBLIC_API_URL=https://likaslens-api-1096292232709.asia-southeast1.run.app
  NEXT_PUBLIC_SITE_URL=https://likaslens.syntaxure.dev
  ```
- [ ] Verify OG images render (fix #174)

### Mobile PWA
- [ ] Deploy `apps/mobile-pwa` to Vercel
- [ ] Set env vars:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://sfklmmtimelotqvrldni.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env>
  NEXT_PUBLIC_API_URL=https://likaslens-api-1096292232709.asia-southeast1.run.app
  ```

### Admin Portal
- [ ] Deploy `apps/admin-portal` to Vercel
- [ ] Set env vars (same pattern)

---

## 3. Production Domain Configuration

### Backend (GCP Cloud Run)
- [ ] Verify `likaslens-api-1096292232709.asia-southeast1.run.app` is live
- [ ] Update `SANCTUM_STATEFUL_DOMAINS` in Cloud Run env to include:
  ```
  localhost,localhost:3000,localhost:3001,localhost:3002,likaslens.syntaxure.dev,likadmin.syntaxure.dev
  ```
- [ ] Update `CORS_ORIGINS` in Cloud Run env:
  ```
  https://likaslens.syntaxure.dev,https://likadmin.syntaxure.dev,http://localhost:3000,http://localhost:3001,http://localhost:3002
  ```

### AI Service (GCP Cloud Run)
- [ ] Verify `likaslens-ai-1096292232709.asia-southeast1.run.app` is live
- [ ] Verify `/health` returns OK
- [ ] Verify `/roboflow/health` returns OK

### Custom Domains
- [ ] Point `likaslens.syntaxure.dev` to Vercel (frontend)
- [ ] Point `likadmin.syntaxure.dev` to Vercel (admin-portal)
- [ ] Verify SSL certificates

---

## 4. Supabase Configuration Verification

### Auth Settings
- [ ] In Supabase Dashboard > Authentication > Settings
- [ ] Verify "Enable email confirmations" is OFF (for hackathon demo)
- [ ] Verify "Enable phone confirmations" is OFF
- [ ] Check "Site URL" is set correctly

### Database
- [ ] Verify `sessions` table exists (for Laravel session driver)
- [ ] Verify `personal_access_tokens` table exists (for Sanctum)
- [ ] Run any pending migrations if needed

### Storage
- [ ] Verify `likaslens-evidence` bucket exists
- [ ] Verify bucket is set to public or has proper RLS policies

---

## 5. Roboflow Configuration

- [ ] Verify Roboflow API key is set in AI service `.env`
- [ ] Test `GET /roboflow/health` on the deployed AI service
- [ ] Test `POST /analyze` with a sample garbage image
- [ ] Verify detections are returned and merged correctly

---

## 6. Post-Deployment Smoke Tests

### Frontend
- [ ] Landing page loads
- [ ] Login works (email/password)
- [ ] Login works (Google OAuth)
- [ ] Dashboard loads with data
- [ ] Report submission flow works
- [ ] OG image renders when sharing link

### Mobile PWA
- [ ] PWA install prompt appears
- [ ] Login works
- [ ] Dashboard loads
- [ ] Report submission works
- [ ] Camera permission handling works

### Admin Portal
- [ ] Login works (admin role required)
- [ ] Dashboard KPIs render
- [ ] Tickets page loads
- [ ] Triage page loads

### AI Service
- [ ] `/health` returns OK
- [ ] `/analyze` accepts image and returns detections
- [ ] `/roboflow/health` returns OK
- [ ] `/api/v1/analyze-hazard` returns legal context

---

## Notes

- Google OAuth requires GCP project with billing enabled (free tier is fine)
- Supabase free tier: 50,000 monthly active users, 500 MB database
- Roboflow free tier: $60/month credits (~60,000 inferences)
- Vercel free tier: 100 GB bandwidth, 1000 build minutes
- Cloud Run free tier: 2 million requests/month, 360,000 GB-seconds
