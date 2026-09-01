/**
 * GET /api/v1/admin/audit-logs
 *
 * Admin access to audit_logs using the service role key to bypass RLS —
 * the browser shared client is sessionless (anon), so admin-only read
 * policies would otherwise hide all audit entries.
 *
 * Query modes:
 *   GET /api/v1/admin/audit-logs?page=1&per_page=50        → paginated list
 *   GET /api/v1/admin/audit-logs?id=<uuid>                 → single entry
 *   GET /api/v1/admin/audit-logs?actions=1                 → distinct actions
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Field mapping ──────────────────────────────────────────────────────
// The DB stores JSONB in old_data/new_data and actor fields as
// actor_id/actor_email/actor_role; the UI type expects
// old_values/new_values and actor: { id, name }.
function mapEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    old_values: row.old_data ?? null,
    new_values: row.new_data ?? null,
    ip_address: row.ip_address ?? null,
    user_agent: row.user_agent ?? null,
    created_at: row.created_at,
    actor:
      row.actor_email || row.actor_id
        ? { id: row.actor_id ?? null, name: row.actor_email ?? "System" }
        : null,
    actor_id: row.actor_id ?? null,
    actor_email: row.actor_email ?? null,
    actor_role: row.actor_role ?? null,
    old_data: row.old_data ?? null,
    new_data: row.new_data ?? null,
    prev_hash: row.prev_hash ?? null,
    entry_hash: row.entry_hash ?? null,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const actionsOnly = searchParams.get("actions") === "1";

    const db = getSupabase();

    if (id) {
      const { data, error } = await db
        .from("audit_logs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("[/api/v1/admin/audit-logs] GET detail error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: mapEntry(data as Record<string, unknown>) });
    }

    if (actionsOnly) {
      const { data, error } = await db.from("audit_logs").select("action");
      if (error) {
        console.error("[/api/v1/admin/audit-logs] GET actions error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const actions = [
        ...new Set(
          (data || [])
            .map((l: { action: string }) => l.action)
            .filter(Boolean)
        ),
      ];
      return NextResponse.json({ success: true, data: actions });

    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const perPage = Math.max(1, parseInt(searchParams.get("per_page") || "50", 10) || 50);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[/api/v1/admin/audit-logs] GET list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((d: Record<string, unknown>) => mapEntry(d)),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil((count || 0) / perPage)),
        per_page: perPage,
        total: count || 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
