/**
 * GET /api/v1/tickets?page=1&per_page=50&status=&search=
 *
 * Session-scoped ticket list backed by the get_my_tickets RPC:
 *   - super_admin / admin  -> everything (unchanged behaviour)
 *   - analyst / lgu / lgu_officer -> ONLY tickets assigned to them or to
 *                                    someone in their agency
 *   - citizen              -> only tickets they submitted
 *
 * Location field is derived from address_text (matches the legacy mapping the
 * pages expect).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const status = request.nextUrl.searchParams.get("status") || null;
    const search = request.nextUrl.searchParams.get("search") || null;

    const { data, error } = await supabase.rpc("get_my_tickets", {
      p_page: page,
      p_status: status,
      p_search: search,
    });

    if (error) {
      console.error("[/api/v1/tickets] rpc error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as {
      tickets?: Array<Record<string, unknown>>;
      total?: number;
      page?: number;
      per_page?: number;
    } | null;

    const tickets = (result?.tickets || []).map((t) => ({
      ...t,
      location: String(t.location ?? t.address_text ?? ""),
      display_id: `TKT-${String(t.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || ""}`,
    }));

    const perPage = result?.per_page || 50;
    const total = result?.total || 0;

    return NextResponse.json({
      success: true,
      data: tickets,
      meta: {
        current_page: result?.page || page,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        per_page: perPage,
        total,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}