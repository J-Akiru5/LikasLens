/**
 * POST /api/v1/reports/route
 *
 * Applies service-area auto-routing to a ticket that was inserted by the
 * browser fallback path. Runs server-side with the service-role key because
 * the assignment / notification / ticket-update writes are RLS-gated and
 * cannot be done with the browser's anon client.
 *
 * Body: { ticket_id, address?, category?, latitude?, longitude? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { routeTicketToCoveringOffice } from "@likaslens/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const ticketId =
      typeof body.ticket_id === "string" ? body.ticket_id : "";
    if (!ticketId) {
      return NextResponse.json(
        { error: "ticket_id is required" },
        { status: 400 }
      );
    }

    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
        ""
    );

    const routing = await routeTicketToCoveringOffice(
      db,
      ticketId,
      typeof body.address === "string" ? body.address : null,
      typeof body.category === "string" ? body.category : null,
      typeof body.latitude === "number" ? body.latitude : null,
      typeof body.longitude === "number" ? body.longitude : null
    );

    return NextResponse.json({
      success: true,
      data: {
        ticket_id: ticketId,
        routed_office: routing.officeName,
        assigned: routing.assigned,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/v1/reports/route] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
