/**
 * POST /api/v1/admin/ticket-assignments
 *
 * Bulk-assign tickets to an agency group and/or a SPECIFIC officer using the
 * service role key to bypass RLS. The browser shared client is sessionless
 * (anon), so role-gated RLS policies would otherwise reject inserts.
 *
 * Body: { ticket_ids: string[], lgu_id?: string, assignee_user_id?: string }
 * (at least one of lgu_id / assignee_user_id required)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import { logAuditEvent } from "@/lib/audit";
import { notifyAssignee, resolveAgencyGroup } from "@/lib/ticket-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const ticketIds: string[] = Array.isArray(body.ticket_ids) ? body.ticket_ids : [];
    const lguId: string | undefined = body.lgu_id;
    const assigneeUserId: string | undefined = body.assignee_user_id;

    if (ticketIds.length === 0 || (!lguId && !assigneeUserId)) {
      return NextResponse.json(
        { error: "ticket_ids plus lgu_id or assignee_user_id are required" },
        { status: 400 }
      );
    }

    const db = getSupabase();

    // Resolve the acting admin from the session cookie. FK targets users.id,
    // not the auth user id — look it up by email.
    const sessionClient = await createClient();
    const {
      data: { session },
    } = await sessionClient.auth.getSession();
    let actorId: string | null = null;
    let actorRole: string | null = null;
    let actorAgency: string | null = null;
    if (session?.user?.email) {
      const { data: actorRow } = await db
        .from("users")
        .select("id, role, agency_name")
        .eq("email", session.user.email)
        .maybeSingle();
      actorId = actorRow?.id ?? null;
      actorRole = actorRow?.role ?? null;
      actorAgency = actorRow?.agency_name ?? null;
    }

    if (!actorId) {
      return NextResponse.json(
        { error: "Could not resolve your account — sign in and try again." },
        { status: 403 }
      );
    }

    // Agency boundary: officers may only assign tickets to officers within
    // their OWN agency, and cannot perform group (agency-wide) assignment.
    // admin/super_admin roles are exempt (platform-level authority).
    const isOfficer = ["analyst", "lgu", "lgu_officer"].includes(actorRole || "");
    if (isOfficer) {
      if (lguId) {
        return NextResponse.json(
          {
            error:
              "Officer accounts cannot assign to agency groups — request an admin to do group assignments.",
          },
          { status: 403 }
        );
      }
      if (assigneeUserId) {
        const { data: officer } = await db
          .from("users")
          .select("id, role, agency_name")
          .eq("id", assigneeUserId)
          .maybeSingle();
        if (
          !officer ||
          !["analyst", "lgu", "lgu_officer"].includes(officer.role) ||
          !officer.agency_name ||
          officer.agency_name !== actorAgency
        ) {
          return NextResponse.json(
            {
              error:
                "You can only assign tickets to officers within your own agency (" +
                (actorAgency || "no agency set on your account") +
                ").",
            },
            { status: 403 }
          );
        }
      }
    }

    // Validate officer target when person-level assignment is used
    if (assigneeUserId) {
      const { data: officer } = await db
        .from("users")
        .select("id, role")
        .eq("id", assigneeUserId)
        .maybeSingle();
      if (!officer || !["analyst", "lgu", "lgu_officer"].includes(officer.role)) {
        return NextResponse.json(
          { error: "assignee_user_id must be an analyst, LGU staff, or LGU officer account" },
          { status: 400 }
        );
      }
    }

    // assigned_group_id is NOT NULL in the table: resolve a matching agency
    // group from each ticket's AI category when the caller didn't pass lgu_id.
    const assignments = [];
    for (const ticket_id of ticketIds) {
      let assignedGroupId = lguId ?? null;
      if (!assignedGroupId) {
        const { data: ticket } = await db
          .from("tickets")
          .select("ai_triage_summary")
          .eq("id", ticket_id)
          .maybeSingle();
        assignedGroupId = await resolveAgencyGroup(
          db,
          String(ticket?.ai_triage_summary || "")
        );
      }
      if (!assignedGroupId) {
        return NextResponse.json(
          { error: `No matching agency group found for ticket ${ticket_id} — pass lgu_id` },
          { status: 400 }
        );
      }
      assignments.push({
        ticket_id,
        assigned_group_id: assignedGroupId,
        assignee_user_id: assigneeUserId ?? null,
        assigned_by_user_id: actorId,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    }

    const { data, error } = await db
      .from("ticket_assignments")
      .insert(assignments)
      .select();

    if (error) {
      console.error("[/api/v1/admin/ticket-assignments] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const ticketId of ticketIds) {
      await logAuditEvent(request, {
        action: "ticket.assigned",
        entity_type: "ticket",
        entity_id: ticketId,
        new_data: {
          assigned_group_id: lguId ?? null,
          assignee_user_id: assigneeUserId ?? null,
          status: "pending",
        } as Record<string, unknown>,
      });
      await notifyAssignee(db, ticketId, assigneeUserId ?? null);
    }

    return NextResponse.json({
      success: true,
      data: { created: data?.length ?? ticketIds.length, skipped: 0 },
      message: `${ticketIds.length} ticket${ticketIds.length !== 1 ? "s" : ""} assigned`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
