# Developer 3 — Backend, Infrastructure & Data

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 26h
> **Assigned To:** Charlyn
> **Focus:** Fix blockers, database seeding, admin portal, production APIs

---

## Team Roster (Updated)

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | Lou | Frontend/UI | Next.js UI, Tailwind, responsive design, Ghost Mode theme |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Gremlin graph, Gemini |
| Dev 3 | Charlyn | Backend/Infrastructure | Laravel API, Supabase, CI/CD, admin portal |
| Dev 4 | Katherine | Integration/PWA/APK | E2E testing, PWA offline, Capacitor APK, demo prep |

> **Note:** Roseby is no longer on the team. Katherine moved from Dev 1 to Dev 4. Lou joined as Dev 1.

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| New violation type codes | Dev 2 (Jeff) | Fri | Violation codes must match between Gremlin and DB |
| Demo script requirements | Dev 4 (Katherine) | Fri | Know what demo scenarios need seeded data |
| APK build support | Dev 4 (Katherine) | Sun | Backend CORS config for APK origin |

---

## Day 1 — Thursday, June 5

### Task 1.1: Fix Supabase Connection
**Time:** 3h | **Priority:** CRITICAL | **Status:** ⚠️ TEMPLATE ONLY

**Problem:** Supabase DNS may be unresolved or project paused.

**Current state:**
- `.env.example` is properly templated for Supabase PostgreSQL
- Live `.env` still uses SQLite (`DB_CONNECTION=sqlite`) as local fallback
- Supabase S3 storage keys present but empty
- No `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` set

**Steps:**
1. Verify Supabase project status at https://app.supabase.com
2. If project paused → unpause
3. If DNS fails → check if project needs to be recreated
4. Update `apps/backend/.env` with correct credentials:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=db.<project-ref>.supabase.co
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=<password>
   ```
5. Test connection: `php artisan migrate:status`
6. Run any pending migrations: `php artisan migrate`

**Acceptance Criteria:**
- [ ] `php artisan migrate:status` shows all migrations
- [ ] `php artisan db:seed` runs without errors
- [ ] `/api/health` returns 200

---

### Task 1.2: Fix Azure Container Apps — Switch Registry from ACR to ghcr.io
**Time:** 3h | **Priority:** CRITICAL | **Status:** ❌ NOT DONE

**Problem:** The Azure Container Registry (`likaslensregistry`) was deleted due to cost. Both Container Apps (backend + AI service) have `ImagePullBackOff` errors — they can't pull images from a registry that no longer exists.

**Current state:** Both GitHub Actions workflows still push to `likaslensregistry.azurecr.io`. No migration to `ghcr.io` has occurred.

**Solution:** Switch CI/CD to push images to **GitHub Container Registry (ghcr.io)** instead. Since the LikasLens repo is public, ghcr.io is completely free — no ACR needed.

---

#### Step 1: Update the Backend GitHub Actions Workflow

**File:** `.github/workflows/likaslens-backend-AutoDeployTrigger-03d66e26-917e-4e72-b9d3-b716a27a2988.yml`

Replace the registry references:

| Line | Current (broken) | New |
|------|-------------------|-----|
| permissions | `contents: read` | Add `packages: write` |
| registryUrl | `likaslensregistry.azurecr.io` | `ghcr.io` |
| registryUsername | `${{ secrets.LIKASLENSBACKEND_REGISTRY_USERNAME }}` | `${{ github.actor }}` |
| registryPassword | `${{ secrets.LIKASLENSBACKEND_REGISTRY_PASSWORD }}` | `${{ secrets.GITHUB_TOKEN }}` |
| imageToBuild | `likaslensregistry.azurecr.io/likaslens-backend:${{ github.sha }}` | `ghcr.io/${{ github.repository }}/likaslens-backend:${{ github.sha }}` |

---

#### Step 2: Update the AI Service GitHub Actions Workflow

**File:** `.github/workflows/likaslens-ai-service-AutoDeployTrigger-246f1a2c-6c72-4a80-b0b8-906dda9f04e9.yml`

Same changes as above.

---

#### Step 3: Push Changes to `main`

Merge the updated workflow files to `main`. The GitHub Actions pipeline will:
1. Build the Docker image from `apps/backend/Dockerfile`
2. Push it to `ghcr.io/j-akiru5/likas-lens/likaslens-backend:<commit-sha>`
3. Deploy it to the Azure Container App

---

#### Step 4: Set Container App Environment Variables (Backend)

After the first successful deploy, set the backend env vars via Azure Cloud Shell:

```bash
az containerapp update \
  --name likaslens-backend \
  --resource-group likaslens \
  --set-env-vars \
    APP_ENV=production \
    APP_DEBUG=false \
    APP_KEY="base64:..." \
    DB_CONNECTION=pgsql \
    DB_HOST="db.<project-ref>.supabase.co" \
    DB_PORT=5432 \
    DB_DATABASE=postgres \
    DB_USERNAME="postgres.<project-ref>" \
    DB_PASSWORD="<password>" \
    LOG_CHANNEL=stderr \
    LOG_LEVEL=warning \
    CACHE_STORE=file \
    SESSION_DRIVER=file \
    AI_SERVICE_URL="http://likaslens-ai-service:8001"
