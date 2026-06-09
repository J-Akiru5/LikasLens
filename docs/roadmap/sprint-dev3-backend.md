# Developer 3 — Backend, Infrastructure & Data

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 26h
> **Focus:** Fix blockers, database seeding, admin portal, production APIs

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| New violation type codes | Dev 2 (AI) | Fri | Violation codes must match between Gremlin and DB |
| Demo script requirements | Dev 4 (Integration) | Fri | Know what demo scenarios need seeded data |
| APK build support | Dev 4 (Integration) | Sun | Backend CORS config for APK origin |

---

## Day 1 — Thursday, June 5

### Task 1.1: Fix Supabase Connection
**Time:** 3h | **Priority:** CRITICAL

**Problem:** Supabase DNS may be unresolved or project paused.

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
**Time:** 3h | **Priority:** CRITICAL

**Problem:** The Azure Container Registry (`likaslensregistry`) was deleted due to cost. Both Container Apps (backend + AI service) have `ImagePullBackOff` errors — they can't pull images from a registry that no longer exists.

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

**Updated workflow should look like:**

```yaml
name: Trigger auto deployment for likaslens-backend

on:
  push:
    branches: [ main ]
    paths:
    - '**'
    - '.github/workflows/likaslens-backend-AutoDeployTrigger-*.yml'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      packages: write    # Required for ghcr.io push

    steps:
      - name: Checkout to the branch
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.LIKASLENSBACKEND_AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.LIKASLENSBACKEND_AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.LIKASLENSBACKEND_AZURE_SUBSCRIPTION_ID }}

      - name: Build and push container image to registry
        uses: azure/container-apps-deploy-action@v2
        with:
          appSourcePath: ${{ github.workspace }}/apps/backend
          registryUrl: ghcr.io
          registryUsername: ${{ github.actor }}
          registryPassword: ${{ secrets.GITHUB_TOKEN }}
          containerAppName: likaslens-backend
          resourceGroup: likaslens
          imageToBuild: ghcr.io/${{ github.repository }}/likaslens-backend:${{ github.sha }}
```

---

#### Step 2: Update the AI Service GitHub Actions Workflow

**File:** `.github/workflows/likaslens-ai-service-AutoDeployTrigger-246f1a2c-6c72-4a80-b0b8-906dda9f04e9.yml`

Same changes as above:

| Line | Current (broken) | New |
|------|-------------------|-----|
| permissions | `contents: read` | Add `packages: write` |
| registryUrl | `likaslensregistry.azurecr.io` | `ghcr.io` |
| registryUsername | `${{ secrets.LIKASLENSAISERVICE_REGISTRY_USERNAME }}` | `${{ github.actor }}` |
| registryPassword | `${{ secrets.LIKASLENSAISERVICE_REGISTRY_PASSWORD }}` | `${{ secrets.GITHUB_TOKEN }}` |
| imageToBuild | `likaslensregistry.azurecr.io/likaslens-ai-service:${{ github.sha }}` | `ghcr.io/${{ github.repository }}/likaslens-ai-service:${{ github.sha }}` |

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
    APP_KEY="base64:isMyFTXZYcT+KplXlw37lFSrpd8k95X3lzIS3G2nJiI=" \
    DB_CONNECTION=pgsql \
    DB_HOST="db.sfklmmtimelotqvrldni.supabase.co" \
    DB_PORT=5432 \
    DB_DATABASE=postgres \
    DB_USERNAME="postgres.sfklmmtimelotqvrldni" \
    DB_PASSWORD="RZCpSUDmyRJ1uKVH" \
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
**Time:** 3h | **Priority:** HIGH

**New migration:** `database/migrations/2026_06_05_000001_add_asean_violation_types.php`

**New Violation Types to add:**

