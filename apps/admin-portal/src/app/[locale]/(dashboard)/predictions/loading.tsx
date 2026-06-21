import { AdminKPIsSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="h-12 w-48 rounded-xl animate-shimmer" />
        <div className="h-5 w-72 rounded animate-shimmer" />
      </div>
      <AdminKPIsSkeleton count={3} />
      <div className="rounded-3xl border border-ink/5 p-4 sm:p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-32 rounded animate-shimmer" />
              <div className="h-3 w-24 rounded animate-shimmer" />
            </div>
            <div className="h-3 w-full rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
