import { describe, expect, it } from "vitest";

import {
  CREATED_AT_CLOCK_SKEW_MS,
  FRESH_TICKET_WINDOW_MS,
  ROUTING_STAFF_ROLES,
  decideTicketRoutingAccess,
  isRoutingStaffRole,
  type RoutableTicket,
} from "../routing-authz";

const CALLER = "11111111-1111-1111-1111-111111111111";
const VICTIM = "22222222-2222-2222-2222-222222222222";
const NOW = Date.parse("2026-10-20T12:00:00.000Z");

function ticket(overrides: Partial<RoutableTicket> = {}): RoutableTicket {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    reporter_user_id: null,
    status: "open",
    created_at: new Date(NOW - 60_000).toISOString(),
    ...overrides,
  };
}

function decide(role: string | null | undefined, t: RoutableTicket = ticket()) {
  return decideTicketRoutingAccess({ role, callerId: CALLER, ticket: t, now: NOW });
}

describe("isRoutingStaffRole", () => {
  it.each(ROUTING_STAFF_ROLES)("accepts %s", (role) => {
    expect(isRoutingStaffRole(role)).toBe(true);
  });

  it.each(["citizen", "ghost", "partner", "", null, undefined])("rejects %s", (role) => {
    expect(isRoutingStaffRole(role as string | null | undefined)).toBe(false);
  });
});

describe("staff", () => {
  it.each(ROUTING_STAFF_ROLES)("may route someone else's ticket as %s", (role) => {
    const decision = decide(role, ticket({ reporter_user_id: VICTIM }));
    expect(decision).toEqual({ allowed: true, via: "staff" });
  });

  it("staff access does not depend on the ticket being fresh or open", () => {
    const stale = ticket({
      reporter_user_id: VICTIM,
      status: "resolved",
      created_at: new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(decide("admin", stale)).toEqual({ allowed: true, via: "staff" });
  });
});

describe("owner", () => {
  it("may route their own ticket", () => {
    expect(decide("citizen", ticket({ reporter_user_id: CALLER }))).toEqual({
      allowed: true,
      via: "owner",
    });
  });

  it("may route their own ticket even when it is old and closed", () => {
    const old = ticket({
      reporter_user_id: CALLER,
      status: "resolved",
      created_at: new Date(NOW - 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(decide("citizen", old)).toEqual({ allowed: true, via: "owner" });
  });

  it("cannot route another person's ticket", () => {
    expect(decide("citizen", ticket({ reporter_user_id: VICTIM }))).toEqual({
      allowed: false,
      reason: "not-permitted",
    });
  });
});

describe("fresh anonymous (Ghost Mode)", () => {
  it("allows a just-created anonymous open ticket", () => {
    expect(decide(undefined, ticket())).toEqual({ allowed: true, via: "fresh-anonymous" });
  });

  it("allows a ticket with no role claim at all", () => {
    expect(decide(null, ticket())).toEqual({ allowed: true, via: "fresh-anonymous" });
  });

  it("rejects once the window has passed", () => {
    const stale = ticket({
      created_at: new Date(NOW - FRESH_TICKET_WINDOW_MS - 1).toISOString(),
    });
    expect(decide(undefined, stale)).toEqual({ allowed: false, reason: "not-permitted" });
  });

  it("allows exactly at the edge of the window", () => {
    const edge = ticket({
      created_at: new Date(NOW - FRESH_TICKET_WINDOW_MS + 1).toISOString(),
    });
    expect(decide(undefined, edge)).toEqual({ allowed: true, via: "fresh-anonymous" });
  });

  it.each(["assigned", "resolved", "closed", "rejected", null])(
    "rejects when the ticket is not open (%s)",
    (status) => {
      expect(decide(undefined, ticket({ status }))).toEqual({
        allowed: false,
        reason: "not-permitted",
      });
    },
  );

  it("rejects a missing or unparseable created_at", () => {
    expect(decide(undefined, ticket({ created_at: null }))).toEqual({
      allowed: false,
      reason: "not-permitted",
    });
    expect(decide(undefined, ticket({ created_at: "not-a-date" }))).toEqual({
      allowed: false,
      reason: "not-permitted",
    });
  });

  it("rejects a created_at far in the future instead of treating it as fresh", () => {
    const future = ticket({
      created_at: new Date(NOW + CREATED_AT_CLOCK_SKEW_MS + 60_000).toISOString(),
    });
    expect(decide(undefined, future)).toEqual({ allowed: false, reason: "not-permitted" });
  });

  it("tolerates a created_at slightly in the future (clock skew)", () => {
    const skewed = ticket({
      created_at: new Date(NOW + CREATED_AT_CLOCK_SKEW_MS - 1).toISOString(),
    });
    expect(decide(undefined, skewed)).toEqual({ allowed: true, via: "fresh-anonymous" });
  });
});

describe("regression: the IDOR this module was written to close", () => {
  it("does not let a stranger route a named victim's fresh open ticket", () => {
    // The old check was `status === "open" && age < window`, with no condition
    // on reporter_user_id, so this exact input was allowed.
    const freshVictimTicket = ticket({
      reporter_user_id: VICTIM,
      status: "open",
      created_at: new Date(NOW - 1_000).toISOString(),
    });

    expect(decide("citizen", freshVictimTicket)).toEqual({
      allowed: false,
      reason: "not-permitted",
    });
  });

  it("does not treat a named ticket as anonymous", () => {
    const named = ticket({ reporter_user_id: VICTIM });
    const decision = decide(undefined, named);
    expect(decision.allowed).toBe(false);
  });
});
