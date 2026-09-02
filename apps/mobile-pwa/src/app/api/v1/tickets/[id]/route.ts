import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tickets/[id]
 *
 * Scoped ticket detail backed by get_my_tickets RPC — citizens only see their
 * own submissions; returns 404 otherwise. Replaces the raw anon detail read.
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
        const location = String(
          (hit as Record<string, unknown>)?.location ??
          (hit as Record<string, unknown>)?.address_text ??
          ""
        );
        return NextResponse.json({ success: true, data: { ...hit, location } });
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