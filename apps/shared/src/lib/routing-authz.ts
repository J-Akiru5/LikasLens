/**
 * Who may route a report to an office.
 *
 * This is the single source of truth for that decision. It used to be written
 * out by hand in two places — `apps/mobile-pwa` and `apps/frontend` — which is a
 * divergence risk on a security boundary: fixing one copy and forgetting the
 * other is exactly how the identity-spoofing bug survived in the frontend after
 * the mobile route was fixed.
 *
 * The function is pure so it can be tested without a database, a session or a
 * running server.
 *
 * The three ways to be allowed:
 *
 *   staff            an analyst / admin / super_admin / LGU officer may route any
 *                    ticket. The role must come from `app_metadata`, never
 *                    `user_metadata` — Supabase lets a signed-in user write the
 *                    latter themselves.
 *
 *   owner            the caller reported the ticket.
 *
 *   fresh-anonymous  Ghost Mode: the ticket has no reporter, so ownership cannot
 *                    be proven, and the client that just created it is the only
 *                    party holding the id. Allowed briefly, and only while the
 *                    ticket is still open and untouched.
 *
 * The `fresh-anonymous` window deliberately requires `reporter_user_id IS NULL`.
 * An earlier version allowed *any* fresh open ticket, which let a signed-in
 * stranger route a named victim's report and choose the receiving office.
 */

/** Roles that may route any ticket. Mirrors the admin portal's gate. */
export const ROUTING_STAFF_ROLES = [
  "analyst",
  "admin",
  "super_admin",
  "lgu",
  "lgu_officer",
] as const;

export type RoutingStaffRole = (typeof ROUTING_STAFF_ROLES)[number];

/** How long a just-created anonymous ticket stays routable without ownership. */
export const FRESH_TICKET_WINDOW_MS = 10 * 60 * 1000;

/**
 * Tolerated clock skew for a `created_at` that is slightly in the future.
 *
 * A timestamp further ahead than this is treated as invalid rather than as
 * "infinitely fresh". Without this, a client that writes its own `created_at`
 * could keep an anonymous ticket inside the window forever.
 */
export const CREATED_AT_CLOCK_SKEW_MS = 60 * 1000;

export interface RoutableTicket {
  id: string;
  reporter_user_id: string | null;
  status: string | null;
  created_at: string | null;
}

export type RoutingVia = "staff" | "owner" | "fresh-anonymous";

export type RoutingDecision =
  | { allowed: true; via: RoutingVia }
  | { allowed: false; reason: "not-permitted" };

export interface RoutingAccessInput {
  /** Role from the caller's `app_metadata`. Never from `user_metadata`. */
  role: string | null | undefined;
  /** The authenticated caller's Supabase auth user id. */
  callerId: string;
  ticket: RoutableTicket;
  /** Injectable for tests; defaults to `Date.now()`. */
  now?: number;
}

export function isRoutingStaffRole(role: string | null | undefined): boolean {
  return typeof role === "string" && (ROUTING_STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * Decide whether `callerId` may route `ticket`.
 *
 * Pure: no I/O, no clock reads outside the injectable `now`, no throw.
 */
export function decideTicketRoutingAccess(input: RoutingAccessInput): RoutingDecision {
  const { role, callerId, ticket } = input;
  const now = input.now ?? Date.now();

  if (isRoutingStaffRole(role)) {
    return { allowed: true, via: "staff" };
  }

  if (ticket.reporter_user_id != null && ticket.reporter_user_id === callerId) {
    return { allowed: true, via: "owner" };
  }

  const isAnonymous = ticket.reporter_user_id == null;
  const isOpen = ticket.status === "open";

  if (isAnonymous && isOpen && isWithinFreshWindow(ticket.created_at, now)) {
    return { allowed: true, via: "fresh-anonymous" };
  }

  return { allowed: false, reason: "not-permitted" };
}

function isWithinFreshWindow(createdAt: string | null, now: number): boolean {
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;

  const age = now - created;

  // Reject a timestamp meaningfully in the future rather than treating it as
  // maximally fresh.
  if (age < -CREATED_AT_CLOCK_SKEW_MS) return false;

  return age < FRESH_TICKET_WINDOW_MS;
}
