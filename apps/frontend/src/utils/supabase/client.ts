import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./config";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    const { url, anonKey } = getSupabaseEnv();
    _client = createBrowserClient(url, anonKey, {
      auth: {
        // Bypass navigator.locks collision to prevent "Lock broken by another request with the 'steal' option"
        lock: async (_name, _acquireTimeout, fn) => {
          return await fn();
        },
      },
    });
  }
  return _client!;
}

export const createClient = getSupabaseClient;

