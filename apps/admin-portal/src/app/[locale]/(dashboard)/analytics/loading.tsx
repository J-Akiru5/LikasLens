import { AdminKPIsSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="h-12 w-36 rounded-xl animate-shimmer" />
        <div className="h-5 w-64 rounded animate-shimmer" />
      </div>
      <AdminKPIsSkeleton count={3} />
      <div className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="rounded-3xl border border-ink/5 p-4 sm:p-6 space-y-4">
            <div className="h-5 w-36 rounded animate-shimmer" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded animate-shimmer" />
                  <div className="h-3 w-12 rounded animate-shimmer" />
                </div>
                <div className="h-2 w-full rounded-full animate-shimmer" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
