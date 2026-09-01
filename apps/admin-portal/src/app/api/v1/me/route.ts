/**
 * GET/PUT /api/v1/me — the signed-in staff user's own profile.
 *
 * Lets an LGU or analyst fix their own agency name / service area without
 * super-admin help (e.g. after a typo at creation, or when their office
 * changes). Only ever touches the row belonging to the session user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_COLUMNS =
  "id, name, email, role, agency_name, service_area, service_area_lat, service_area_lng, trust_score, created_at";

function getServiceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = getServiceDb();
    const { data, error } = await db
      .from("users")
      .select(PROFILE_COLUMNS)
      .eq("supabase_auth_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[/api/v1/me] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.agency_name === "string")
      updates.agency_name = body.agency_name.trim() || null;
    if (typeof body.service_area === "string")
      updates.service_area = body.service_area.trim() || null;
    if (typeof body.service_area_lat === "number" && Number.isFinite(body.service_area_lat))
      updates.service_area_lat = body.service_area_lat;
    if (typeof body.service_area_lng === "number" && Number.isFinite(body.service_area_lng))
      updates.service_area_lng = body.service_area_lng;

    const db = getServiceDb();
    const { data: before } = await db
      .from("users")
      .select("name, agency_name, service_area, service_area_lat, service_area_lng")
      .eq("supabase_auth_user_id", user.id)
      .maybeSingle();

    if (!before) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data, error } = await db
      .from("users")
      .update(updates)
      .eq("supabase_auth_user_id", user.id)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      console.error("[/api/v1/me] PUT error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent(request, {
      action: "user.self_updated",
      entity_type: "user",
      entity_id: data.id,
      old_data: (before || {}) as Record<string, unknown>,
      new_data: data as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
