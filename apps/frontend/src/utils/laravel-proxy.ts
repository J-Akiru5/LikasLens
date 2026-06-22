import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/config";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Authenticated proxy to the Laravel API.
 *
 * Reads the Supabase session server-side and forwards the `access_token`
 * (a standard HS256 JWT) as a Bearer token. Laravel validates it directly
 * using the SUPABASE_JWT_SECRET — no token sync, no cookie juggling.
 *
 * If the token is expired, we refresh the Supabase session and retry once.
 */
export async function laravelAuthProxy(path: string): Promise<Response> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  // Get the current session (access_token is the Supabase JWT)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.log(`[laravelAuthProxy] No Supabase session for ${path}:`, sessionError?.message);
    return Response.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 },
    );
  }

  const accessToken = session.access_token;

  console.log(`[laravelAuthProxy] Request for ${path}. Token length: ${accessToken.length}`);

  // ── Fast path: forward the Supabase JWT ──────────────────────────
  const res = await fetch(`${LARAVEL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  console.log(`[laravelAuthProxy] Response status for ${path}: ${res.status}`);

  if (res.ok) {
    return Response.json(await res.json());
  }

  // Non-401 errors: pass through
  if (res.status !== 401) {
    const body = await res.json().catch(() => null);
    return Response.json(
      body ?? { success: false, message: "Upstream error" },
      { status: res.status },
    );
  }

  // ── 401 → try refreshing the Supabase session and retry once ─────
  console.log(`[laravelAuthProxy] 401 for ${path}, attempting Supabase session refresh...`);

  const { data: { session: refreshedSession }, error: refreshError } =
    await supabase.auth.refreshSession();

  if (refreshError || !refreshedSession?.access_token) {
    console.log(`[laravelAuthProxy] Session refresh failed:`, refreshError?.message);
    return Response.json(
      { success: false, message: "Session expired. Please sign in again." },
      { status: 401 },
    );
  }

  console.log(`[laravelAuthProxy] Session refreshed. Retrying ${path}...`);

  const retryRes = await fetch(`${LARAVEL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${refreshedSession.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  console.log(`[laravelAuthProxy] Retry response status for ${path}: ${retryRes.status}`);

  const body = await retryRes.json().catch(() => null);

  if (!retryRes.ok) {
    return Response.json(
      body ?? { success: false, message: "Upstream error" },
      { status: retryRes.status },
    );
  }

  return Response.json(body);
}
