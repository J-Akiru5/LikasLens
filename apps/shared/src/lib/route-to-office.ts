/**
 * Location-based routing for freshly submitted reports.
 *
 * A citizen's report should land on the analyst / LGU account whose
 * service_area covers the report address — not on an empty "DENR" label.
 * This helper matches the address against staff accounts, auto-assigns the
 * ticket, records the real desk on the ticket (ai_recommended_office), and
 * notifies the officer. Falls back to "unassigned" when no account covers
 * the area yet, so the report simply waits in the general analyst pool.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface RoutingResult {
  assigned: boolean;
  officeName: string | null;
  officeId: string | null;
}

const OFFICER_ROLES = ["analyst", "lgu", "lgu_officer"];
const ROLE_PRIORITY: Record<string, number> = { lgu_officer: 0, lgu: 1, analyst: 2 };

export async function routeTicketToCoveringOffice(
  db: SupabaseClient<any>,
  ticketId: string,
  address: string | null | undefined,
  category: string | null | undefined
): Promise<RoutingResult> {
  const addr = String(address || "").toLowerCase().trim();
  if (!addr) return { assigned: false, officeName: null, officeId: null };

  try {
    const { data: officers, error } = await db
      .from("users")
      .select("id, name, role, agency_name, service_area")
      .in("role", OFFICER_ROLES)
      .not("service_area", "is", null)
      .is("deleted_at", null)
      .limit(200);

    if (error) {
      console.error("[route-to-office] officer query failed:", error.message);
      return { assigned: false, officeName: null, officeId: null };
    }

    const matches = (officers || []).filter((o) =>
      addr.includes(String(o.service_area || "").toLowerCase())
    );
    if (matches.length === 0) {
      return { assigned: false, officeName: null, officeId: null };
    }

    matches.sort(
      (a, b) =>
        (ROLE_PRIORITY[a.role] ?? 3) - (ROLE_PRIORITY[b.role] ?? 3)
    );
    const officer = matches[0];

    const officeName = String(
      officer.agency_name ||
        `${officer.name || "Officer"} (${officer.service_area})`
    );

    // assigned_group_id is NOT NULL — the officer's own id serves as the desk.
    await db
      .from("ticket_assignments")
      .insert({
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        assigned_group_id: officer.id,
        assignee_user_id: officer.id,
        assigned_by_user_id: null,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .then(({ error: e }) => {
        if (e) console.error("[route-to-office] assignment insert failed:", e.message);
      });

    // Record the real desk on the ticket so admin/public views show the
    // covering office instead of a generic AI label.
    await db
      .from("tickets")
      .update({ ai_recommended_office: officeName })
      .eq("id", ticketId)
      .then(({ error: e }) => {
        if (e) console.error("[route-to-office] office update failed:", e.message);
      });

    // Audit trail entry
    await db
      .from("ticket_timeline")
      .insert({
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        actor_id: null,
        actor_type: "system",
        from_status: null,
        to_status: "open",
        note: `Auto-routed to ${officeName}`,
        created_at: new Date().toISOString(),
      })
      .then(({ error: e }) => {
        if (e) console.error("[route-to-office] timeline insert failed:", e.message);
      });

    // Notify the covering officer
    await db
      .from("notifications")
      .insert({
        id: crypto.randomUUID(),
        type: "TicketAssigned",
        data: {
          title: "New ticket routed to you",
          message: `A new report (${String(category || "environmental incident").replace(/_/g, " ")}) was routed to ${officeName}.`,
          ticket_id: ticketId,
        },
        user_id: officer.id,
        for_role: null,
        notifiable_type: "App\Models\User",
        notifiable_id: officer.id,
        created_at: new Date().toISOString(),
      })
      .then(({ error: e }) => {
        if (e) console.error("[route-to-office] notification insert failed:", e.message);
      });

    return { assigned: true, officeName, officeId: officer.id };
  } catch (err) {
    console.error("[route-to-office] routing failed (non-fatal):", err);
    return { assigned: false, officeName: null, officeId: null };
  }
}
