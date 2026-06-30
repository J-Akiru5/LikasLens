"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="h-dvh flex items-center justify-center p-6 bg-page">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-2xl text-ink">{t("title")}</h1>
          <p className="text-sm text-ink/60 leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-accent text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            {t("tryAgain")}
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-ink/10 text-ink rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
