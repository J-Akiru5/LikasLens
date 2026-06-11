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

### Charlyn's Completed Work (from codebase evidence)
- ✅ Violation types migration + seeder (embedded in EnvironmentalLawSeeder)
- ✅ Demo data seeder (LikasLensSeeder.php — 237 lines)
- ✅ 5 Admin CRUD controllers (Users, Rewards, NGOs, Laws, Audit Logs)
- ✅ Audit log middleware captures RBAC denials with full context
- ✅ Health check + feature tests (3 test suites)
- ✅ CORS configuration (production-ready)
- ✅ PostgreSQL syntax fix (JULIANDAY → EXTRACT/EPOCH) — v0.7.0
- ✅ Rate limiting on auth + report endpoints — v0.7.1
- ✅ P0 security fixes (role escalation, admin endpoint protection, etc.) — v0.7.0
- ✅ HasApiTokens trait added to User model — v0.7.0
- ✅ Vercel outputDirectory corrected — v0.6.1
- ✅ Contact message controller + admin endpoints
- ✅ Achievements table rebuild
- ✅ Reporter email PII leak fixed (removed from public ticket response) — v0.7.1
- ✅ N+1 query fix in UserImpactController — v0.7.1
- ✅ TicketAssignment + Achievement pagination — v0.7.2

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
4. Update `apps/backend/.env` with correct credentials
5. Test connection: `php artisan migrate:status`
6. Run any pending migrations: `php artisan migrate`

**Acceptance Criteria:**
- [ ] `php artisan migrate:status` shows all migrations
- [ ] `php artisan db:seed` runs without errors
- [x] `/api/health` returns 200

---

### Task 1.2: Fix Azure Container Apps — Switch Registry from ACR to ghcr.io
**Time:** 3h | **Priority:** CRITICAL | **Status:** ❌ NOT DONE

**Problem:** The Azure Container Registry (`likaslensregistry`) was deleted due to cost. Both Container Apps (backend + AI service) have `ImagePullBackOff` errors — they can't pull images from a registry that no longer exists.

**Current state:** Both GitHub Actions workflows still push to `likaslensregistry.azurecr.io`. No migration to `ghcr.io` has occurred.

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
**Time:** 3h | **Priority:** MEDIUM | **Status:** ⚠️ PARTIAL

**File:** `app/Http/Controllers/DashboardController.php` (96 lines)

**Current state:**
- `stats()`: Runs 7 separate count queries, no caching
- `feed()`: Eager-loads `reporter`, limits to 20
- PostgreSQL syntax fix applied (EXTRACT/EPOCH instead of JULIANDAY)

**Still needed:**
- [ ] Aggregate queries instead of separate counts
- [ ] Add caching for leaderboard (5 min TTL)
- [ ] Add indexes on `tickets.status`, `tickets.created_at`

**Completed:**
- [x] Replace SQLite-specific SQL with portable PostgreSQL syntax
- [x] N+1 in feed method — not present (display_id computed inline)

**Acceptance Criteria:**
- [ ] `/api/dashboard/stats` responds in < 200ms
- [ ] `/api/leaderboard` responds in < 100ms
- [x] No N+1 queries on dashboard feed

---

## Day 4 — Sunday, June 8

### Task 4.1: Backend Hardening
**Time:** 3h | **Priority:** MEDIUM | **Status:** ✅ DONE

**CORS:** ✅ Production-ready
- `config/cors.php` allows localhost:3000/3001/3002, production domains, Vercel/Azure regex patterns
- `HandleCors` middleware prepended in `bootstrap/app.php`

**Rate Limiting:** ✅ Done (v0.7.1)
- `throttle:5,1` on `/auth/register`
- `throttle:10,1` on `/auth/login`
- `throttle:20,1` on `/auth/sync`
- `throttle:10,1` on `/reports`
- `throttle:20,1` on `/reports/triage`

**JSON Error Responses:** ✅ Done
- All controllers return `JsonResponse`
- `EnsureRole` middleware returns JSON for 401/403

**Still needed:**
- [ ] Verify Sanctum token expiry settings (`sanctum.php` line 53: `'expiration' => null`)

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

## Post-Sprint Work (Not in Original Sprint)

### Security Fixes (v0.7.0)
- ✅ Removed `role` parameter from `/auth/sync` — prevents privilege escalation
- ✅ Moved `/admin/users` index behind `auth:sanctum` + `role:super_admin` middleware
- ✅ Added `role:analyst,super_admin` middleware to `/reports/verify`
- ✅ Added `HasApiTokens` trait to User model — fixes all auth flows

### Stability Fixes (v0.7.1-v0.7.2)
- ✅ Removed reporter email from public `GET /tickets/{id}` response (PII leak)
- ✅ Fixed N+1 query in `UserImpactController` — batch-fetches tickets
- ✅ Added pagination to `TicketAssignment::index()` (20 per page)
- ✅ Added pagination to `AchievementController::catalog()` (50 per page)
- ✅ Contact message controller + admin endpoints

### Infrastructure (v0.6.1)
- ✅ Vercel `outputDirectory` corrected from `.next` to `apps/frontend/.next`
- ✅ Re-added `ignoreCommand` to vercel.json

---

## Risk Items

| Risk | Status | Mitigation |
|------|--------|-----------|
| Supabase project permanently lost | ⚠️ OPEN | Create new Supabase project, re-run all migrations |
| Azure Container App won't start | ⚠️ OPEN | Check logs with `az containerapp logs tail`; fix env vars |
| ~~ACR deleted — ImagePullBackOff~~ | ❌ NOT RESOLVED | CI/CD still uses ACR; needs migration to ghcr.io |
| ghcr.io push fails | ⚠️ OPEN | Verify `packages: write` permission in workflow; check `GITHUB_TOKEN` scope |
| Vercel 404 on all pages | ✅ RESOLVED | `outputDirectory` was `.next` instead of `apps/frontend/.next` in vercel.json |
| Seeder fails on foreign keys | ✅ Resolved | Law seeder runs before violation type seeder |
| CORS blocks APK | ✅ Resolved | CORS config includes Vercel/Azure origins |
| Role escalation via /auth/sync | ✅ RESOLVED | Removed role param from client input (v0.7.0) |
| Public admin endpoint | ✅ RESOLVED | /admin/users moved behind auth middleware (v0.7.0) |
| JULIANDAY on PostgreSQL | ✅ RESOLVED | Replaced with EXTRACT/EPOCH (v0.7.0) |

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
- [x] Rate limiting on auth + report endpoints
- [x] P0 security fixes applied
- [x] HasApiTokens trait added to User model
- [ ] All 40+ endpoints verified on production
- [ ] No 500 errors on any endpoint
