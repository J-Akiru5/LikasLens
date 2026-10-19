import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { routeTicketToCoveringOffice } from "@likaslens/shared";
import { createClient as createServerClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    // Fail closed. Falling back to the anon key silently turned a service-role
    // write into whatever RLS allows, hiding a misconfigured server.
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
      "";
    if (!url || !serviceKey) {
      return NextResponse.json(
        { success: false, error: "Server is not configured to accept reports." },
        { status: 503 },
      );
    }

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
    const reportType = body.report_type ? String(body.report_type) : undefined;

    // Identity comes from the session only. This route used to trust
    // body.user_id, so any caller could file a report in someone else's name.
    // Anonymous (Ghost Mode) submissions still work and store a null reporter.
    const sessionClient = await createServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    const userId = user?.id ?? null;

    let validUserId: string | null = null;
    if (userId) {
      // Try exact id match first (new registrations set id = supabase auth UUID)
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (userRecord?.id) {
        validUserId = userRecord.id;
      } else {
        // Fallback: look up by supabase_auth_user_id (legacy users)
        const { data: legacyRecord } = await supabase
          .from("users")
          .select("id")
          .eq("supabase_auth_user_id", userId)
          .maybeSingle();
        if (legacyRecord?.id) {
          validUserId = legacyRecord.id;
        }
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
