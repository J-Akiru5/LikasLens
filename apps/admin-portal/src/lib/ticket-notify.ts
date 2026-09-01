import type { SupabaseClient } from "@supabase/supabase-js";
import { findCoveringOffice } from "@likaslens/shared";

/**
 * Helpers used by the ticket status route:
 *  - notifyReporter(): push a notification to the CITIZEN who submitted the
 *    ticket (user-only, via notifications.user_id) whenever an admin changes
 *    the status — "Your report is now Investigating".
 *  - maybeAutoAssign(): when a ticket moves to "investigating" and has no
 *    assignment yet, route it to the officer whose agency/service_area covers
 *    the ticket's location, and notify that officer.
 */

export async function notifyReporter(
  db: SupabaseClient,
  ticketId: string,
  fromStatus: string | null,
  toStatus: string
): Promise<void> {
  try {
    const { data: ticket } = await db
      .from("tickets")
      .select("id, title, reporter_user_id")
      .eq("id", ticketId)
      .maybeSingle();

    if (!ticket?.reporter_user_id) return;

    const title = String(ticket.title || "Environmental report");
    const toLabel = toStatus.replace(/_/g, " ");

    await db.from("notifications").insert({
      id: crypto.randomUUID(),
      type: "TicketStatus",
      data: {
        title: "Your report status changed",
        message: `Your report "${title}" is now ${toLabel}.`,
        ticket_id: ticketId,
        from_status: fromStatus,
        to_status: toStatus,
      },
      user_id: ticket.reporter_user_id,
      for_role: null,
      notifiable_type: "App\\Models\\User",
      notifiable_id: ticket.reporter_user_id,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ticket-notify] notifyReporter failed (non-fatal):", err);
  }
}

export async function notifyAssignee(
  db: SupabaseClient,
  ticketId: string,
  assigneeUserId: string | null
): Promise<void> {
  if (!assigneeUserId) return;
  try {
    const { data: ticket } = await db
      .from("tickets")
      .select("id, title")
      .eq("id", ticketId)
      .maybeSingle();

    await db.from("notifications").insert({
      id: crypto.randomUUID(),
      type: "TicketAssigned",
      data: {
        title: "New ticket routed to you",
        message: `"${String(ticket?.title || "Environmental report")}" was routed to your desk.`,
        ticket_id: ticketId,
      },
      user_id: assigneeUserId,
      for_role: null,
      notifiable_type: "App\\Models\\User",
      notifiable_id: assigneeUserId,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ticket-notify] notifyAssignee failed (non-fatal):", err);
  }
}

/**
 * Resolve the agency group ("desk") for a ticket assignment - ticket_assignments
 * requires a NOT NULL assigned_group_id. Matches the ticket's AI category
 * against group names, falling back to a national umbrella group.
 */
export async function resolveAgencyGroup(
  db: SupabaseClient,
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

export async function maybeAutoAssign(
  db: SupabaseClient,
  ticketId: string,
  assignedByUserId?: string | null
): Promise<{ assigned: boolean; officerId: string | null }> {
  try {
    // Already assigned — leave it alone
    const { data: existing } = await db
      .from("ticket_assignments")
      .select("id")
      .eq("ticket_id", ticketId)
      .limit(1);
    if (existing && existing.length > 0) {
      return { assigned: false, officerId: null };
    }

    const { data: ticket } = await db
      .from("tickets")
      .select("id, title, address_text, ai_triage_summary, latitude, longitude")
      .eq("id", ticketId)
      .maybeSingle();

    const address = String(ticket?.address_text || "");
    if (!address && ticket?.latitude == null) {
      return { assigned: false, officerId: null };
    }

    // Officers with a service area set — prefer coordinate (centroid) matches
    // over address-text matches; prefer LGU desk roles over analysts.
    const match = await findCoveringOffice(
      db,
      address,
      ticket?.latitude != null ? Number(ticket.latitude) : null,
      ticket?.longitude != null ? Number(ticket.longitude) : null
    );
    if (!match) return { assigned: false, officerId: null };

    // Resolve the agency group ("desk") for the assignment — required NOT NULL
    // column. Match by the ticket's AI category (ai_triage_summary).
    const assignedGroupId = await resolveAgencyGroup(
      db,
      String(ticket?.ai_triage_summary || "")
    );
    if (!assignedGroupId) {
      console.error("[ticket-notify] auto-assign skipped: no matching agency group");
      return { assigned: false, officerId: null };
    }

    const { error } = await db.from("ticket_assignments").insert({
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      assigned_group_id: assignedGroupId,
      assignee_user_id: match.officerId,
      assigned_by_user_id: assignedByUserId ?? null,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[ticket-notify] auto-assign failed:", error.message);
      return { assigned: false, officerId: null };
    }

    await notifyAssignee(db, ticketId, match.officerId);
    return { assigned: true, officerId: match.officerId };
  } catch (err) {
    console.error("[ticket-notify] maybeAutoAssign failed (non-fatal):", err);
    return { assigned: false, officerId: null };
  }
}