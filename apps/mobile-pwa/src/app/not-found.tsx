import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-page p-4">
      <div className="panel p-8 max-w-md text-center space-y-4">
        <div className="text-6xl font-bold text-muted">404</div>
        <h1 className="text-xl font-bold">Page Not Found</h1>
        <p className="text-muted text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
