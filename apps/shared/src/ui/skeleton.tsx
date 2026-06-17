import { cn } from "../utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  const base = cn("rounded-lg bg-ink/5 animate-shimmer", className);

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
      <div className="grid grid-cols-3 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
      <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] sm:grid-cols-[2fr_2fr_1fr_1fr] gap-2 sm:gap-4 pb-4 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-ink/5 animate-shimmer" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] sm:grid-cols-[2fr_2fr_1fr_1fr] gap-2 sm:gap-4 py-4 border-b border-border last:border-0"
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              className={cn(
                "h-5 rounded bg-ink/5 animate-shimmer",
                j === 0 && "w-3/4",
              )}
            />
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
 * AdminKPIsSkeleton — stat card row for analytics/dashboard pages.
 * Mirrors the `bg-panel rounded-3xl p-6` KPI card style used across admin pages.
 */
export function AdminKPIsSkeleton({ count = 4 }: { count?: number }) {
  const cols =
    count === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : count === 2
        ? "grid-cols-2"
        : "grid-cols-2 lg:grid-cols-4";
  return (
    <div className={cn("grid gap-4", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-panel rounded-3xl p-6 border border-ink/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ink/5 animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-3 w-20 rounded bg-ink/5 animate-shimmer" />
              <div className="h-8 w-14 rounded bg-ink/5 animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * AdminTableSkeleton — search/filter bar + table rows for admin list pages.
 * Set showSearch=false when the real search bar renders outside the loading block.
 */
export function AdminTableSkeleton({
  rows = 8,
  columns = 5,
  showSearch = true,
}: {
  rows?: number;
  columns?: number;
  showSearch?: boolean;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      {showSearch && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-10 flex-1 rounded-xl bg-ink/5 animate-shimmer" />
          <div className="h-10 w-36 rounded-xl bg-ink/5 animate-shimmer" />
        </div>
      )}
      <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
        {/* Header row */}
        <div
          className="grid gap-4 px-6 py-3 border-b border-ink/5"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-14 rounded bg-ink/5 animate-shimmer"
            />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4 px-6 py-4 border-b border-ink/5 last:border-0"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className={cn(
                  "h-4 rounded bg-ink/5 animate-shimmer",
                  j === 0 && "w-3/4",
                  j === columns - 1 && "w-16",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AdminCardGridSkeleton — 3-column card grid for NGOs, rewards, and similar pages.
 */
export function AdminCardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-panel rounded-3xl p-6 border border-ink/5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink/5 animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-3/4 rounded bg-ink/5 animate-shimmer" />
              <div className="h-3 w-1/2 rounded bg-ink/5 animate-shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-ink/5 animate-shimmer" />
            <div className="h-3 w-2/3 rounded bg-ink/5 animate-shimmer" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-ink/5">
            <div className="h-6 w-20 rounded-full bg-ink/5 animate-shimmer" />
            <div className="h-8 w-16 rounded-xl bg-ink/5 animate-shimmer" />
          </div>
        </div>
      ))}
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
              <div
                key={j}
                className="h-28 rounded-xl bg-ink/5 animate-shimmer"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
