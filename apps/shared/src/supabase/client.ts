import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  // Use anon key — RLS policies allow public read.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!url || !key) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE keys — data fetching disabled."
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}
