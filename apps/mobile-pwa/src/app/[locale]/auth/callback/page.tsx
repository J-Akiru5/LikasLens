"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

function CallbackHandler() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          setError(error.message);
          return;
        }

        if (!data.session?.user) {
          setError(t("noSessionReturned"));
          return;
        }

        const locale = data.session.user.user_metadata?.locale || "en";
        const redirectTo = searchParams.get("redirect_to") || `/${locale}/dashboard`;
        router.replace(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("authFailed"));
      }
    }

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="h-dvh flex items-center justify-center p-6 bg-page">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="font-semibold text-xl text-ink">{t("authenticationFailed")}</h1>
          <p className="text-sm text-ink/60">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-4 px-6 py-3 bg-accent text-white rounded-xl font-semibold text-sm"
          >
            {t("backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex items-center justify-center bg-page">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-ink/60 font-medium">{t("completingSignIn")}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="h-dvh flex items-center justify-center bg-page">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-sm text-ink/60 font-medium">Loading…</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
