# Audit Handoff — Identity / Agency / Assignment (read this BEFORE auditing)

> To the backend engineer: the audit prompt you wrote is good. Please re-run it against the
> **current working tree and the applied Supabase SQL**, not `origin/development`. Several of
> the prompt's "established facts" are already superseded — the table below maps your steps to
> current reality. Two decisions were made by the product owner after your prompt:
>
> 1. **Visibility model = HYBRID (approved).** An officer sees tickets **assigned to them OR
>    assigned to anyone in their same agency**. Super admin / admin see everything; citizens see
>    only their own submissions. This is per-officer *responsibility* + agency *data boundary*,
>    enforced in the database (not per-user dataset silos).
> 2. **Assignment-side agency check is the one recognized gap and is approved scope.** See §3.

---

## 0. Current state vs. what the audit prompt assumed

| Audit prompt assumption | Current reality |
|---|---|
| "No agency field exists on User" | `users.agency_name` + `users.service_area` exist (text), set via the admin **Users** create form, written by `/api/v1/admin/users` POST. Applied via `supabase/fix-routing-visibility-v1.sql`. |
| "No person-level assignment" | `ticket_assignments.assignee_user_id` added (uuid FK → users.id), applied in the same SQL. "Assign officer" exists in the Tickets bulk bar (`bulkTicketAssignOfficer`, shared/admin.ts:577) and in the assignment API (`assignee_user_id`). |
| "No per-role scoping exists" | `get_my_tickets(page, status, search)` — SECURITY DEFINER RPC in `supabase/fix-routing-visibility-v1.sql`, executed by admin-portal route `GET /api/v1/tickets` (cookie session → RPC). Visibility rule: `super_admin/admin → all`; `analyst/lgu/lgu_officer → assigned to me OR assigned to my agency`; `citizen → reporter_user_id = me`. |
| "RLS/migrations not in version control" | Policy work IS versioned under `supabase/` (all **applied live**): `fix-admin-rls-v4-column-grants.sql` (v4 locked down), `fix-notifications-v1.sql`, `fix-routing-visibility-v1.sql`. Column grants on users include `SELECT(agency_name, service_area)` for authenticated. |
| "baseline.ts agency slugs = the agency model" | **Confirmed red herring — your catch is right.** `apps/shared/src/types/baseline.ts` lines 434–450 contain `dlhk-dki-jakarta`, `klhk` (Indonesia, ASEAN-hackathon leftovers). Not wired to tickets, users, or assignments. |

## 1. What Lou actually changed (relevant commits + uncommitted work)

- Uncommitted working-tree work (functionally deployed, typechecked):
  - `supabase/fix-routing-visibility-v1.sql` — agency fields, `assignee_user_id`, `get_my_tickets()` RPC.
  - `apps/admin-portal/src/app/api/v1/tickets/route.ts` — scoped officer/citizen ticket list (session → RPC).
  - `apps/admin-portal/src/lib/ticket-notify.ts` — `notifyReporter` (status change → **only** `ticket.reporter_user_id`), `notifyAssignee`, `maybeAutoAssign` (auto-routes to the officer whose `service_area` covers the ticket address when status → investigating), `resolveAgencyGroup` (category-matched `assigned_group_id`, falls back to umbrella group — `ticket_assignments.assigned_group_id` is NOT NULL).
  - `apps/admin-portal/src/app/api/v1/admin/ticket-assignments/route.ts` — person-level + group assignment, per-ticket group resolution, audit entries.
  - Ticket status route (`/api/v1/ai/tickets/[id]/status`) — both AI-service path and direct fallback notify the reporter and auto-assign.
  - Audit wiring (prior round): `apps/admin-portal/src/lib/audit.ts` + calls in ~9 admin routes; `audit_logs` is immutable + hash-chained (verified `verify_audit_chain() → is_valid`).
  - Notification pipeline (prior round): per-user `notification_reads`, `get_my_notifications`/`mark_*` RPCs, admin broadcast composer, bells wired in frontend + mobile header.

## 2. Model vs. intended hierarchy — direct finding

- `role = authority`: **real.** RLS policies exist per role; v4 probes verified anon/citizen escalation attempts are blocked (401/403).
- `agency = data boundary`: **now real, as strings** on `users` + matching in the RPC. Not a normalized `agencies` table — see §7.
- `assignment = operational responsibility`: **real**, `ticket_assignments.assignee_user_id` + status, plus the hybrid visibility rule above.

## 3. Dangerous gaps — status (all closed 2026-09-01, live-verified)

1. **Assignment-side agency check — IMPLEMENTED + VERIFIED.** `POST /api/v1/admin/ticket-assignments` (apps/admin-portal/.../admin/ticket-assignments/route.ts) now resolves the caller from the session cookie, and:
   - Non-super-admin officers (analyst/lgu/lgu_officer) **cannot** assign to agency groups at all → 403 "Officer accounts cannot assign to agency groups".
   - Officers can person-assign **only within their own agency** (`assignee_user_id`'s `users.agency_name` must equal the caller's) → 403 otherwise. Live-proven: Pasig analyst (Pasig City LGU) trying to assign the QC officer → 403.
   - admin/super_admin unaffected. Unresolvable actor → 403.
