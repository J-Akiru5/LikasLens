"use client";

import { useEffect } from "react";
import { setTokenRefreshHandler, setTokenProvider } from "@likaslens/shared";
import { getSupabaseClient } from "@/utils/supabase/client";

/**
 * Registers the 401 token refresh handler and the client-side token provider
 * for the shared API client. Include this in any client-side layout or page wrapper.
 *
 * - Token provider: returns the current Supabase access_token for API calls
 * - Refresh handler: refreshes the Supabase session when a 401 is received
 */
export function AuthRefreshInit() {
  useEffect(() => {
    // Register the token provider so client-side laravelFetch
    // automatically gets the Supabase JWT for Authorization header
    setTokenProvider(async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      } catch {
        return null;
      }
    });

    // Register the refresh handler for 401 retry
    setTokenRefreshHandler(async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.refreshSession();

        if (error || !data.session?.access_token) return null;

        return data.session.access_token;
      } catch {
        return null;
      }
    });
  }, []);

  return null;
}
