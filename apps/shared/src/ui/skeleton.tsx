import { cn } from "../utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse rounded-lg bg-ink/5",
              className
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-ink/5",
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-ink/5 bg-ink/[0.02] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-ink/5" />
                <div className="h-8 w-16 rounded bg-ink/5" />
              </div>
              <div className="h-10 w-10 rounded-lg bg-ink/5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse rounded-xl border border-ink/5 bg-ink/[0.02] p-6">
          <div className="h-4 w-32 rounded bg-ink/5 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-ink/5" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 rounded bg-ink/5" />
                  <div className="h-2 w-1/2 rounded bg-ink/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-pulse rounded-xl border border-ink/5 bg-ink/[0.02] p-6">
          <div className="h-4 w-28 rounded bg-ink/5 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-ink/5" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-2/3 rounded bg-ink/5" />
                  <div className="h-2 w-1/3 rounded bg-ink/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScoreboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-4 pb-4 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-ink/5" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-4 py-4 border-b border-border last:border-0"
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-5 rounded bg-ink/5" />
          ))}
        </div>
      ))}
    </div>
  );
}
