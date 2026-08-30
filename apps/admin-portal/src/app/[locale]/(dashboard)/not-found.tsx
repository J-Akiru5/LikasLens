"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function DashboardNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-6xl font-bold text-accent/20">404</h1>
        <h2 className="text-xl font-semibold text-ink">Page Not Found</h2>
        <p className="text-sm text-muted max-w-sm">
          The dashboard page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-ink/5 text-ink rounded-xl font-semibold hover:bg-ink/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <Link
          href="/en/dashboard"
          className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
