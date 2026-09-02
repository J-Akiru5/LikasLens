/**
 * Location-based routing for freshly submitted reports.
 *
 * A citizen's report should land on the analyst / LGU account whose
 * service_area covers the report location — not on an empty "DENR" label.
 *
 * Matching strategy (best first):
 *   1. COORDINATES — when the report has lat/lng AND the officer account has
 *      a service-area centroid (service_area_lat/lng, set from the admin
 *      account map picker), match by haversine distance (≤ 20 km, roughly a
 *      municipality).
 *   2. TEXT — fall back to matching the report address against the officer's
 *      service_area string (e.g. "Dingle").
 *
 * On match this helper auto-assigns the ticket to that officer, records the
 * real desk on the ticket (ai_recommended_office), writes a timeline entry,
 * and notifies the officer. Falls back to "unassigned" when no account
 * covers the area, so the report simply waits in the general analyst pool.
 *
 * `findCoveringOffice` is the read-only matcher (used by the citizen submit
 * wizard to show which office the report WILL be routed to before submitting).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface RoutingResult {
  assigned: boolean;
  officeName: string | null;
  officeId: string | null;
}

export interface OfficeMatch {
  officerId: string;
  officeName: string;
  serviceArea: string;
  role: string;
  matchedBy: "coords" | "text";
  distKm?: number;
}

const OFFICER_ROLES = ["analyst", "lgu", "lgu_officer"];
const ROLE_PRIORITY: Record<string, number> = { lgu_officer: 0, lgu: 1, analyst: 2 };
const COORD_MATCH_KM = 20;

/** Great-circle distance in kilometres between two coordinates. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function officeNameFor(o: {
  name?: string | null;
  agency_name?: string | null;
  service_area?: string | null;
}): string {
  return String(
    o.agency_name || `${o.name || "Officer"} (${o.service_area})`
  );
}

/**
 * Read-only: find the officer (analyst / LGU desk) whose service area covers
 * the given report location. Prefers coordinate distance; falls back to
 * address-text matching. Returns null when no account covers the area.
 */
export async function findCoveringOffice(
  db: SupabaseClient<any>,
  address: string | null | undefined,
  latitude?: number | null,
  longitude?: number | null
): Promise<OfficeMatch | null> {
  const addr = String(address || "").toLowerCase().trim();
  if (!addr && (latitude == null || longitude == null)) return null;

  const { data: officers, error } = await db
    .from("users")
    .select("id, name, role, agency_name, service_area, service_area_lat, service_area_lng")
    .in("role", OFFICER_ROLES)
    .not("service_area", "is", null)
    .is("deleted_at", null)
    .limit(200);

  if (error || !officers) return null;

  // 1) Coordinate match — the reliable path when both sides have coordinates.
  if (latitude != null && longitude != null) {
    const coordMatches: Array<OfficeMatch & { distKm: number }> = [];
    for (const o of officers) {
      const olat = Number(o.service_area_lat);
      const olng = Number(o.service_area_lng);
      if (Number.isFinite(olat) && Number.isFinite(olng)) {
        const d = haversineKm(latitude, longitude, olat, olng);
        if (d <= COORD_MATCH_KM) {
          coordMatches.push({
            officerId: o.id,
            officeName: officeNameFor(o),
            serviceArea: String(o.service_area || ""),
            role: String(o.role || ""),
            matchedBy: "coords",
            distKm: d,
          });
        }
      }
    }
    if (coordMatches.length > 0) {
      coordMatches.sort(
        (a, b) =>
          a.distKm - b.distKm ||
          (ROLE_PRIORITY[a.role] ?? 3) - (ROLE_PRIORITY[b.role] ?? 3)
      );
      return coordMatches[0];
    }
  }

  // 2) Text match against the address.
  if (!addr) return null;
  const textMatches = (officers as Array<Record<string, unknown>>)
    .filter((o) => addr.includes(String(o.service_area || "").toLowerCase()))
    .map((o) => ({
      officerId: String(o.id),
      officeName: officeNameFor(o as never),
      serviceArea: String(o.service_area || ""),
      role: String((o as Record<string, unknown>).role || ""),
      matchedBy: "text" as const,
    }));

  if (textMatches.length === 0) return null;
  textMatches.sort(
    (a, b) =>
      (ROLE_PRIORITY[a.role] ?? 3) - (ROLE_PRIORITY[b.role] ?? 3)
  );
  return textMatches[0];
}

