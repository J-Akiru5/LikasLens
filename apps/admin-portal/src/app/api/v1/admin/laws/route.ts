/**
 * POST/PUT/DELETE /api/v1/admin/laws
 *
 * Admin CRUD for environmental_laws_ph table using service role key to bypass RLS.
 * Authorization enforced by middleware (super_admin or analyst only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body.title || !body.law_code) {
      return NextResponse.json({ error: "title and law_code are required" }, { status: 400 });
    }

    const db = getSupabase();
    const { data, error } = await db
      .from("environmental_laws_ph")
      .insert({
        id: crypto.randomUUID(),
        title: body.title,
        law_code: body.law_code,
        summary: body.summary || null,
        issuing_agency: body.issuing_agency || null,
        country_code: body.country_code || "PH",
        jurisdiction_scope: body.jurisdiction_scope || "national",
        source_url: body.source_url || null,
        is_active: body.is_active ?? true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/v1/admin/laws] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent(request, {
      action: "law.created",
      entity_type: "law",
      entity_id: data.id,
      new_data: data as Record<string, unknown>,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getSupabase();
    const { data: before } = await db
      .from("environmental_laws_ph")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const { data, error } = await db
      .from("environmental_laws_ph")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[/api/v1/admin/laws] PUT error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent(request, {
      action: "law.updated",
      entity_type: "law",
      entity_id: id,
      old_data: (before || {}) as Record<string, unknown>,
      new_data: data as Record<string, unknown>,
    });

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 });
    }

    const db = getSupabase();
    const { data: before } = await db
      .from("environmental_laws_ph")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const { error } = await db.from("environmental_laws_ph").delete().eq("id", id);

    if (error) {
      console.error("[/api/v1/admin/laws] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent(request, {
      action: "law.deleted",
      entity_type: "law",
      entity_id: id,
      old_data: (before || {}) as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
