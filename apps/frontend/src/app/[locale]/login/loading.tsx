export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-7 w-48 rounded-lg bg-ink/5" />
      <div className="h-4 w-72 rounded bg-ink/5" />
      <div className="mt-8 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-ink/5" />
        ))}
      </div>
    </div>
  )
}
