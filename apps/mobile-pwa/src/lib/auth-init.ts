"use client";

import { setTokenRefreshHandler } from "@likaslens/shared";
import { createClient } from "./supabase/client";

/**
 * Register the token refresh handler for the mobile PWA.
 *
 * When the shared API client receives a 401, it calls this handler which:
 * 1. Gets the current Supabase session (auto-refreshes if expired)
 * 2. Calls Laravel /auth/sync with the fresh session
 * 3. Updates the laravel_token cookie
 * 4. Returns the new token so the original request can be retried
 *
 * Call this once at app startup, e.g. from a root client layout.
 */
export function initAuthRefresh() {
  setTokenRefreshHandler(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) return null;

      const user = data.session.user;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          supabase_auth_user_id: user.id,
          email: user.email,
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
        }),
      });

      if (!res.ok) return null;

      const json = await res.json();
      const newToken: string | undefined = json?.data?.token;
      if (!newToken) return null;

      // Update the cookie so future page loads use the fresh token
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = `laravel_token=${encodeURIComponent(newToken)}; path=/; SameSite=Strict; max-age=${30 * 86400}${isSecure ? "; Secure" : ""}`;

      return newToken;
    } catch {
      return null;
    }
  });
}
