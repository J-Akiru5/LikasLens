/**
 * PUT /api/v1/admin/users/[id]/role
 *
 * Proxies admin user role updates to the AI service.
 * Requires super_admin role — enforced by the AI service.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

/**
 * Keep the Supabase auth account's role in sync with the users table.
 * The admin-portal login gate reads user_metadata.role, so without this
 * a role change in the UI would never change who may sign in.
 * Legacy rows without a real auth account are skipped silently.
 */
async function syncAuthRole(userId: string, role: string): Promise<void> {
  try {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: userRow } = await db
      .from("users")
      .select("supabase_auth_user_id")
      .eq("id", userId)
      .maybeSingle();
    if (!userRow?.supabase_auth_user_id) return;
    const { error } = await db.auth.admin.updateUserById(userRow.supabase_auth_user_id, {
      user_metadata: { role },
    });
    if (error) console.warn("[/api/v1/admin/users/[id]/role] auth metadata sync:", error.message);
  } catch (err) {
    console.warn("[/api/v1/admin/users/[id]/role] auth metadata sync failed:", err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.role || typeof body.role !== "string") {
      return NextResponse.json(
        { error: "role is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const aiUrl = getAiUrl();
    const res = await fetch(`${aiUrl}/api/v1/admin/users/${id}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ role: body.role }),
    });

    const data = await res.json();
    if (res.ok) {
      await syncAuthRole(id, body.role);
      await logAuditEvent(request, {
        action: "user.role_changed",
        entity_type: "user",
        entity_id: id,
        new_data: { role: body.role } as Record<string, unknown>,
      });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("[/api/v1/admin/users/[id]/role] Error:", err);
    const message =
      err instanceof Error ? err.message : "AI service unreachable";
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