| Code | Name | Linked Law | Default Penalty |
|------|------|------------|-----------------|
| `ILLEGAL-LOGGING` | Illegal Logging / Deforestation | PD-705 | PHP 50K-500K + 6-12 yrs |
| `WILDLIFE-TRAFFICKING` | Wildlife Trafficking | RA-9147 | PHP 100K-1M + 4-6 yrs |
| `MARINE-POLLUTION` | Marine Pollution | PD-979 | PHP 50K-200K + 6-8 yrs |
| `OPEN-BURNING` | Open Burning | RA-8749 | PHP 10K-100K + 6 mos-6 yrs |
| `MANGROVE-DESTRUCTION` | Mangrove Clearing | RA-7611 | PHP 50K-500K + 4-8 yrs |
| `CORAL-REEF-DAMAGE` | Coral Reef Destruction | RA-9147 | PHP 100K-1M + 4-6 yrs |
| `PROTECTED-AREA-INTRUSION` | Protected Area Violation | RA-7586 | PHP 20K-200K + 1-4 yrs |

**Update seeder:** `database/seeders/ViolationTypeSeeder.php`

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] 11 total violation types in database (4 existing + 7 new)
- [ ] Each violation type linked to correct `environmental_laws_ph` record
- [ ] Default penalties populated

---

### Task 2.2: Seed Demo Data
**Time:** 5h | **Priority:** HIGH

**Create or update:** `database/seeders/DemoDataSeeder.php`

**Demo Data Requirements:**

#### Users (8 users)
| Name | Role | Purpose |
|------|------|---------|
| Maria Santos | citizen | Active reporter, Eco Champion rank |
| Juan dela Cruz | citizen | New user, Citizen rank |
| Ana Reyes | citizen | Ghost user (anonymous) |
| Carlo Mendoza | analyst | Ticket assignment demo |
| Admin User | super_admin | Admin portal demo |
| + 3 more citizens | citizen | Leaderboard variety |

#### Tickets (15-20 tickets)
Spread across:
- **Locations:** Aklan, Antique, Capiz, Guimaras, Iloilo, Negros Occidental
- **Types:** Illegal dumping (5), Air emission (3), Water discharge (3), Illegal logging (3), Wildlife (1), Open burning (2), Marine (1), Mangrove (1)
- **Statuses:** Open (5), Investigating (4), Monitoring (3), Resolved (5), Closed (3)
- **AI Confidence:** Range from 0.65 to 0.98

#### Achievements (unlocked for Maria Santos)
- First Report, Hawk Eye, Water Guardian, Pollution Buster
- Sharp Shooter (5 reports), Truth Seeker (5 LGU-verified)
- Environmental Guardian (10 reports)

#### Eco-Credit Wallet
- Maria Santos: 2,500 credits, lifetime earned 5,000
- Juan dela Cruz: 150 credits, lifetime earned 200
- CreditPool: "San Miguel ESG Demo Pool" with 1M credits

#### NGOs (5 active NGOs)
- Green Dingle Initiative (Aklan)
- Bantay Kalikasan (Iloilo)
- Coastal Guardians PH (Guimaras)
- Forest Watch Negros (Negros Occidental)
- Panay Eco Warriors (Antique)

#### Ticket Assignments (8 assignments)
- Link resolved/investigating tickets to NGOs

**Acceptance Criteria:**
- [ ] Seeder runs without errors
- [ ] 8 users created with correct roles
- [ ] 15-20 tickets with GPS coordinates in Western Visayas
- [ ] Achievements unlocked for demo user
- [ ] Eco-credit wallets populated
- [ ] 5 NGOs with ticket assignments
- [ ] Leaderboard shows ranked users

---

## Day 3 — Saturday, June 7

### Task 3.1: Admin Portal Polish
**Time:** 5h | **Priority:** MEDIUM

**Ensure all admin CRUD operations work:**

#### NGO Management (`/api/admin/ngos`)
- [ ] List all NGOs with search/filter
- [ ] Create new NGO with all fields
- [ ] Edit NGO details
- [ ] Deactivate/activate NGO
- [ ] Verify NGO (is_verified toggle)

#### Law Management (`/api/admin/laws`)
- [ ] List all 16+ laws with search
- [ ] View law detail with penalties
- [ ] Create new law
- [ ] Edit law
- [ ] Delete law (soft delete or cascade)

#### User Management (`/api/admin/users`)
- [ ] List all users with role filter
- [ ] View user detail
- [ ] Change user role (citizen/analyst/super_admin)
- [ ] Deactivate user

#### Rewards Catalog (`/api/admin/rewards`)
- [ ] List rewards
- [ ] Create/edit reward
- [ ] Link to partner stores

