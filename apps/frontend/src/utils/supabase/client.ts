import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./config";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
