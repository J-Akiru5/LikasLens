'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-md rounded-xl border border-border bg-panel p-8 text-center">
        <p className="text-sm text-muted">Something went wrong loading this page.</p>
        <p className="mt-1 text-xs text-muted/60">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
