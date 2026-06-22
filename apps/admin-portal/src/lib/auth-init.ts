"use client";

import { setTokenProvider, setTokenRefreshHandler } from "@likaslens/shared";
import { createClient } from "./supabase";

/**
 * Register Supabase token provider + refresh handler for admin portal.
 */
export function initAuth() {
  const supabase = createClient();

  setTokenProvider(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  });

  setTokenRefreshHandler(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) return null;
      return data.session.access_token;
    } catch {
      return null;
    }
  });
}
