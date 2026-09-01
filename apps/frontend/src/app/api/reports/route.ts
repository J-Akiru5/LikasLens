import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { routeTicketToCoveringOffice } from "@likaslens/shared";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const title = body.description
      ? String(body.description).substring(0, 120)
      : "Environmental Incident";
    const description = body.description ? String(body.description) : undefined;
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;
    const location = body.location ? String(body.location) : undefined;
    const userId = body.user_id ? String(body.user_id) : null;
    const reportType = body.report_type ? String(body.report_type) : undefined;

    let validUserId: string | null = null;
    if (userId) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (userRecord?.id) {
        validUserId = userRecord.id;
      }
    }

    const ticketPayload: Record<string, unknown> = {
      id: crypto.randomUUID(),
      title,
      description,
      latitude,
      longitude,
      address_text: location,
      status: "open",
      reporter_user_id: validUserId,
      ai_triage_summary: reportType || "Unclassified",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert(ticketPayload)
      .select()
      .single();

    // Fallback if foreign key constraint fails
    if (ticketErr && ticketErr.code === "23503") {
      console.warn("[api/reports] User FK constraint failed, falling back to anonymous ticket:", ticketErr.message);
      const fallbackResult = await supabase
        .from("tickets")
        .insert({ ...ticketPayload, reporter_user_id: null })
        .select()
        .single();
      ticket = fallbackResult.data;
      ticketErr = fallbackResult.error;
    }

    if (ticketErr) {
      console.error("[api/reports] Ticket insert error:", ticketErr);
      return NextResponse.json({ success: false, error: ticketErr.message }, { status: 500 });
    }

    // Route the report to the analyst / LGU account whose service area covers
    // the location. Non-fatal: if nobody covers it yet, the report waits in
    // the general analyst pool.
    const routing = await routeTicketToCoveringOffice(
      supabase,
      ticket.id,
      ticket.address_text,
      ticket.ai_triage_summary
    );

    return NextResponse.json({
      success: true,
      message: "Incident Report Submitted Successfully!",
      data: { ...ticket, routed_office: routing.assigned ? routing.officeName : null },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[api/reports] Fatal handler error:", err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
