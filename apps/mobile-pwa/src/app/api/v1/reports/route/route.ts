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
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Roles allowed to route any ticket. Mirrors the admin portal's gate. */
const ELEVATED_ROLES = new Set(["analyst", "admin", "super_admin", "lgu", "lgu_officer"]);

/**
 * How recently a ticket must have been created for a caller who cannot prove
 * ownership to still be allowed to route it. This is the Ghost Mode escape
 * hatch: an anonymous ticket has reporter_user_id = null, so ownership is
 * unprovable, but the client that just created it is the only one that can know
 * its id. Bounded to keep the window useless for sweeping historical tickets.
 */
const FRESH_WINDOW_MS = 10 * 60 * 1000;

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
      "";
    // Fail closed rather than silently attempting a service-role write with a
    // missing key.
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server is not configured to route reports." },
        { status: 503 }
      );
    }

    // A signed-in caller is required. Previously this route had no caller check
    // at all and would route any ticket id handed to it.
    const sessionClient = await createServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createServiceClient(url, serviceKey);

    const { data: ticket, error: ticketErr } = await db
      .from("tickets")
      .select("id, reporter_user_id, status, created_at")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketErr) {
      console.error("[/api/v1/reports/route] ticket lookup failed:", ticketErr.message);
      return NextResponse.json({ error: "Ticket lookup failed" }, { status: 500 });
    }
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const role = (user.user_metadata as { role?: string } | null)?.role ?? "";
    const isElevated = ELEVATED_ROLES.has(role);
    const ownsTicket =
      ticket.reporter_user_id != null && ticket.reporter_user_id === user.id;
    const isFreshOpenTicket =
      ticket.reporter_user_id == null &&
      ticket.status === "open" &&
      Date.now() - new Date(ticket.created_at as string).getTime() < FRESH_WINDOW_MS;

    if (!isElevated && !ownsTicket && !isFreshOpenTicket) {
      return NextResponse.json(
        { error: "Not permitted to route this ticket" },
        { status: 403 }
      );
    }

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