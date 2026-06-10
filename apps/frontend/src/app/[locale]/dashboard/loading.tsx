import { DashboardSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      <div className="hidden lg:flex lg:w-64 shrink-0 border-r border-ink/10 bg-page p-6">
        <div className="w-full space-y-4">
          <div className="h-5 w-32 rounded bg-ink/5 animate-shimmer" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-ink/5 animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
