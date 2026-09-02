/**
 * POST /api/v1/auth/demo-provision
 *
 * Server-side provisioning for the demo login auto-fill buttons.
 *
 * WHY THIS EXISTS
 *   The login page auto-fills demo credentials for analyst / LGU / super
 *   admin. If the account doesn't exist yet, a client-side signUp() would
 *   create it — but Supabase marks those accounts "unconfirmed" when email
 *   confirmation is enabled, so sign-in then fails with "Invalid login
 *   credentials". This route creates (or repairs) the account with the
 *   service role key and email_confirm=true, so the demo works on any
 *   environment with zero manual setup.
 *
 * SECURITY
 *   Only the hardcoded demo emails below are accepted. This is a demo
 *   convenience endpoint — it must NOT accept arbitrary emails.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "@/lib/auth";

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
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const demo = DEMO_ACCOUNTS[email];
    if (!demo) {
      return NextResponse.json({ error: "Not a demo account" }, { status: 403 });
    }

    const db = getSupabase();

    // 1. If the profile row already exists, repair it: reset the password and
    //    force-confirm the email (fixes accounts left unconfirmed by an
    //    earlier client-side signUp attempt).
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      const { error } = await db.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name, role: demo.role },
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, existed: true });
    }

    // 2. No profile row — create the real auth account, confirmed.
    const { error: createError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: demo.full_name, role: demo.role },
    });

    if (createError) {
      // Auth user exists but the users trigger hasn't run (rare race) —
      // find it by email and repair instead.
      const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = users?.users.find((u) => u.email === email);
      if (found) {
        const { error: repairError } = await db.auth.admin.updateUserById(found.id, {
          password,
          email_confirm: true,
          user_metadata: { full_name: demo.full_name, role: demo.role },
        });
        if (repairError) {
          return NextResponse.json({ error: repairError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, existed: true });
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, existed: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}