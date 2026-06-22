"use client";

import { setTokenRefreshHandler } from "@likaslens/shared";
import { createClient } from "./supabase";

/**
 * Register the token refresh handler for the admin portal.
 *
 * Call this once at app startup from a root client component.
 */
export function initAuthRefresh() {
  setTokenRefreshHandler(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.access_token) return null;

      const user = data.session.user;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

      const isSecure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = `laravel_token=${encodeURIComponent(newToken)}; path=/; SameSite=Strict; max-age=${30 * 86400}${isSecure ? "; Secure" : ""}`;

      return newToken;
    } catch {
      return null;
    }
  });
}