2. **Raw detail read — CLOSED.** Shared `getTicket(id)` previously did a raw anon `tickets` select (any id, any role). Now it calls `GET /api/v1/tickets/[id]` (new route in all three apps) which checks the `get_my_tickets` RPC visibility set and returns 404 for anything outside it. The raw fallback only triggers when the route is genuinely absent (older deploy), never on a 404. Live-proven: Pasig analyst fetching the QC ticket → 404.
3. **Dashboard leaks — CLOSED.** `getDashboardStats`, `getDashboardFeed`, `getAnalyticsDashboard` in shared/api/admin.ts previously read all tickets via the anon client (global 84 active / 40 open visible to any officer). All three now compute from the session-visible set via the scoped list route (new `fetchVisibleTickets()` helper page-loops the RPC; falls back to the legacy read only when the route is missing). Live-proven: Pasig analyst dashboard → 0 active / 0 open / "No recent activity"; super admin unchanged (84 / 40 / full feed).
4. **Still raw by design (reference only):** `getTicketAssignments` / `getTicketTimeline` in shared are unscoped fetchers but are not consumed by any page in the three apps (verified by grep) — no live surface. If a future UI needs them, they must go through a visibility-checked endpoint.

## 4. Routing vs. assignment

Separate: `tickets.ai_recommended_office` (string, AI output) ≠ `ticket_assignments` (human action). Bridge exists and is intended: `maybeAutoAssign` copies a *recommendation* into an *assignment* when a case enters Investigating and nothing is assigned yet. Documented in `apps/admin-portal/src/lib/ticket-notify.ts`.

## 5. Citizen notifications

Scoped to `ticket.reporter_user_id` — verified live: status changes produced notifications for the citizen only (user_id = citizen), role/broadcast leak checked negatively. `fix-notifications-v1.sql` supplies `user_id` targeting + per-user read state; `TicketAssigned` goes to the assignee's user row only.

## 6. Demo data reality

- Agencies set on only **one** account in seed data (Juan Dela Cruz — "Quezon City LGU" / "Quezon City"); other analysts have NULL agency.
- Only Juan Dela Cruz ("Quezon City LGU" / "Quezon City") has agency fields set in seed data; the throwaway test analysts used for cross-agency and NULL-agency verification were deleted after testing (accounts are provisioned per-id as needed).
- Implication (matches your point): with seed data alone, cross-agency leakage isn't visible; the demo *story* requires the analyst accounts to have agency/service areas set at creation (the Users form supports this).

## 6b. NULL-agency edge test — PASSED (checklist item 4)

Live-tested with a throwaway analyst (auth + `users` row, `agency_name`/`service_area` NULL, auth metadata `role=analyst`):
- `get_my_tickets()` with **no assignment** → `total: 0` (no global queue leak)
- After inserting one direct `ticket_assignments` row (assignee = that analyst) → `total: 1`, exactly the assigned ticket — no scope widening

Safe by construction: the agency condition in the RPC is `u.agency_name IS NOT NULL AND u.agency_name = v_agency AND v_agency IS NOT NULL`, so a NULL-agency officer can only ever see tickets assigned directly to them. Test account + assignment deleted after verification; audit chain re-verified `is_valid: true`.

## 7. Recommendation for Sep 3 (SHIPPED)

- **Shipped:** the assignment-side agency check, scoped ticket detail (`GET /api/v1/tickets/[id]` in all three apps), and scoped dashboard stats/feed/analytics. All live-verified with real sessions (403/404 negative paths + super-admin positive path). Typechecks green across all packages.
- **Defer honestly:** a normalized `agencies` table with name/type/municipality/province/coverage. Yes, it's *achievable* in the remaining time, but it expands the surface (CRUD UI, FK rewiring, juggling audit/notifications) against judge-day risk for zero demo-visible gain over the current agency-strings model. State to Jeff: "agency identity + jurisdiction matching work today via string fields + service-area matching; the full table is architecture-ready, not built."
- **Model:** hybrid visibility (officer assignment + same-agency sharing) — owner approved; do not regress to full-global or strict per-officer-only.

## Files that matter most

- `supabase/fix-routing-visibility-v1.sql` (applied) — schema + RPC
- `apps/admin-portal/src/app/api/v1/tickets/route.ts` — scoped listing
- `apps/admin-portal/src/app/api/v1/admin/ticket-assignments/route.ts` — assignment API (gap lives here)
- `apps/admin-portal/src/lib/ticket-notify.ts` — notify/auto-assign/group resolution
- `apps/shared/src/api/admin.ts` — `getTickets` (scoped) / `getTicket` (scoped) / `getDashboardStats|Feed|AnalyticsDashboard` (scoped) / `bulkTicketAssign` / `bulkTicketAssignOfficer`
- `apps/{admin-portal,frontend,mobile-pwa}/src/app/api/v1/tickets/[id]/route.ts` — scoped detail (new)
- `apps/admin-portal/src/proxy.ts` — NOTE: middleware admits analyst/lgu/admin/super_admin roles to ALL routes incl. /api/v1/admin/*; the route-level agency checks above are therefore the real control layer, not middleware
- `apps/shared/src/types/baseline.ts:434-450` — confirmed non-Philippine reference-data leftover (red herring)