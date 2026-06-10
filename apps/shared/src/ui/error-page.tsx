"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { cn } from "../utils";

interface ErrorPageProps {
  title?: string;
  message?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
  showHome?: boolean;
  className?: string;
}

export function ErrorPage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  error,
  reset,
  showHome = true,
  className,
}: ErrorPageProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center p-6",
        className
      )}
    >
      <div className="max-w-md w-full rounded-2xl border border-border bg-panel p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-bold text-ink mb-2">{title}</h1>
        <p className="text-sm text-muted leading-relaxed">{message}</p>

        {error?.message && process.env.NODE_ENV === "development" && (
          <p className="mt-3 text-xs text-muted/60 font-mono bg-ink/[0.02] rounded-lg p-3 text-left break-all">
            {error.message}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-8">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          )}
          {showHome && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-ink text-sm font-medium hover:bg-ink/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

interface NotFoundPageProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function NotFoundPage({
  title = "Page not found",
  message = "This page doesn't exist or has been moved.",
  action = { label: "Back to home", href: "/" },
  className,
}: NotFoundPageProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center p-6",
        className
      )}
    >
      <div className="max-w-md w-full rounded-2xl border border-border bg-panel p-10 text-center shadow-sm">
        <div className="text-6xl font-black text-ink/10 mb-4 select-none">
          404
        </div>

        <h1 className="text-xl font-bold text-ink mb-2">{title}</h1>
        <p className="text-sm text-muted leading-relaxed">{message}</p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Home className="w-4 h-4" />
            {action.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
