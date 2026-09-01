/**
 * GET/PATCH /api/v1/admin/inquiries
 *
 * Admin access to contact_messages (Inquiries page) using the service role
 * key to bypass RLS — the browser shared client is sessionless (anon), so
 * admin-only read policies would otherwise hide all messages.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const perPage = Math.max(1, parseInt(searchParams.get("per_page") || "50", 10) || 50);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const db = getSupabase();
    const { data, error, count } = await db
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[/api/v1/admin/inquiries] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil((count || 0) / perPage)),
        per_page: perPage,
        total: count || 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getSupabase();
    const { data, error } = await db
      .from("contact_messages")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status, read_at")
      .single();

    if (error) {
      console.error("[/api/v1/admin/inquiries] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
