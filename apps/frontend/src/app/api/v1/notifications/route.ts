import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/notifications?page=1
 *
 * Role-aware inbox backed by the get_my_notifications RPC. Authenticated via
 * the session cookie (createServerClient), so no token plumbing is needed.
 * Returns: { notifications, unread_count, total, page, per_page }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const page = Number(request.nextUrl.searchParams.get("page") || "1") || 1;
    const { data, error } = await supabase.rpc("get_my_notifications", {
      p_page: page,
    });

    if (error) {
      console.error("[/api/v1/notifications] rpc error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      data ?? { notifications: [], unread_count: 0, total: 0, page, per_page: 20 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}