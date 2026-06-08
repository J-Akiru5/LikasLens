export default function Loading() {
  return (
    <div className="animate-pulse p-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="h-10 w-3/4 rounded-lg bg-ink/5" />
          <div className="h-5 w-full rounded bg-ink/5" />
          <div className="h-5 w-2/3 rounded bg-ink/5" />
          <div className="mt-4 flex gap-3">
            <div className="h-11 w-36 rounded-lg bg-ink/5" />
            <div className="h-11 w-36 rounded-lg bg-ink/5" />
          </div>
        </div>
        <div className="h-72 w-full rounded-xl bg-ink/5 lg:h-96 lg:w-[480px]" />
      </div>
      <div className="mt-16 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-ink/5" />
        ))}
      </div>
    </div>
  )
}
