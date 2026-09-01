# Developer 3 — Backend + Admin Portal

> **Sprint:** IPOPHL SRT Sprint (v0.9.x → v1.0)
> **Timeline:** June 21–28, 2026 (Sat–Sat)
> **Assigned To:** Cha (Charlyn)
> **Focus:** Admin portal polish, backend admin APIs, multi-tenancy, RBAC hardening

---

## Team Roster

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | Lou | Frontend/UI | Next.js UI, Tailwind, responsive design, Ghost Mode theme |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Neo4j graph, Gemini |
| Dev 3 | Cha | Backend + Admin | Laravel API, admin portal, multi-tenancy, RBAC |
| Dev 4 | Katherine | Integration/PWA | E2E testing, PWA offline, Capacitor APK, demo prep |

---

## Summary of Responsibilities

Cha owns the **backend admin layer** and the **admin-portal Next.js app** (`apps/admin-portal`, port 3002). This sprint focuses on:

1. Polishing all 15+ admin portal routes to production quality
2. Wiring multi-tenancy (`ResolveTenant`) into admin route groups
3. Registering `TenantController` routes for tenant CRUD
4. Completing bulk operations testing (6 bulk endpoints)
5. Hardening RBAC across all admin roles (`analyst`, `super_admin`)
6. Ensuring admin-side features work correctly (related to #171)

---

## Completed Work (Pre-Sprint)

- [x] PH law mapping + violation types seeder — `database/seeders/EnvironmentalLawSeeder.php`
- [x] Indonesia comparison layer for multi-tenancy expansion
- [x] Jurisdiction-scoped Cypher queries (Neo4j integration)
- [x] LGU escalation workflow spec (commit `ec8e047`)
- [x] 5 Admin CRUD controllers: `AdminUserController`, `AdminRewardController`, `AdminNgoController`, `AdminLawController`, `AdminAuditLogController`
- [x] Audit log middleware captures RBAC denials — `EnsureRole.php:29-38`
- [x] `TenantController` full CRUD — `app/Http/Controllers/Admin/TenantController.php`
- [x] `ResolveTenant` middleware — `app/Http/Middleware/ResolveTenant.php`
- [x] `auth-init.ts` for admin portal token refresh — `apps/admin-portal/src/lib/auth-init.ts`
- [x] Contact message controller + admin endpoints
- [x] Bulk operations controller — `AdminBulkController.php` (6 endpoints)
- [x] `AdminTriageController` — classify, dismiss, escalate
- [x] `AdminLguPerformanceController` — LGU performance dashboard
- [x] `PredictionController` — predictive hotspots
- [x] `BiasRiskRegisterController` — bias/risk register
- [x] Loading pages + error boundaries for all admin routes

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| AI triage confidence scores | Dev 2 (Jeff) | Wed | Triage queue filters on `ai_confidence < 0.6000`; AI service must return valid scores |
| Prediction model endpoints | Dev 2 (Jeff) | Thu | `PredictionService` calls AI service for hotspot data |
| Frontend admin route links | Dev 1 (Lou) | Tue | Shared sidebar nav must link to admin-portal routes |
| PWA admin access test | Dev 4 (Katherine) | Fri | Verify admin features are NOT exposed on mobile-pwa (#171) |
| OpenAPI spec alignment | Dev 4 (Katherine) | Wed | Any new/changed admin endpoints must be documented in OpenAPI |

---

## Priority: CRITICAL

### Task C1: Wire `ResolveTenant` into Admin Route Groups
**Time:** 2h | **Priority:** CRITICAL | **Status:** NOT STARTED

**Description:** The `ResolveTenant` middleware exists but is not applied to admin route groups in `api.php`. All admin endpoints need tenant context for multi-tenant data isolation.

**File:** `apps/backend/routes/api.php`

**Steps:**
1. Add `ResolveTenant` to the `role:super_admin` middleware group
2. Verify tenant resolution falls back to `default` tenant for single-tenant mode
3. Test that `Tenant::getCurrent()` returns correct tenant inside admin controllers
4. Ensure `X-Tenant-Slug` header from admin-portal is respected

**Acceptance Criteria:**
- [ ] All `/admin/*` routes resolve tenant context
- [ ] `Tenant::getCurrent()` returns non-null inside admin controllers
- [ ] Single-tenant mode still works (falls back to `default` tenant)
- [ ] Multi-tenant header (`X-Tenant-Slug`) correctly scopes data

**References:** `app/Http/Middleware/ResolveTenant.php`, `routes/api.php:189-254`

---

### Task C2: Register `TenantController` Routes for Admin CRUD
**Time:** 1h | **Priority:** CRITICAL | **Status:** NOT STARTED

**Description:** `TenantController` has full CRUD but no routes are registered in `api.php`. Add routes under `super_admin` middleware.

**File:** `apps/backend/routes/api.php`

**Steps:**
1. Import `App\Http\Controllers\Admin\TenantController`
2. Register inside `role:super_admin` group:
   - `GET /admin/tenants` → `index`
   - `POST /admin/tenants` → `store`
   - `GET /admin/tenants/{id}` → `show`
   - `PUT /admin/tenants/{id}` → `update`
   - `DELETE /admin/tenants/{id}` → `destroy`
3. Test all 5 endpoints with `super_admin` token
4. Verify 403 for non-super_admin roles

**Acceptance Criteria:**
- [ ] `GET /admin/tenants` returns tenant list
- [ ] `POST /admin/tenants` creates tenant with valid slug
- [ ] `PUT /admin/tenants/{id}` updates branding/config
- [ ] `DELETE /admin/tenants/{id}` soft-deletes (not default tenant)
- [ ] 403 returned for `analyst` role

**References:** `app/Http/Controllers/Admin/TenantController.php`

---

### Task C3: Fix #171 — Admin-Side Status/Remove Actions
**Time:** 3h | **Priority:** CRITICAL | **Status:** NOT STARTED | **Issue:** #171

**Description:** Issue #171 reports citizens see admin-only actions on mobile-pwa. The admin-portal must have these features working correctly: Change Status and Remove on tickets. Verify admin portal properly gates these actions.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/tickets/page.tsx`
- `apps/backend/app/Http/Controllers/TicketController.php`
- `apps/backend/routes/api.php:257-260`

**Steps:**
1. Verify `PATCH /tickets/{id}/status` requires `analyst` or `super_admin` role
2. Verify `DELETE /tickets/{id}` requires `super_admin` role
3. Test admin-portal tickets page shows status change dropdown for authorized roles
4. Test admin-portal tickets page shows remove button for `super_admin` only
5. Confirm mobile-pwa does NOT render these actions (coordinate with Dev 4)

**Acceptance Criteria:**
- [ ] Admin portal: status change works for `analyst` and `super_admin`
- [ ] Admin portal: remove works for `super_admin` only
- [ ] API returns 403 for unauthorized role attempts
- [ ] Audit log records all status changes and deletions

**References:** `routes/api.php:257-260`, `TicketController.php`

---

## Priority: HIGH

### Task H1: Polish Admin Triage Queue
**Time:** 3h | **Priority:** HIGH | **Status:** NOT STARTED

**Description:** `AdminTriageController` has classify, dismiss, and escalate actions. Ensure the admin-portal triage page renders the queue correctly with urgency sorting, AI confidence badges, and action buttons.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/triage/page.tsx`
- `apps/backend/app/Http/Controllers/AdminTriageController.php`

**Steps:**
1. Verify triage page fetches from `GET /admin/triage` with pagination
2. Test classify action: `POST /admin/triage/{id}/classify` with violation type
3. Test dismiss action: `POST /admin/triage/{id}/dismiss` with reason
4. Test escalate action: `POST /admin/triage/{id}/escalate` with target LGU
5. Verify urgency score sorting (NULL last, DESC)
6. Add loading skeleton and empty state

**Acceptance Criteria:**
- [ ] Triage queue loads with correct sort order
- [ ] Classify action assigns violation type and updates ticket
- [ ] Dismiss action records reason in audit log
- [ ] Escalate action creates LGU escalation record
- [ ] Loading/empty states render correctly

**References:** `AdminTriageController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/triage/`

---

### Task H2: Polish LGU Performance Dashboard
**Time:** 2h | **Priority:** HIGH | **Status:** NOT STARTED

**Description:** `AdminLguPerformanceController` provides LGU response time metrics. Ensure admin-portal page displays performance data with proper charts and filtering.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/lgu-performance/page.tsx`
- `apps/backend/app/Http/Controllers/AdminLguPerformanceController.php`

**Steps:**
1. Verify page fetches from `GET /admin/lgu-performance`
2. Test filtering by region and date range
3. Verify response time metrics display correctly
4. Add error boundary handling for empty data

**Acceptance Criteria:**
- [ ] LGU performance page loads with data
- [ ] Filters work (region, date range)
- [ ] Metrics display: avg response time, escalation count, resolution rate
- [ ] Empty state shows when no data available

**References:** `AdminLguPerformanceController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/lgu-performance/`

---

### Task H3: Polish Predictions Page
**Time:** 2h | **Priority:** HIGH | **Status:** NOT STARTED

**Description:** `PredictionController` returns environmental hotspots. Ensure admin-portal predictions page shows hotspot data with map visualization and filtering.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/predictions/page.tsx`
- `apps/backend/app/Http/Controllers/PredictionController.php`

**Steps:**
1. Verify page fetches from `GET /admin/predictions` with params (`days_back`, `top_n`, `violation_type`)
2. Test violation type filter dropdown
3. Verify hotspot data renders (coordinates, risk score, predicted violations)
4. Add loading state and error handling

**Acceptance Criteria:**
- [ ] Predictions page loads with hotspot data
- [ ] Violation type filter works
- [ ] Hotspot list shows risk scores and coordinates
- [ ] Loading skeleton renders during fetch

**References:** `PredictionController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/predictions/`

---

### Task H4: Polish Bias Risk Register Page
**Time:** 1.5h | **Priority:** HIGH | **Status:** NOT STARTED

**Description:** `BiasRiskRegisterController` returns bias/risk data. Ensure admin-portal page displays the register with proper formatting.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/analytics/page.tsx` (or dedicated bias page)
- `apps/backend/app/Http/Controllers/BiasRiskRegisterController.php`

**Steps:**
1. Verify page fetches from `GET /admin/bias-register`
2. Test data display: category, risk description, mitigation status
3. Add sorting by category
4. Handle empty register state

**Acceptance Criteria:**
- [ ] Bias register page loads with data
- [ ] Risks grouped by category
- [ ] Mitigation status visible
- [ ] Empty state handled

**References:** `BiasRiskRegisterController.php`

---

### Task H5: Bulk Operations End-to-End Testing
**Time:** 3h | **Priority:** HIGH | **Status:** NOT STARTED

**Description:** `AdminBulkController` has 6 bulk endpoints. Test each thoroughly with valid and invalid payloads, and verify audit logging.

**Files:**
- `apps/backend/app/Http/Controllers/AdminBulkController.php`
- `apps/admin-portal/src/components/bulk-actions-bar.tsx`
- `apps/admin-portal/src/hooks/use-bulk-select.ts`

**Endpoints to test:**

| Endpoint | Method | Action |
|----------|--------|--------|
| `/admin/tickets/bulk-status` | POST | Update status for up to 100 tickets |
| `/admin/tickets/bulk-assign` | POST | Assign analyst to multiple tickets |
| `/admin/users/bulk-role` | POST | Change role for multiple users |
| `/admin/users/bulk-deactivate` | POST | Deactivate multiple users |
| `/admin/ngos/bulk-verify` | POST | Verify multiple NGOs |
| `/admin/ngos/bulk-delete` | POST | Delete multiple NGOs |

**Steps:**
1. Test each endpoint with valid IDs (expect 200)
2. Test with invalid IDs (expect validation error)
3. Test with empty array (expect 422)
4. Test with >100 items (expect 422)
5. Verify audit log entries created for each bulk operation
6. Verify `bulk-actions-bar.tsx` triggers correct API calls
7. Test `use-bulk-select.ts` hook selection logic

**Acceptance Criteria:**
- [ ] All 6 bulk endpoints return correct responses
- [ ] Validation rejects invalid payloads
- [ ] Audit logs created for each bulk operation
- [ ] Admin portal bulk actions bar wired to correct endpoints
- [ ] Selection hook handles select/deselect all

**References:** `AdminBulkController.php`, `apps/admin-portal/src/components/bulk-actions-bar.tsx`

---

### Task H6: Admin Audit Log Review
**Time:** 1.5h | **Priority:** HIGH | **Status:** NOT STARTED

**Description:** Review and polish the audit log page. Ensure all admin actions are captured and the log is filterable.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/audit-logs/page.tsx`
- `apps/backend/app/Http/Controllers/AdminAuditLogController.php`

**Steps:**
1. Verify audit log page fetches from `GET /admin/audit-logs`
2. Test filters: `action`, `entity_type`, `actor_user_id`
3. Verify pagination works
4. Check that recent admin actions appear (bulk ops, role changes, RBAC denials)
5. Verify detail view: `GET /admin/audit-logs/{id}`

**Acceptance Criteria:**
- [ ] Audit log page loads with paginated results
- [ ] Filters work correctly
- [ ] Detail view shows full context (old/new values, IP, user agent)
- [ ] Recent bulk operations appear in log

**References:** `AdminAuditLogController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/audit-logs/`

---

## Priority: MEDIUM

### Task M1: Contact Message Management
**Time:** 2h | **Priority:** MEDIUM | **Status:** NOT STARTED

**Description:** Admin portal inquiries page should allow viewing and marking contact messages as read.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/inquiries/page.tsx`
- `apps/backend/app/Http/Controllers/ContactMessageController.php`

**Steps:**
1. Verify inquiries page fetches from `GET /admin/contact-messages`
2. Test mark-as-read: `PATCH /admin/contact-messages/{id}/read`
3. Add unread count badge
4. Verify pagination and sorting (newest first)

**Acceptance Criteria:**
- [ ] Inquiries page loads with messages
- [ ] Mark-as-read action works
- [ ] Unread messages visually distinct
- [ ] Pagination works

**References:** `ContactMessageController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/inquiries/`

---

### Task M2: Admin NGO Management Polish
**Time:** 2h | **Priority:** MEDIUM | **Status:** NOT STARTED

**Description:** Ensure NGO CRUD is fully functional in admin portal with region filtering and verification status.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/ngos/page.tsx`
- `apps/backend/app/Http/Controllers/AdminNgoController.php`

**Steps:**
1. Verify NGO list page with region/active filters
2. Test create NGO form with validation
3. Test edit NGO with pre-populated data
4. Test delete with confirmation dialog
5. Verify NGO detail shows ticket assignments

**Acceptance Criteria:**
- [ ] NGO list loads with filters
- [ ] Create/edit forms validate correctly
- [ ] Delete confirmation works
- [ ] Detail view shows assignments

**References:** `AdminNgoController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/ngos/`

---

### Task M3: Admin Law Management Polish
**Time:** 2h | **Priority:** MEDIUM | **Status:** NOT STARTED

**Description:** Ensure law CRUD is fully functional with search, active filter, and penalty/violation type relationships.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/laws/page.tsx`
- `apps/backend/app/Http/Controllers/AdminLawController.php`

**Steps:**
1. Verify law list with search and active filter
2. Test create law form
3. Test edit law with eager-loaded penalties/violation types
4. Test delete with constraint check
5. Verify public read endpoints still work (`GET /laws`)

**Acceptance Criteria:**
- [ ] Law list loads with search and filters
- [ ] Create/edit forms work
- [ ] Penalties and violation types display
- [ ] Public endpoints unaffected

**References:** `AdminLawController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/laws/`

---

### Task M4: Admin Reward Management Polish
**Time:** 1.5h | **Priority:** MEDIUM | **Status:** NOT STARTED

**Description:** Ensure reward catalog CRUD works in admin portal.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/rewards/page.tsx`
- `apps/backend/app/Http/Controllers/AdminRewardController.php`

**Steps:**
1. Verify reward list with active filter
2. Test create reward with validation (name, cost, stock)
3. Test edit reward
4. Test delete reward
5. Verify citizen-facing reward endpoints still work

**Acceptance Criteria:**
- [ ] Reward list loads
- [ ] CRUD operations work
- [ ] Validation rejects invalid data
- [ ] Citizen endpoints unaffected

**References:** `AdminRewardController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/rewards/`

---

### Task M5: Currency Settings Management
**Time:** 1h | **Priority:** MEDIUM | **Status:** NOT STARTED

**Description:** Ensure currency settings CRUD works for eco-credit rate configuration.

**Files:**
- `apps/admin-portal/src/app/[locale]/(dashboard)/settings/page.tsx`
- `apps/backend/app/Http/Controllers/CurrencySettingController.php`

**Steps:**
1. Verify settings page loads current eco-credit rate
2. Test update rate
3. Verify public `GET /settings/eco-credit-rate` returns updated value
4. Test validation on invalid rates

**Acceptance Criteria:**
- [ ] Settings page shows current rate
- [ ] Update works
- [ ] Public endpoint reflects changes
- [ ] Validation prevents invalid values

**References:** `CurrencySettingController.php`, `apps/admin-portal/src/app/[locale]/(dashboard)/settings/`

---

## Priority: LOW

### Task L1: RBAC Testing — All Admin Roles
**Time:** 3h | **Priority:** LOW | **Status:** NOT STARTED

**Description:** Systematic RBAC testing across all admin endpoints for `analyst` and `super_admin` roles. Verify 403 for unauthorized access.

**Test Matrix:**

| Endpoint Group | `analyst` | `super_admin` |
|----------------|-----------|---------------|
| `/admin/users` | 403 | 200 |
| `/admin/ngos` (read) | 200 | 200 |
| `/admin/ngos` (write) | 403 | 200 |
| `/admin/laws` (read) | 200 | 200 |
| `/admin/laws` (write) | 403 | 200 |
| `/admin/rewards` | 403 | 200 |
| `/admin/audit-logs` | 403 | 200 |
| `/admin/triage` | 403 | 200 |
| `/admin/predictions` | 403 | 200 |
| `/admin/bulk/*` | 403 | 200 |
| `/admin/tenants` | 403 | 200 |
| `/admin/contact-messages` | 403 | 200 |
| `/admin/lgu-performance` | 403 | 200 |
| `/admin/currency-settings` | 403 | 200 |
| `/admin/pattern-escalation` | 403 | 200 |
| `/tickets/{id}/status` (patch) | 200 | 200 |
| `/reports/verify` | 200 | 200 |

**Steps:**
1. Create test tokens for `analyst` and `super_admin`
2. Run each endpoint with both tokens
3. Verify expected status codes
4. Check audit log captures all 403 denials
5. Document any gaps

**Acceptance Criteria:**
- [ ] All `super_admin` endpoints return 200
- [ ] All restricted endpoints return 403 for `analyst`
- [ ] Analyst-accessible endpoints return 200
- [ ] All 403s logged in audit table

**References:** `EnsureRole.php`, `routes/api.php`

---

### Task L2: Admin Portal Loading States Audit
**Time:** 1.5h | **Priority:** LOW | **Status:** NOT STARTED

**Description:** Verify all 15+ admin portal routes have proper loading.tsx and error.tsx files. Recent pull added loading page improvements.

**Routes to audit:**

| Route | Loading | Error |
|-------|---------|-------|
| `/dashboard` | ✅ | ✅ |
| `/users` | ✅ | ✅ |
| `/tickets` | ✅ | ✅ |
| `/triage` | ✅ | ✅ |
| `/laws` | ✅ | ✅ |
| `/ngos` | ✅ | ✅ |
| `/audit-logs` | ✅ | ✅ |
| `/analytics` | ✅ | ✅ |
| `/predictions` | ✅ | ✅ |
| `/lgu-performance` | ✅ | ✅ |
| `/rewards` | ✅ | ✅ |
| `/settings` | ✅ | ✅ |
| `/inquiries` | ✅ | ✅ |
| `/changelog` | ✅ | ✅ |

**Steps:**
1. Navigate to each route and verify loading skeleton appears
2. Simulate API errors and verify error boundary catches them
3. Verify error pages have retry buttons
4. Check that loading states match actual content layout

**Acceptance Criteria:**
- [ ] All routes show loading skeleton on initial load
- [ ] All routes show error boundary on API failure
- [ ] Error pages have retry functionality
- [ ] No blank white screens during loading

---

### Task L3: Dashboard Query Optimization
**Time:** 2h | **Priority:** LOW | **Status:** PARTIAL

**Description:** Optimize dashboard stats and leaderboard queries for sub-200ms response times.

**File:** `apps/backend/app/Http/Controllers/DashboardController.php`

**Steps:**
1. Replace 7 separate count queries with single aggregate query
2. Add Redis/cache for leaderboard (5 min TTL)
3. Add database indexes on `tickets.status`, `tickets.created_at`
4. Benchmark `/api/dashboard/stats` < 200ms
5. Benchmark `/api/leaderboard` < 100ms

**Acceptance Criteria:**
- [ ] `/api/dashboard/stats` responds in < 200ms
- [ ] `/api/leaderboard` responds in < 100ms
- [ ] No N+1 queries
- [ ] Cache invalidation works on new ticket creation

**References:** `DashboardController.php`

---

### Task L4: Sanctum Token Expiry Configuration
**Time:** 0.5h | **Priority:** LOW | **Status:** NOT STARTED

**Description:** Verify Sanctum token expiry settings. Currently `expiration` is `null` (no expiry).

**File:** `apps/backend/config/sanctum.php`

**Steps:**
1. Review `sanctum.php` line 53: `'expiration' => null`
2. Decide on appropriate expiry (e.g., 30 days for admin, 7 days for citizens)
3. Update if needed
4. Test token refresh flow in admin portal

**Acceptance Criteria:**
- [ ] Token expiry configured appropriately
- [ ] Admin portal `auth-init.ts` refresh flow works
- [ ] Expired tokens return 401 (not 500)

**References:** `config/sanctum.php`, `apps/admin-portal/src/lib/auth-init.ts`

---

## Sprint Metrics

| Metric | Target |
|--------|--------|
| Critical tasks completed | 3/3 |
| High tasks completed | 6/6 |
| Medium tasks completed | 5/5 |
| Low tasks completed | 4/4 |
| Admin endpoints tested | 100% |
| RBAC coverage | 100% |
| Bulk operations verified | 6/6 |

---

## Definition of Done

- [ ] `ResolveTenant` middleware wired into all admin route groups
- [ ] `TenantController` routes registered and tested
- [ ] #171 admin-side actions verified working
- [ ] All 15+ admin portal routes polished and functional
- [ ] All 6 bulk operations tested end-to-end
- [ ] RBAC tested for `analyst` and `super_admin` on all endpoints
- [ ] Audit logs capture all admin actions
- [ ] Loading states and error boundaries on all pages
- [ ] No 500 errors on any admin endpoint
- [ ] Dashboard queries < 200ms

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Tenant middleware breaks existing routes | HIGH | Test with `default` tenant fallback first |
| AI service returns null confidence scores | MEDIUM | Add null checks in triage queue |
| Bulk operations timeout on large payloads | MEDIUM | Cap at 100 items, add progress indicator |
| RBAC gaps expose admin endpoints | HIGH | Systematic testing with test matrix |
| Audit log table grows too large | LOW | Add index on `created_at`, consider archiving |

---

## Notes

- All admin routes are behind `auth:sanctum` + `role:super_admin` middleware
- Public read endpoints (`GET /admin/ngos`, `GET /admin/laws`) are accessible without auth
- Bulk operations are capped at 100 items per request
- Audit logs are immutable (no update/delete endpoints)
- Admin portal runs on port 3002, backend on port 8000
