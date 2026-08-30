import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const ticketPayload: Record<string, unknown> = {
      id: crypto.randomUUID(),
      title,
      description,
      latitude,
      longitude,
      address_text: location,
      status: "open",
      reporter_user_id: userId || null,
      ai_triage_summary: reportType || "Unclassified",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert(ticketPayload)
      .select()
      .single();

    if (ticketErr) {
      console.error("[mobile-pwa/api/reports] Ticket insert error:", ticketErr);
      return NextResponse.json({ success: false, error: ticketErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Incident Report Submitted Successfully!",
      data: ticket,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[mobile-pwa/api/reports] Fatal handler error:", err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
