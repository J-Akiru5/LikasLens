import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./config";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    const { url, anonKey } = getSupabaseEnv();
    _client = createBrowserClient(url, anonKey);
  }
  // Non-null assertion since we just created it
  return _client!;
}

export const createClient = getSupabaseClient;
