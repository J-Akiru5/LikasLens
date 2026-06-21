import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/config";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Authenticated proxy to the Laravel API.
 *
 * Reads the `laravel_token` httpOnly cookie server-side and forwards it as a
 * Bearer token.  If Laravel rejects the token (expired / tenant mismatch /
 * missing), the proxy re-syncs the user via Supabase → POST /auth/sync,
 * sets a fresh cookie, and retries — the client never touches the cookie.
 */
export async function laravelAuthProxy(path: string): Promise<Response> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get("laravel_token")?.value;

  console.log(`[laravelAuthProxy] Request for ${path}. Existing token length: ${existingToken?.length || 0}`);

  // ── Fast path: forward the existing token ──────────────────────────
  if (existingToken) {
    const res = await fetch(`${LARAVEL_API}${path}`, {
      headers: {
        Authorization: `Bearer ${existingToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    console.log(`[laravelAuthProxy] Fast path response status for ${path}: ${res.status}`);

    if (res.ok) {
      return Response.json(await res.json());
    }

    // Non-401 errors: pass through as-is
    if (res.status !== 401) {
      const body = await res.json().catch(() => null);
      console.log(`[laravelAuthProxy] Fast path non-401 error: ${res.status}`, body);
      return Response.json(
        body ?? { success: false, message: "Upstream error" },
        { status: res.status },
      );
    }

    // 401 → token expired or invalid — fall through to re-sync
    console.log(`[laravelAuthProxy] Fast path 401 encountered, falling through to re-sync`);
  }

  // ── Re-sync: Supabase session → Laravel token ─────────────────────
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only; we set laravel_token ourselves below.
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(`[laravelAuthProxy] Supabase user check failed:`, userError);
    return Response.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 },
    );
  }

  console.log(`[laravelAuthProxy] Supabase user found: ${user.id} (${user.email}). Syncing with Laravel backend...`);

  const syncRes = await fetch(`${LARAVEL_API}/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      supabase_auth_user_id: user.id,
      email: user.email,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0],
    }),
  });

  console.log(`[laravelAuthProxy] Sync request response status: ${syncRes.status}`);

  if (!syncRes.ok) {
    const errorBody = await syncRes.text().catch(() => "");
    console.error(`[laravelAuthProxy] Sync request failed status: ${syncRes.status}, body: ${errorBody}`);
    return Response.json(
      { success: false, message: "Backend sync failed." },
      { status: 401 },
    );
  }

  const syncBody = await syncRes.json();
  const newToken: string | undefined = syncBody?.data?.token;
  if (!newToken) {
    console.error(`[laravelAuthProxy] Sync succeeded but did not return a token:`, syncBody);
    return Response.json(
      { success: false, message: "Backend sync failed." },
      { status: 401 },
    );
  }

  console.log(`[laravelAuthProxy] Sync succeeded. New token acquired.`);

  // Persist the fresh token
  cookieStore.set("laravel_token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // ── Retry with the fresh token ────────────────────────────────────
  const retryRes = await fetch(`${LARAVEL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${newToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  console.log(`[laravelAuthProxy] Retry response status for ${path}: ${retryRes.status}`);

  const body = await retryRes.json().catch(() => null);

  if (!retryRes.ok) {
    console.error(`[laravelAuthProxy] Retry request failed status: ${retryRes.status}`, body);
    return Response.json(
      body ?? { success: false, message: "Upstream error" },
      { status: retryRes.status },
    );
  }

  return Response.json(body);
}
