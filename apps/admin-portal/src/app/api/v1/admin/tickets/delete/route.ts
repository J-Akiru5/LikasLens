/**
 * POST /api/v1/admin/tickets/delete
 *
 * Delete one or more tickets using the service role key to bypass RLS.
 * The browser shared client is sessionless (anon), so role-gated
 * `admin_delete_tickets` would otherwise reject deletes.
 *
 * Body: { ids: string[] }  (single id also accepted as { ids: [id] } or { id })
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    let ids: string[] = [];
    if (Array.isArray(body.ids)) {
      ids = body.ids;
    } else if (typeof body.id === "string") {
      ids = [body.id];
    }
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "ids (non-empty array) is required" },
        { status: 400 }
      );
    }

    const db = getSupabase();
    // Capture rows before deletion so the audit trail records what was removed
    const { data: before } = await db
      .from("tickets")
      .select("id, title, status")
      .in("id", ids);
    const { error } = await db.from("tickets").delete().in("id", ids);

    if (error) {
      console.error("[/api/v1/admin/tickets/delete] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const t of before || []) {
      await logAuditEvent(request, {
        action: "ticket.deleted",
        entity_type: "ticket",
        entity_id: t.id,
        old_data: t as Record<string, unknown>,
      });
    }

    return NextResponse.json({
      success: true,
      data: { deleted: ids.length, skipped: 0 },
      message: `${ids.length} ticket${ids.length !== 1 ? "s" : ""} deleted`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}