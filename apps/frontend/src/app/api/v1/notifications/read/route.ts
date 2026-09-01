import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/v1/notifications/read
 *
 * Body: { id: string }  or  { all: true }
 * Writes per-user read receipts via RPC (session from cookie).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const all = Boolean(body.all);
    const id = typeof body.id === "string" ? body.id : "";

    if (all) {
      const { error } = await supabase.rpc("mark_all_notifications_read");
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (id) {
      const { error } = await supabase.rpc("mark_notification_read", { p_id: id });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "id or all is required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}