/**
 * Resolve the agency group ("desk") for a ticket assignment —
 * ticket_assignments.assigned_group_id is NOT NULL and references
 * ngo_groups(id). Matches the ticket's AI category against group names,
 * falling back to a national umbrella group.
 */
export async function resolveAgencyGroup(
  db: SupabaseClient<any>,
  category: string
): Promise<string | null> {
  const tokens = String(category || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 2);
  const { data: groups } = await db.from("ngo_groups").select("id, name");
  let best: string | null = null;
  let bestScore = 0;
  for (const g of groups || []) {
    const name = String(g.name || "").toLowerCase();
    let score = 0;
    for (const t of tokens) if (name.includes(t)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = g.id;
    }
  }
  if (best) return best;
  return (
    (groups || []).find((g) =>
      String(g.name || "").toLowerCase().includes("green earth")
    )?.id ?? null
  );
}

export async function routeTicketToCoveringOffice(
  db: SupabaseClient<any>,
  ticketId: string,
  address: string | null | undefined,
  category: string | null | undefined,
  latitude?: number | null,
  longitude?: number | null
): Promise<RoutingResult> {
  const match = await findCoveringOffice(db, address, latitude, longitude);
  if (!match) return { assigned: false, officeName: null, officeId: null };

  const officerId = match.officerId;
  const officeName = match.officeName;

  try {
    // assigned_group_id is NOT NULL and FK-references ngo_groups(id) — resolve
    // the desk for this category (not the officer id, which lives in users).
    const assignedGroupId = await resolveAgencyGroup(db, String(category || ""));
    if (!assignedGroupId) {
      console.error("[route-to-office] routing skipped: no matching agency group");
      return { assigned: false, officeName: null, officeId: null };
    }

    // assigned_by_user_id is NOT NULL — use a super admin as the system actor
    // (the auto-router has no human), falling back to the desk officer.
    let systemActorId: string = officerId;
    const { data: admins } = await db
      .from("users")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);
    if (admins && admins.length > 0 && admins[0]?.id) {
      systemActorId = String(admins[0].id);
    }

    const { error: assignErr } = await db.from("ticket_assignments").insert({
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      assigned_group_id: assignedGroupId,
      assignee_user_id: officerId,
      assigned_by_user_id: systemActorId,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    if (assignErr) {
      console.error("[route-to-office] assignment insert failed:", assignErr.message);
      return { assigned: false, officeName: null, officeId: null };
    }

    // Record the real desk on the ticket so admin/public views show the
    // covering office instead of a generic AI label.
    const { error: updateErr } = await db
      .from("tickets")
      .update({ ai_recommended_office: officeName })
      .eq("id", ticketId);
    if (updateErr) {
      console.error("[route-to-office] office update failed:", updateErr.message);
    }

    // Audit trail entry
    const { error: timelineErr } = await db.from("ticket_timeline").insert({
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      actor_id: null,
      actor_type: "system",
      from_status: null,
      to_status: "open",
      note: `Auto-routed to ${officeName}`,
      created_at: new Date().toISOString(),
    });
    if (timelineErr) {
      console.error("[route-to-office] timeline insert failed:", timelineErr.message);
    }

    // Notify the covering officer
    const { error: notifErr } = await db.from("notifications").insert({
      id: crypto.randomUUID(),
      type: "TicketAssigned",
      data: {
        title: "New ticket routed to you",
        message: `A new report (${String(category || "environmental incident").replace(/_/g, " ")}) was routed to ${officeName}.`,
        ticket_id: ticketId,
      },
      user_id: officerId,
      for_role: null,
      notifiable_type: "App\\Models\\User",
      notifiable_id: officerId,
      created_at: new Date().toISOString(),
    });
    if (notifErr) {
      console.error("[route-to-office] notification insert failed:", notifErr.message);
    }

    return { assigned: true, officeName, officeId: officerId };
  } catch (err) {
    console.error("[route-to-office] routing failed (non-fatal):", err);
    return { assigned: false, officeName: null, officeId: null };
  }
}
