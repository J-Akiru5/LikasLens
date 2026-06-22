"use client";

import { setTokenRefreshHandler, setTokenProvider } from "@likaslens/shared";
import { createClient } from "./supabase/client";

/**
 * Register the token provider and refresh handler for the mobile PWA.
 *
 * - Token provider: returns the current Supabase access_token for API calls
 * - Refresh handler: refreshes the Supabase session when a 401 is received
 */
export function initAuthRefresh() {
  setTokenProvider(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  });

  setTokenRefreshHandler(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session?.access_token) return null;

      return data.session.access_token;
    } catch {
      return null;
    }
  });
}