```

---

#### Step 5: Set Container App Environment Variables (AI Service)

```bash
az containerapp update \
  --name likaslens-ai-service \
  --resource-group likaslens \
  --set-env-vars \
    AI_SERVICE_PORT=8001 \
    GOOGLE_API_KEY="<GOOGLE_API_KEY>" \
    COSMOS_GREMLIN_ENDPOINT="wss://<account>.gremlin.cosmos.azure.com:443/" \
    COSMOS_GREMLIN_KEY="<COSMOS_KEY>" \
    COSMOS_GREMLIN_DATABASE=likaslens \
    COSMOS_GREMLIN_GRAPH=routing_graph \
    COSMOS_GREMLIN_PARTITION_KEY=likaslens-routing-seed \
    ENVIRONMENT=production
```

---

#### Step 6: Verify

```bash
# Check revision status
az containerapp revision list \
  --name likaslens-backend \
  --resource-group likaslens \
  --output table

# Get the backend FQDN
az containerapp show \
  --name likaslens-backend \
  --resource-group likaslens \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv

# Health check (replace <fQdn> with actual value)
curl https://<fQdn>/api/health
curl https://<fQdn>/api/tickets
```

---

#### Step 7: Clean Up Old ACR Secrets (Optional)

Remove obsolete secrets from GitHub repo settings:
- `LIKASLENSBACKEND_REGISTRY_USERNAME`
- `LIKASLENSBACKEND_REGISTRY_PASSWORD`
- `LIKASLENSAISERVICE_REGISTRY_USERNAME`
- `LIKASLENSAISERVICE_REGISTRY_PASSWORD`

---

**Acceptance Criteria:**
- [ ] Backend workflow pushes image to ghcr.io successfully
- [ ] AI service workflow pushes image to ghcr.io successfully
- [ ] Backend Container App revision shows `Provisioned` → `Running` (not `ImagePullBackOff`)
- [ ] AI service Container App revision shows `Provisioned` → `Running`
- [ ] Backend returns 200 on `/api/health`
- [ ] Backend can query Supabase (test `/api/tickets`)
- [ ] Backend can reach AI service internally
- [ ] No 500 errors on any endpoint

---

## Day 2 — Friday, June 6

### Task 2.1: Add New Violation Types Migration + Seeder
**Time:** 3h | **Priority:** HIGH | **Status:** ✅ DONE

**Current state:**
- Migration exists: `2026_04_11_000100_create_likaslens_domain_tables.php` (creates `violation_types` table)
- Model exists: `ViolationType.php` with `HasUuids`, `law()` and `defaultPenalty()` relationships
- Seeder embedded in `EnvironmentalLawSeeder.php` (lines 214-258)
- 4 violation types seeded: `SWM-ILLEGAL-DUMPING`, `AIR-EMISSION-VIOLATION`, `WATER-UNAUTHORIZED-DISCHARGE`, `HAZWASTE-HANDLING`

**Acceptance Criteria:**
- [x] Migration runs successfully
- [x] 4 violation types in database (embedded in EnvironmentalLawSeeder)
- [x] Each violation type linked to correct `environmental_laws_ph` record
- [x] Default penalties populated

---

### Task 2.2: Seed Demo Data
**Time:** 5h | **Priority:** HIGH | **Status:** ✅ DONE

**File:** `database/seeders/LikasLensSeeder.php` (237 lines)

**What was seeded:**
- 4 user roles: citizen, analyst, super_admin, ghost
- 4 additional citizen users with randomized trust scores
- Achievement unlocks for each user
- 15 tickets across all statuses with realistic Philippine locations
- Ticket evidence records with EXIF removal timestamps
- 10 Reports + 1 ghost anonymous report
- 5 NGOs (Green Earth Coalition, Clean Rivers Foundation, Philippine Reef Patrol, Forest Guardians PH, Save Sierra Madre Alliance)

**Acceptance Criteria:**
- [x] Seeder runs without errors
- [x] 8 users created with correct roles
- [x] 15 tickets with GPS coordinates in Western Visayas
- [x] Achievements unlocked for demo user
- [x] 5 NGOs with ticket assignments

---

## Day 3 — Saturday, June 7

### Task 3.1: Admin Portal Polish
**Time:** 5h | **Priority:** MEDIUM | **Status:** ✅ DONE

**5 Admin Controllers with full CRUD:**

| Controller | Operations |
|---|---|
| `AdminUserController` (170 lines) | index (search, filter by role, paginated, Supabase sync), show, update, updateRole (with audit logging), destroy (soft delete) |
| `AdminRewardController` (99 lines) | index (filter active, paginated), show, store (full validation), update, destroy |
| `AdminNgoController` (97 lines) | index (filter by region/active, paginated), show (with assignments), store, update, destroy |
| `AdminLawController` (105 lines) | index (search, filter active, eager load penalties/violationTypes), show, store, update, destroy |
| `AdminAuditLogController` (50 lines) | index (filter by action/entity_type/actor, paginated), show (read-only) |

**Acceptance Criteria:**
- [x] All admin endpoints return correct data
- [x] CRUD operations work for NGOs, Laws, Users, Rewards
- [x] Audit logs capture RBAC denials and role changes

---

### Task 3.2: Optimize Dashboard Queries
**Time:** 3h | **Priority:** MEDIUM | **Status:** ⚠️ FUNCTIONAL BUT NOT OPTIMIZED

**File:** `app/Http/Controllers/DashboardController.php` (96 lines)

**Current state:**
- `stats()`: Runs 7 separate count queries, uses SQLite-specific `JULIANDAY()` for avg response time, no caching
- `feed()`: Eager-loads `reporter`, limits to 20, but has N+1 problem (line 80: count query inside loop for `display_id`)

**Still needed:**
- [ ] Aggregate queries instead of separate counts
- [ ] Fix N+1 in feed method
- [ ] Replace SQLite-specific SQL with portable PostgreSQL syntax
- [ ] Add caching for leaderboard (5 min TTL)
- [ ] Add indexes on `tickets.status`, `tickets.created_at`

**Acceptance Criteria:**
- [ ] `/api/dashboard/stats` responds in < 200ms
- [ ] `/api/leaderboard` responds in < 100ms
- [ ] No N+1 queries on dashboard feed

---

## Day 4 — Sunday, June 8

### Task 4.1: Backend Hardening
**Time:** 3h | **Priority:** MEDIUM | **Status:** ⚠️ PARTIAL (CORS done, rate limiting NOT done)

**CORS:** ✅ Production-ready
- `config/cors.php` allows localhost:3000/3001/3002, production domains, Vercel/Azure regex patterns
- `HandleCors` middleware prepended in `bootstrap/app.php`

**Rate Limiting:** ❌ Not configured
- No `throttle` middleware on any routes in `api.php`
- No custom `RateLimiter::for()` definitions
- Only default auth throttle (60s) in `config/auth.php`

**Still needed:**
- [ ] Add rate limiting to public endpoints (60/min for `/api/reports`, `/api/reports/triage`)
- [ ] Ensure all error responses return proper JSON (not HTML)
- [ ] Verify Sanctum token expiry settings

---

### Task 4.2: Production Verification
**Time:** 1h | **Priority:** HIGH | **Status:** ✅ DONE

**Health Check:** EXISTS
- `/api/health` — custom endpoint returning service status + timestamp
- `/up` — Laravel's built-in health check

**Feature Tests:** 3 test suites
- `ReportSubmissionTest.php` (65 lines) — report submission, ghost mode, validation
- `EnsureRoleMiddlewareTest.php` (95 lines) — 7 test cases for RBAC
- `LeaderboardTest.php` (35 lines) — leaderboard ordering

**Acceptance Criteria:**
- [x] Health check endpoint exists
- [x] Core flow tests pass
- [x] RBAC middleware tested

---

## Risk Items

| Risk | Status | Mitigation |
|------|--------|-----------|
| Supabase project permanently lost | ⚠️ OPEN | Create new Supabase project, re-run all migrations |
| Azure Container App won't start | ⚠️ OPEN | Check logs with `az containerapp logs tail`; fix env vars |
| ~~ACR deleted — ImagePullBackOff~~ | ❌ NOT RESOLVED | CI/CD still uses ACR; needs migration to ghcr.io |
| ghcr.io push fails | ⚠️ OPEN | Verify `packages: write` permission in workflow; check `GITHUB_TOKEN` scope |
| Seeder fails on foreign keys | ✅ Resolved | Law seeder runs before violation type seeder |
| CORS blocks APK | ✅ Resolved | CORS config includes Vercel/Azure origins |

---

## Definition of Done

- [ ] Supabase connection working (local and production)
- [ ] CI/CD pipelines pushing to ghcr.io (backend + AI service)
- [ ] Azure backend deployed and healthy (no ImagePullBackOff)
- [ ] Azure AI service deployed and healthy
- [ ] Backend Container App env vars set (Supabase, APP_KEY, AI_SERVICE_URL)
- [ ] AI service Container App env vars set (Cosmos Gremlin, Google API key)
- [x] All 16 PH laws seeded with violation types
- [x] Demo data seeded (users, tickets, achievements, NGOs)
- [x] All admin CRUD endpoints functional
- [x] Health check + feature tests working
- [ ] All 40+ endpoints verified on production
- [ ] No 500 errors on any endpoint
