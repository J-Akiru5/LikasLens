import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tickets/[id]
 *
 * Scoped ticket detail backed by the get_my_tickets RPC — the SAME visibility
 * rule as the list route. Super admin/admin see all; officers see only tickets
 * assigned to them or their agency; citizens only their own submissions.
 * Returns 404 when the ticket is not visible to the session user, so detail
 * reads cannot bypass the per-role scoping (previously a raw anon select).
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
        tickets?: Array<{ id: string }> | null;
        total?: number;
      };
      const tickets = result.tickets || [];
      const hit = tickets.find((t) => t.id === id);
      if (hit) {
        return NextResponse.json({ success: true, data: hit });
      }
      const total = Number(result.total ?? 0);
      if (page * 50 >= total) break;
    }

    return NextResponse.json(
      { error: "Ticket not found or not visible to your account" },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}