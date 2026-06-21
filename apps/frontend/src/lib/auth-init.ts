"use client";

import { useEffect } from "react";
import { setTokenRefreshHandler } from "@likaslens/shared";
import { getSupabaseClient } from "@/utils/supabase/client";

/**
 * React component that registers the 401 token refresh handler once.
 * Include this in any client-side layout or page wrapper.
 */
export function AuthRefreshInit() {
  useEffect(() => {
    setTokenRefreshHandler(async () => {
      try {
        const supabase = getSupabaseClient();
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

        const isSecure =
          typeof window !== "undefined" && window.location.protocol === "https:";
        document.cookie = `laravel_token=${encodeURIComponent(newToken)}; path=/; SameSite=Strict; max-age=${30 * 86400}${isSecure ? "; Secure" : ""}`;

        return newToken;
      } catch {
        return null;
      }
    });
  }, []);

  return null;
}