#### Audit Logs (`/api/admin/audit-logs`)
- [ ] View all audit entries
- [ ] Filter by actor, action, entity
- [ ] Detail view with old/new values

**Acceptance Criteria:**
- [ ] All admin endpoints return correct data
- [ ] CRUD operations work for NGOs, Laws, Users, Rewards
- [ ] Audit logs capture RBAC denials and role changes

---

### Task 3.2: Optimize Dashboard Queries
**Time:** 3h | **Priority:** MEDIUM

**File:** `app/Http/Controllers/DashboardController.php`

**Optimize:**
- [ ] `/api/dashboard/stats` — use DB query builder instead of loading all tickets
- [ ] `/api/dashboard/feed` — limit to 20 items, eager load reporter
- [ ] `/api/leaderboard` — cache top 20 for 5 minutes
- [ ] Add indexes if missing on `tickets.status`, `tickets.created_at`

**Acceptance Criteria:**
- [ ] `/api/dashboard/stats` responds in < 200ms
- [ ] `/api/leaderboard` responds in < 100ms
- [ ] No N+1 queries on dashboard feed

---

## Day 4 — Sunday, June 8

### Task 4.1: Backend Hardening
**Time:** 3h | **Priority:** MEDIUM

- [ ] Add rate limiting to public endpoints (60/min for `/api/reports`, `/api/reports/triage`)
- [ ] Verify CORS config allows frontend origin
- [ ] Add CORS for APK origin if Dev 4 provides it
- [ ] Ensure all error responses return proper JSON (not HTML)
- [ ] Verify Sanctum token expiry settings

---

### Task 4.2: Production Verification
**Time:** 1h | **Priority:** HIGH

**Test all 40+ endpoints on deployed environment:**

```bash
# Health
curl https://<backend>/api/health

# Public
curl https://<backend>/api/leaderboard
curl https://<backend>/api/achievements
curl https://<backend>/api/laws
curl https://<backend>/api/tickets

# Auth (requires token)
curl -H "Authorization: Bearer <token>" https://<backend>/api/user/profile
curl -H "Authorization: Bearer <token>" https://<backend>/api/user/impact
curl -H "Authorization: Bearer <token>" https://<backend>/api/dashboard/stats

# Admin (requires admin token)
curl -H "Authorization: Bearer <admin-token>" https://<backend>/api/admin/ngos
curl -H "Authorization: Bearer <admin-token>" https://<backend>/api/admin/laws
```

**Acceptance Criteria:**
- [ ] All public endpoints return 200
- [ ] All authenticated endpoints return 200 with valid token
- [ ] All admin endpoints return 200 with admin token
- [ ] No 500 errors on any endpoint

---

## Risk Items

| Risk | Mitigation |
|------|-----------|
| Supabase project permanently lost | Create new Supabase project, re-run all migrations |
| Azure Container App won't start | Check logs with `az containerapp logs tail`; fix env vars |
| ~~ACR deleted — ImagePullBackOff~~ | **RESOLVED:** Switched CI/CD to ghcr.io (free for public repos) |
| ghcr.io push fails | Verify `packages: write` permission in workflow; check `GITHUB_TOKEN` scope |
| Container App can't pull from ghcr.io | Ensure repo/package is public; for private repos, set image pull credentials on Container App |
| Seeder fails on foreign keys | Ensure law seeder runs before violation type seeder |
| CORS blocks APK | Add APK origin to `config/cors.php` allowed_origins |

---

## Definition of Done

- [ ] Supabase connection working (local and production)
- [ ] CI/CD pipelines pushing to ghcr.io (backend + AI service)
- [ ] Azure backend deployed and healthy (no ImagePullBackOff)
- [ ] Azure AI service deployed and healthy
- [ ] Backend Container App env vars set (Supabase, APP_KEY, AI_SERVICE_URL)
- [ ] AI service Container App env vars set (Cosmos Gremlin, Google API key)
- [ ] All 16 PH laws seeded with violation types
- [ ] Demo data seeded (users, tickets, achievements, NGOs)
- [ ] All admin CRUD endpoints functional
- [ ] All 40+ endpoints verified on production
- [ ] No 500 errors on any endpoint
