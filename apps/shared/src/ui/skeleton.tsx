import { cn } from "../utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  const base = cn(
    "rounded-lg bg-ink/5 animate-shimmer",
    className
  );

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={base} />
        ))}
      </div>
    );
  }

  return <div className={base} />;
}

/**
 * Dashboard skeleton — mirrors the real dashboard layout shape
 * with stat cards, activity feed, and recent tickets panels.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-ink/5 bg-ink/[0.02] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-3 w-20 rounded bg-ink/5 animate-shimmer" />
                <div className="h-8 w-16 rounded bg-ink/5 animate-shimmer" />
                <div className="h-2 w-12 rounded bg-ink/5 animate-shimmer" />
              </div>
              <div className="h-10 w-10 rounded-lg bg-ink/5 animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity feed */}
        <div className="rounded-xl border border-ink/5 bg-ink/[0.02] p-6">
          <div className="h-5 w-32 rounded bg-ink/5 animate-shimmer mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-ink/5 animate-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-ink/5 animate-shimmer" />
                  <div className="h-2 w-1/2 rounded bg-ink/5 animate-shimmer" />
                </div>
                <div className="h-3 w-16 rounded bg-ink/5 animate-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="rounded-xl border border-ink/5 bg-ink/[0.02] p-6">
          <div className="h-5 w-28 rounded bg-ink/5 animate-shimmer mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-ink/5 animate-shimmer" />
                  <div className="h-2 w-1/3 rounded bg-ink/5 animate-shimmer" />
                </div>
                <div className="h-6 w-16 rounded-full bg-ink/5 animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Scoreboard skeleton — mirrors the real scoreboard table layout
 * with header row and multiple data rows.
 */
export function ScoreboardSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-4 pb-4 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-ink/5 animate-shimmer" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-4 py-4 border-b border-border last:border-0"
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className={cn("h-5 rounded bg-ink/5 animate-shimmer", j === 0 && "w-3/4")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton — for login, register, and settings pages
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-ink/5 animate-shimmer" />
        <div className="h-4 w-64 rounded bg-ink/5 animate-shimmer" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-ink/5 animate-shimmer" />
          <div className="h-11 w-full rounded-lg bg-ink/5 animate-shimmer" />
        </div>
      ))}
      <div className="h-12 w-full rounded-lg bg-ink/5 animate-shimmer" />
    </div>
  );
}

/**
 * Page skeleton — for general page loads with title + content blocks
 */
export function PageSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-ink/5 animate-shimmer" />
        <div className="h-4 w-72 rounded bg-ink/5 animate-shimmer" />
      </div>
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-32 rounded bg-ink/5 animate-shimmer" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-28 rounded-xl bg-ink/5 animate-shimmer" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
