/**
 * POST /api/v1/admin/notifications
 *
 * Broadcast a notification from the admin portal.
 *
 * Targets:
 *   - everyone:          omit for_role and user_id (or set both null)
 *   - a role only:       for_role = "analyst" | "lgu" | "lgu_officer" | ... (all users with that role)
 *   - one specific user: user_id = that user's public id (from the users table)
 *
 * Only super_admin / admin sessions may send. Writes go through the service
 * role (RLS write policies are intentionally absent — REST writes are locked),
 * and every send is recorded in the immutable audit chain.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SENDERS = ["super_admin", "admin"];
const KNOWN_ROLES = [
  "super_admin",
  "admin",
  "analyst",
  "lgu",
  "lgu_officer",
  "citizen",
];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Resolve the acting session
    let sessionUser: { id: string; email?: string } | null = null;
    try {
      const supabase = await createServerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      sessionUser = session?.user ?? null;
    } catch {
      // fall through — will be rejected below
    }

    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Role check — source of truth is the users table
    const db = getSupabase();
    const { data: actor } = await db
      .from("users")
      .select("id, role")
      .eq("supabase_auth_user_id", sessionUser.id)
      .maybeSingle();

    if (!actor || !ALLOWED_SENDERS.includes(actor.role)) {
      return NextResponse.json(
        { error: "Only super_admin or admin can send notifications" },
        { status: 403 }
      );
    }

    // 3. Validate payload
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "title (1-200 chars) is required" },
        { status: 400 }
      );
    }
    if (!message || message.length > 2000) {
      return NextResponse.json(
        { error: "message (1-2000 chars) is required" },
        { status: 400 }
      );
    }

    const type = typeof body.type === "string" && body.type.trim() ? body.type.trim().slice(0, 50) : "Broadcast";

    let forRole: string | null = null;
    if (body.for_role != null && String(body.for_role).trim() !== "") {
      forRole = String(body.for_role).trim();
      if (!KNOWN_ROLES.includes(forRole)) {
        return NextResponse.json(
          { error: `for_role must be one of: ${KNOWN_ROLES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    let userId: string | null = null;
    if (body.user_id != null && String(body.user_id).trim() !== "") {
      userId = String(body.user_id).trim();
      const { data: target } = await db
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (!target) {
        return NextResponse.json(
          { error: "user_id does not match any user" },
          { status: 400 }
        );
      }
    }

    // 4. Insert. The table is a legacy Laravel-style schema (notifiable_type /
    //    notifiable_id are NOT NULL); recipient filtering uses our user_id /
    //    for_role columns. id has no column default — generate it here.
    const { data: inserted, error } = await db
      .from("notifications")
      .insert({
        id: crypto.randomUUID(),
        type,
        data: { title, message },
        for_role: forRole,
        user_id: userId,
        notifiable_type: "App\\Models\\User",
        notifiable_id: userId ?? actor.id,
        created_at: new Date().toISOString(),
      })
      .select("id, type, data, created_at, for_role, user_id")
      .single();

    if (error || !inserted) {
      console.error("[/api/v1/admin/notifications] insert error:", error?.message);
      return NextResponse.json(
        { error: error?.message || "Failed to send notification" },
        { status: 500 }
      );
    }

    // 5. Audit trail
    await logAuditEvent(request, {
      action: "notification.sent",
      entity_type: "notification",
      entity_id: inserted.id,
      new_data: {
        title,
        message,
        type,
        for_role: forRole,
        user_id: userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: inserted,
        message:
          forRole ? `Notification sent to all ${forRole} users`
          : userId ? "Notification sent to the selected user"
          : "Notification sent to all users",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}