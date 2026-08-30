import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="text-center px-8">
        <h1 className="font-heading text-8xl font-bold text-accent/20 mb-4">
          404
        </h1>
        <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
          Page Not Found
        </h2>
        <p className="text-muted font-mono text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/en/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
