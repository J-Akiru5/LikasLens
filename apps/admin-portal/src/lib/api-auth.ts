import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * Server-side authorisation for the admin portal's API routes.
 *
 * WHY THIS EXISTS
 * ---------------
 * The admin proxy's matcher is
 *   ["/(en|fil|...)/:path*", "/(((?!api|auth|_next|_vercel|.*\\..*).*)"]
 * — the negative lookahead excludes every `/api/*` path, so the page-level role
 * gate never runs for API routes. Several handlers carried a comment saying
 * "Authorization enforced by middleware", which was false. That included
 * `POST /api/v1/admin/users`, which created a confirmed auth account and
 * returned its temporary password to an unauthenticated caller.
 *
 * Any route that touches the service-role client MUST call one of these guards
 * at the top of the handler. Middleware is not a substitute for a check in the
 * handler that performs a privileged write.
 *
 * ROLE SOURCE
 * -----------
 * The role is read from `app_metadata`, never `user_metadata`. Supabase lets a
 * signed-in user write their own `user_metadata` — the mobile register page does
 * exactly that — so a citizen could set `user_metadata.role = "super_admin"` and
 * satisfy this check. `app_metadata` is writable only with the service role, so
 * it is the correct carrier for an authorisation claim.
 *
 * Every existing account had its role copied into `app_metadata` before this
 * module started reading it, so there is no fallback and no window in which an
 * account has no usable claim. If a role is changed in the admin portal, the
 * change writes BOTH claims: `app_metadata` is authoritative, and
 * `user_metadata` is kept in step because the user-provisioning trigger reads it.
 *
 * `public.users.role` remains the source of truth for the database policies
 * (`is_admin()` reads it server-side); this module guards the API handlers.
 */

/** Roles allowed into the admin portal. Mirrors the page-level gate. */
const STAFF_ROLES = new Set(["analyst", "admin", "super_admin", "lgu", "lgu_officer"]);

/** Roles allowed to perform user administration. */
const SUPER_ADMIN_ROLES = new Set(["super_admin"]);

export interface Caller {
  id: string;
  email: string | null;
  role: string;
}

type GuardResult = { caller: Caller; response?: undefined } | { caller?: undefined; response: NextResponse };

function roleOf(user: { app_metadata?: Record<string, unknown> }): string {
  const role = user.app_metadata?.role;
  return typeof role === "string" ? role : "";
}

async function currentCaller(): Promise<Caller | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, role: roleOf(user) };
}

/** Any authenticated staff member. */
export async function requireStaff(): Promise<GuardResult> {
  const caller = await currentCaller();
  if (!caller) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (!STAFF_ROLES.has(caller.role)) {
    return { response: NextResponse.json({ error: "Not permitted" }, { status: 403 }) };
  }
  return { caller };
}

/** Super admins only, for account and role administration. */
export async function requireSuperAdmin(): Promise<GuardResult> {
  const guard = await requireStaff();
  if (guard.response) return guard;
  if (!SUPER_ADMIN_ROLES.has(guard.caller.role)) {
    return { response: NextResponse.json({ error: "Super admin only" }, { status: 403 }) };
  }
  return guard;
}
