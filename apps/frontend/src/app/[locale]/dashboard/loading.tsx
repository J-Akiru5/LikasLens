export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex min-h-screen">
        <div className="hidden w-64 space-y-4 border-r border-border p-6 lg:block">
          <div className="h-5 w-32 rounded bg-ink/5" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-ink/5" />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-6 p-6">
          <div className="h-7 w-56 rounded-lg bg-ink/5" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-ink/5" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-ink/5" />
        </div>
      </div>
    </div>
  )
}
