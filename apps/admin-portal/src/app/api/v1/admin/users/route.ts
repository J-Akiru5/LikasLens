/**
 * POST/PUT/DELETE /api/v1/admin/users
 *
 * Admin CRUD for users table using service role key to bypass RLS.
 * Authorization enforced by middleware (super_admin only).
 *
 * POST creates a REAL Supabase auth account (not a fake row):
 *   1. auth.admin.createUser(...) with a generated temporary password
 *   2. a public.users row linked to the real auth user id
 *   3. the temporary password is returned exactly once so the admin can
 *      hand it to the new analyst / LGU user.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Roles the super admin may create from the admin portal. */
const CREATABLE_ROLES = new Set(["analyst", "lgu"]);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12 chars, URL-safe
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }
    if (typeof body.email !== "string" || !body.email.includes("@")) {
      return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
    }

    const role = String(body.role || "analyst");
    if (!CREATABLE_ROLES.has(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${[...CREATABLE_ROLES].join(", ")}` },
        { status: 400 }
      );
    }

    const name = String(body.name).trim();
    const email = String(body.email).trim().toLowerCase();
    const agencyName = body.agency_name ? String(body.agency_name).trim() : null;
    const serviceArea = body.service_area ? String(body.service_area).trim() : null;
    const tempPassword = generateTempPassword();

    const db = getSupabase();

    // 1. Create the real Supabase auth account (role lives in user_metadata,
    //    which the admin-portal login gate reads).
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      const status = authError.message.toLowerCase().includes("already been registered")
        ? 409
        : 400;
      return NextResponse.json({ error: authError.message }, { status });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create auth account" }, { status: 500 });
    }

    // 2. Create the profile row linked to the real auth user id.
    const { data, error } = await db
      .from("users")
      .insert({
        id: authData.user.id,
        supabase_auth_user_id: authData.user.id,
        name,
        email,
        role,
        agency_name: agencyName,
        service_area: serviceArea,
        trust_score: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Roll back the auth account so we don't leave an orphaned login.
      await db.auth.admin.deleteUser(authData.user.id).catch(() => {});
      console.error("[/api/v1/admin/users] POST insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent(request, {
      action: "user.created",
      entity_type: "user",
      entity_id: data.id,
      new_data: { name: data.name, email: data.email, role: data.role },
    });

    // 3. Return the temporary password ONCE — it is only stored hashed in
    //    Supabase and can never be retrieved again.
    return NextResponse.json({ data: { ...data, temp_password: tempPassword } }, { status: 201 });
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
    const { data: before } = await db
      .from("users")
      .select("name, email, role, deleted_at")
      .eq("id", id)
      .maybeSingle();
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

    await logAuditEvent(request, {
      action: "user.updated",
      entity_type: "user",
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
      .from("users")
      .select("name, email, role, supabase_auth_user_id")
      .eq("id", id)
      .maybeSingle();
    // Soft delete
    const { error } = await db
      .from("users")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[/api/v1/admin/users] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If this user has a real auth account, remove it so deactivated staff
    // can no longer sign in. Legacy rows (fake auth ids) fail gracefully.
    if (before?.supabase_auth_user_id) {
      await db.auth.admin
        .deleteUser(before.supabase_auth_user_id)
        .then(({ error: delErr }) => {
          if (delErr) console.warn("[/api/v1/admin/users] DELETE auth user:", delErr.message);
        });
    }

    await logAuditEvent(request, {
      action: "user.deactivated",
      entity_type: "user",
      entity_id: id,
      old_data: (before || {}) as Record<string, unknown>,
      new_data: { deleted_at: new Date().toISOString() } as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}