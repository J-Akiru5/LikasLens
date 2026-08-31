/**
 * POST/PUT/DELETE /api/v1/admin/users
 *
 * Admin CRUD for users table using service role key to bypass RLS.
 * Authorization enforced by middleware (super_admin only).
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }

    const db = getSupabase();
    const { data, error } = await db
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        supabase_auth_user_id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        role: body.role || "citizen",
        trust_score: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/v1/admin/users] POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    updates.updated_at = new Date().toISOString();

    const db = getSupabase();
    const { data, error } = await db
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[/api/v1/admin/users] PUT error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    // Soft delete
    const { error } = await db
      .from("users")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[/api/v1/admin/users] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
