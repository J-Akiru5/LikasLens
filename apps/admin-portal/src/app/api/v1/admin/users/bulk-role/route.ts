/**
 * POST /api/v1/admin/users/bulk-role
 *
 * Proxies bulk role updates to the AI service.
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
 * Keep Supabase auth account roles in sync with the users table (see the
 * single-user role route for why this matters). Legacy rows without a real
 * auth account are skipped silently.
 */
async function syncAuthRoles(userIds: string[], role: string): Promise<void> {
  try {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: userRows } = await db
      .from("users")
      .select("supabase_auth_user_id")
      .in("id", userIds);
    if (!userRows) return;
    await Promise.allSettled(
      userRows
        .filter((r) => r.supabase_auth_user_id)
        .map((r) =>
          db.auth.admin.updateUserById(r.supabase_auth_user_id, {
            user_metadata: { role },
          })
        )
    );
  } catch (err) {
    console.warn("[/api/v1/admin/users/bulk-role] auth metadata sync failed:", err);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

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
    const res = await fetch(`${aiUrl}/api/v1/admin/users/bulk-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ids: body.ids, role: body.role }),
    });

    const data = await res.json();
    if (res.ok) {
      await syncAuthRoles(body.ids, body.role);
      for (const id of body.ids) {
        await logAuditEvent(request, {
          action: "user.role_changed",
          entity_type: "user",
          entity_id: id,
          new_data: { role: body.role } as Record<string, unknown>,
          metadata: { bulk: true },
        });
      }
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("[/api/v1/admin/users/bulk-role] Error:", err);
    const message =
      err instanceof Error ? err.message : "AI service unreachable";
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
