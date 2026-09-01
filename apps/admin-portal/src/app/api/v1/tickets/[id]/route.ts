import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}

function getServiceKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

/** Public storage URL for an evidence object. */
function evidenceUrl(storagePath: string): string {
  return `${getBaseUrl()}/storage/v1/object/public/evidence/${storagePath}`;
}

/**
 * GET /api/v1/tickets/[id]
 *
 * Scoped ticket detail backed by the get_my_tickets RPC — the SAME visibility
 * rule as the list route. Super admin/admin see all; officers see only tickets
 * assigned to them or their agency; citizens only their own submissions.
 * Returns 404 when the ticket is not visible to the session user, so detail
 * reads cannot bypass the per-role scoping (previously a raw anon select).
 *
 * On top of the RPC row we attach the ticket's evidence (citizen "before"
 * photos + officer "resolution/after" photos, as public URLs) and its
 * assignments (person / NGO names) so the reviewer can see before/after
 * proof and who holds the ticket.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Walk the RPC pages (50/page) until the requested ticket is found. Cap at
    // 20 pages (1000 tickets) to bound work; anything beyond that is a miss.
    let hit: Record<string, unknown> | null = null;
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabase.rpc("get_my_tickets", {
        p_page: page,
        p_status: null,
        p_search: null,
      });
      if (error) {
        console.error("[/api/v1/tickets/[id]] rpc error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const result = (data ?? {}) as {
        tickets?: Array<Record<string, unknown>> | null;
        total?: number;
      };
      const tickets = result.tickets || [];
      hit = tickets.find((t) => t.id === id) ?? null;
      if (hit) break;
      const total = Number(result.total ?? 0);
      if (page * 50 >= total) break;
    }

    if (!hit) {
      return NextResponse.json(
        { error: "Ticket not found or not visible to your account" },
        { status: 404 }
      );
    }

    // ── Enrich with evidence + assignments (service role; RLS bypassed) ──
    const db = createServiceClient(getBaseUrl(), getServiceKey());

    const { data: evidenceRows } = await db
      .from("ticket_evidence")
      .select("id, uploaded_by_user_id, storage_path, mime_type, file_size_bytes, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    const { data: assignmentRows } = await db
      .from("ticket_assignments")
      .select(
        "id, ticket_id, assigned_group_id, assignee_user_id, assigned_by_user_id, status, assignment_reason, created_at"
      )
      .eq("ticket_id", id)
      .order("created_at", { ascending: false });

    const uploaderIds = [
      ...new Set(
        (evidenceRows || [])
          .map((e) => e.uploaded_by_user_id as string | null)
          .filter(Boolean)
      ),
    ];
    const userIds = [
      ...new Set(
        [
          ...(assignmentRows || []).flatMap((a) => [
            a.assignee_user_id as string | null,
            a.assigned_by_user_id as string | null,
          ]),
          ...uploaderIds,
        ].filter(Boolean)
      ),
    ];

    // Display names: prefer the user's AGENCY name (e.g. "Dingle Municipal
    // Environment Office") over the officer's personal name — the record should
    // read as the desk that handled it, not the individual. Citizens without
    // an agency keep their own name (government-only view).
    const nameById = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: userRows } = await db
        .from("users")
        .select("id, name, agency_name")
        .in("id", userIds);
      for (const u of userRows || []) {
        nameById.set(u.id, String(u.agency_name || u.name));
      }
    }
    const ngoIds = [
      ...new Set(
        (assignmentRows || [])
          .map((a) => a.assigned_group_id as string | null)
          .filter(Boolean)
      ),
    ];
    const ngoById = new Map<string, { id: string; name: string; region: string }>();
    if (ngoIds.length > 0) {
      const { data: ngoRows } = await db
        .from("ngo_groups")
        .select("id, name, region")
        .in("id", ngoIds);
      for (const n of ngoRows || []) {
        ngoById.set(n.id, { id: n.id, name: n.name, region: n.region || "" });
      }
    }

    const evidence = (evidenceRows || []).map((e) => ({
      id: e.id,
      file_path: evidenceUrl(String(e.storage_path || "")),
      file_type: String(e.mime_type || "image/jpeg"),
      uploaded_by: e.uploaded_by_user_id && nameById.has(e.uploaded_by_user_id)
        ? { id: e.uploaded_by_user_id, name: nameById.get(e.uploaded_by_user_id)! }
        : undefined,
    }));

    const assignments = (assignmentRows || []).map((a) => ({
      id: a.id,
      ticket_id: a.ticket_id,
      assigned_group_id: a.assigned_group_id,
      assignee_user_id: a.assignee_user_id ?? null,
      assigned_by_user_id: a.assigned_by_user_id,
      status: a.status,
      assignment_reason: a.assignment_reason ?? undefined,
      created_at: a.created_at,
      ngo_group: ngoById.has(a.assigned_group_id)
        ? ngoById.get(a.assigned_group_id)!
        : undefined,
      assigned_to:
        a.assignee_user_id && nameById.has(a.assignee_user_id)
          ? { id: a.assignee_user_id, name: nameById.get(a.assignee_user_id)! }
          : null,
      assigned_by:
        a.assigned_by_user_id && nameById.has(a.assigned_by_user_id)
          ? { id: a.assigned_by_user_id, name: nameById.get(a.assigned_by_user_id)! }
          : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: { ...hit, evidence, assignments },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
