import { cn } from "../utils";

type SkeletonVariant = "default" | "brand" | "subtle";

interface SkeletonProps {
  className?: string;
  count?: number;
  /**
   * Visual variant:
   * - `default`: neutral ink-based shimmer (works everywhere)
   * - `brand`: uses --accent-bright (teal #2ee6c8 civic, gold #facc15 ghost)
   * - `subtle`: uses --accent (forest green), ultra-low opacity
   * @default "default"
   */
  variant?: SkeletonVariant;
}

const variantMap: Record<SkeletonVariant, string> = {
  default: "animate-shimmer",
  brand: "animate-shimmer-brand",
  subtle: "animate-shimmer-subtle",
};

/**
 * Base Skeleton block — a shimmer placeholder that matches the
 * border-radius and sizing of the element it represents.
 *
 * 2026 standard: subtle gradient sweep, no hard edges, respects
 * `prefers-reduced-motion`. Supports brand and subtle variants
 * that use the LikasLens teal/forest-green accent palette.
 */
export function Skeleton({ className, count = 1, variant = "default" }: SkeletonProps) {
  const base = cn("rounded-lg", variantMap[variant], className);

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

/* ───────────────────────────────────────────────────────────────────────────
   DASHBOARD SKELETON — mirrors the admin dashboard page layout
   Real: greeting header + 5 asymmetric KPI tiles (hero/primary/secondary)
         + 2-column activity feed & recent tickets + optional hotspots
   ─────────────────────────────────────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting + date */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-9 w-44 rounded-xl animate-shimmer-brand" />
          <div className="h-4 w-52 rounded animate-shimmer" />
        </div>
        <div className="h-8 w-44 rounded-full animate-shimmer hidden md:block" />
      </div>

      {/* Asymmetric KPI grid: 1 hero (span-4) + 2 primary (span-4) + 2 secondary (span-2) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero KPI — span-4 — brand variant for emphasis */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-ink/5 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl animate-shimmer-brand" />
            <div className="w-16 h-8 rounded animate-shimmer-brand" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded animate-shimmer" />
            <div className="h-9 w-20 rounded animate-shimmer-brand" />
          </div>
        </div>
        {/* Primary KPI × 2 — span-4 */}
        {[1, 2].map((i) => (
          <div key={i} className="col-span-6 lg:col-span-4 rounded-2xl border border-ink/5 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl animate-shimmer" />
              <div className="w-16 h-8 rounded animate-shimmer" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-8 w-16 rounded animate-shimmer" />
            </div>
          </div>
        ))}
        {/* Secondary KPI × 2 — span-2 */}
        {[1, 2].map((i) => (
          <div key={i} className="col-span-6 lg:col-span-2 rounded-2xl border border-ink/5 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl animate-shimmer" />
              <div className="w-12 h-7 rounded animate-shimmer" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded animate-shimmer" />
              <div className="h-7 w-12 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column section: Activity + Tickets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity feed */}
        <div className="rounded-2xl border border-ink/5 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl animate-shimmer" />
            <div className="h-5 w-36 rounded animate-shimmer" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-ink/5 last:border-0">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full animate-shimmer shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 w-3/4 rounded animate-shimmer" />
                  <div className="h-3 w-1/2 rounded animate-shimmer" />
                </div>
                <div className="h-3 w-12 rounded animate-shimmer shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="rounded-2xl border border-ink/5 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl animate-shimmer" />
            <div className="h-5 w-28 rounded animate-shimmer" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-ink/5 last:border-0">
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 w-2/3 rounded animate-shimmer" />
                  <div className="h-3 w-1/3 rounded animate-shimmer" />
                </div>
                <div className="h-6 w-16 rounded-full animate-shimmer shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   SCOREBOARD SKELETON — mirrors the leaderboard page layout
   Real: spotlight banner + stats strip (3-col) + segmented tabs + data rows
   Used by both frontend and mobile-pwa scoreboard pages
   ─────────────────────────────────────────────────────────────────────────── */

export function ScoreboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Spotlight banner — brand variant for emphasis */}
      <div className="rounded-2xl border border-amber-500/20 p-5 flex items-center gap-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(217,119,6,0.08), transparent)" }}>
        <div className="w-14 h-14 rounded-2xl animate-shimmer-brand shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3 w-40 rounded animate-shimmer" />
          <div className="h-5 w-32 rounded animate-shimmer-brand" />
          <div className="h-3 w-48 rounded animate-shimmer" />
        </div>
        <div className="text-right space-y-1 shrink-0">
          <div className="h-8 w-20 rounded animate-shimmer-brand" />
          <div className="h-3 w-16 rounded animate-shimmer" />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-0 rounded-xl border border-ink/5 overflow-hidden">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="p-4 text-center space-y-1.5" style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
            <div className="h-6 w-14 mx-auto rounded animate-shimmer" />
            <div className="h-3 w-12 mx-auto rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Segmented tabs */}
      <div className="flex gap-1 p-1 rounded-full animate-shimmer" style={{ height: 36, width: 280 }} />

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[60px_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-ink/5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 rounded animate-shimmer" />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[28px_1fr_50px_50px] sm:grid-cols-[60px_1fr_1fr_1fr] gap-1.5 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-ink/5 last:border-0"
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              className={cn(
                "h-4 rounded animate-shimmer",
                j === 0 && "w-8",
                j === 1 && "w-3/4",
                j === 2 && "w-12 mx-auto",
                j === 3 && "w-16 ml-auto",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   FORM SKELETON — for login, register, settings, and profile edit pages
   ─────────────────────────────────────────────────────────────────────────── */

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title + subtitle */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg animate-shimmer" />
        <div className="h-4 w-64 rounded animate-shimmer" />
      </div>
      {/* Form fields */}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="h-11 w-full rounded-lg animate-shimmer" />
        </div>
      ))}
      {/* Submit button */}
      <div className="h-12 w-full rounded-lg animate-shimmer" />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   PAGE SKELETON — generic page with title + content blocks
   ─────────────────────────────────────────────────────────────────────────── */

export function PageSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Page title */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg animate-shimmer" />
        <div className="h-4 w-72 rounded animate-shimmer" />
      </div>
      {/* Content sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-5 w-32 rounded animate-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-28 rounded-xl border border-ink/5 p-4 space-y-3">
                <div className="h-3 w-3/4 rounded animate-shimmer" />
                <div className="h-3 w-1/2 rounded animate-shimmer" />
                <div className="h-3 w-2/3 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ADMIN KPI SKELETON — KPI stat card row for analytics/dashboard pages.
   Mirrors the GlowCard + kpi-card style used across admin pages:
   icon + label + animated counter with accent color
   ─────────────────────────────────────────────────────────────────────────── */

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
        <div key={i} className="rounded-3xl border border-ink/5 p-5 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-8 w-14 rounded animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ADMIN TABLE SKELETON — search/filter bar + table for admin list pages.
   Mirrors the bg-panel rounded-3xl table container used across admin pages.
   ─────────────────────────────────────────────────────────────────────────── */

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
          <div className="h-10 flex-1 rounded-xl animate-shimmer" />
          <div className="h-10 w-36 rounded-xl animate-shimmer" />
        </div>
      )}
      <div className="rounded-3xl border border-ink/5 overflow-hidden">
        {/* Header row */}
        <div
          className="grid gap-4 px-6 py-3 border-b border-ink/5"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-3 rounded animate-shimmer" />
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
                  "h-4 rounded animate-shimmer",
                  j === 0 && "w-3/4",
                  j === columns - 1 && "w-16 ml-auto",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ADMIN CARD GRID SKELETON — card grid for laws, NGOs, rewards pages.
   Mirrors the 3-column card grid with icon, title, description, status badge
   ─────────────────────────────────────────────────────────────────────────── */

export function AdminCardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-ink/5 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-3/4 rounded animate-shimmer" />
              <div className="h-3 w-1/2 rounded animate-shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded animate-shimmer" />
            <div className="h-3 w-2/3 rounded animate-shimmer" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-ink/5">
            <div className="h-6 w-20 rounded-full animate-shimmer" />
            <div className="h-8 w-16 rounded-xl animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE PWA SKELETONS — iOS-aesthetic grouped list patterns
   ═══════════════════════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE DASHBOARD SKELETON — mirrors the iOS-style dashboard page
   Real: greeting + date + points badge → Liksi banner (160px)
         → "My impact" 3-col stats → quick actions (4-col)
         → "Redeem eco-credits" horizontal rail → "Recent activity" rows
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileDashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in px-5 pb-28">
      {/* Date + greeting + points row */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1.5">
          <div className="h-3 w-40 rounded animate-shimmer" />
          <div className="h-8 w-48 rounded-lg animate-shimmer" />
        </div>
        <div className="h-7 w-20 rounded-full animate-shimmer" />
      </div>

      {/* Liksi mascot banner — 160px, brand variant */}
      <div className="h-40 w-full rounded-2xl animate-shimmer-brand" />

      {/* "My impact" section label */}
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 rounded animate-shimmer" />
        <div className="h-3.5 w-16 rounded animate-shimmer" />
      </div>
      {/* Stats strip — brand variant values */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 text-center space-y-1.5" style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
            <div className="h-7 w-14 mx-auto rounded animate-shimmer-brand" />
            <div className="h-3 w-12 mx-auto rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Quick actions — 4 columns */}
      <div className="rounded-2xl border border-ink/5 p-3">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl animate-shimmer" />
              <div className="h-2.5 w-10 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* "Redeem eco-credits" section label */}
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-36 rounded animate-shimmer" />
        <div className="h-3.5 w-12 rounded animate-shimmer" />
      </div>
      {/* Horizontal reward cards rail */}
      <div className="flex gap-3 -mx-5 px-5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 rounded-2xl border border-ink/5 p-3.5 space-y-2">
            <div className="w-9 h-9 rounded-xl animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-3/4 rounded animate-shimmer" />
              <div className="h-3 w-1/2 rounded animate-shimmer" />
            </div>
            <div className="h-px bg-ink/5" />
            <div className="h-3 w-14 rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* "Recent activity" section label */}
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-28 rounded animate-shimmer" />
        <div className="h-3.5 w-12 rounded animate-shimmer" />
      </div>
      {/* Activity rows */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 border-b border-ink/5 last:border-0 min-h-[58px]">
            <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 w-3/4 rounded animate-shimmer" />
              <div className="h-3 w-1/2 rounded animate-shimmer" />
            </div>
            <div className="text-right space-y-1 shrink-0">
              <div className="h-3 w-12 rounded animate-shimmer" />
              <div className="h-3 w-16 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE SCOREBOARD SKELETON — leaderboard page
   Real: title + refresh button → spotlight banner (116px)
         → stats strip (3-col) → segmented tabs (3 pills)
         → podium (top 3 radial) → ranked list rows
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileScoreboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in px-5 pb-28">
      {/* Title + refresh */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1.5">
          <div className="h-8 w-36 rounded-lg animate-shimmer" />
          <div className="h-3 w-48 rounded animate-shimmer" />
        </div>
        <div className="w-9 h-9 rounded-lg animate-shimmer" />
      </div>

      {/* Spotlight banner — 116px, brand */}
      <div className="h-28 w-full rounded-2xl animate-shimmer-brand" />

      {/* Stats strip — 3 columns */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 text-center space-y-1.5" style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
            <div className="h-5 w-12 mx-auto rounded animate-shimmer-brand" />
            <div className="h-2.5 w-10 mx-auto rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Segmented tabs */}
      <div className="rounded-full animate-shimmer" style={{ height: 34, width: "100%" }} />

      {/* Podium — 3 columns */}
      <div className="grid grid-cols-3 gap-2 items-end" style={{ minHeight: 120 }}>
        {[1, 0, 2].map((order) => (
          <div key={order} className="flex flex-col items-center gap-1.5" style={{ order, paddingBottom: order === 0 ? 0 : order === 1 ? 12 : 6 }}>
            <div className="w-12 h-12 rounded-full animate-shimmer" />
            <div className="h-3 w-20 rounded animate-shimmer" />
            <div className="h-3 w-12 rounded animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Ranked list rows */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 border-b border-ink/5 last:border-0 min-h-[58px]">
            <div className="w-6 h-4 rounded animate-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 w-2/3 rounded animate-shimmer" />
              <div className="h-3 w-1/3 rounded animate-shimmer" />
            </div>
            <div className="h-4 w-14 rounded animate-shimmer shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE PROFILE SKELETON — profile page
   Real: LargeTitle "Profile" → identity card (green, 132px, avatar+name+email)
         → "Account" section (3 rows) → "Citizen tools" section (7 rows)
         → Sign out button
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileProfileSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in px-5 pb-28">
      {/* Title */}
      <div className="h-10 w-24 rounded-lg animate-shimmer pt-2" />

      {/* Identity card — 132px, brand variant */}
      <div className="h-32 w-full rounded-2xl animate-shimmer-brand" />

      {/* "Account" section label */}
      <div className="h-3.5 w-16 rounded animate-shimmer" />
      {/* Account rows */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 border-b border-ink/5 last:border-0 min-h-[58px]">
            <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
            <div className="h-4 flex-1 rounded animate-shimmer" />
            <div className="w-4 h-4 rounded animate-shimmer shrink-0" />
          </div>
        ))}
      </div>

      {/* "Citizen tools" section label */}
      <div className="h-3.5 w-24 rounded animate-shimmer" />
      {/* Tool rows */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 border-b border-ink/5 last:border-0 min-h-[58px]">
            <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
            <div className="h-4 flex-1 rounded animate-shimmer" />
            <div className="w-4 h-4 rounded animate-shimmer shrink-0" />
          </div>
        ))}
      </div>

      {/* Sign out button */}
      <div className="h-13 w-full rounded-2xl animate-shimmer" />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE WALLET SKELETON — eco-wallet page
   Real: title → Liksi stats banner (180px, credits bar + buttons)
         → "Quick Actions" label → 8 action items (4-col grid)
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileWalletSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <div className="h-12 w-40 rounded-lg animate-shimmer mx-auto" />

      {/* Stats banner — 180px */}
      <div className="h-44 w-full animate-shimmer" style={{ borderRadius: 0 }} />

      <div className="px-5">
        {/* "Quick Actions" label */}
        <div className="h-3 w-28 rounded animate-shimmer mb-4" />
        {/* 8 action items in 4-col grid */}
        <div className="grid grid-cols-4 gap-y-6 gap-x-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[18px] animate-shimmer" />
              <div className="h-2.5 w-14 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE IMPACT SKELETON — impact page
   Real: Header → 3D globe section → 4 KPI metric cards (2×2 grid)
         → Violation donut chart
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileImpactSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center h-16 px-4">
          <div className="h-8 w-24 rounded-lg animate-shimmer" />
        </div>
      </div>

      <div className="p-4 space-y-4 mt-2">
        {/* 3D Globe section */}
        <div className="rounded-2xl border border-ink/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded animate-shimmer" />
            <div className="h-3 w-28 rounded animate-shimmer" />
          </div>
          <div className="aspect-square max-w-[320px] mx-auto rounded-full animate-shimmer" />
          <div className="flex justify-center gap-4 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full animate-shimmer" />
                <div className="h-2.5 w-12 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* KPI metric cards — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink/5 p-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl animate-shimmer" />
              <div className="space-y-1.5">
                <div className="h-8 w-16 rounded animate-shimmer" />
                <div className="h-2.5 w-20 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>

        {/* Violation donut */}
        <div className="rounded-2xl border border-ink/5 p-4 space-y-3">
          <div className="h-4 w-36 rounded animate-shimmer" />
          <div className="h-48 w-full rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE REPORT SKELETON — report submission page
   Real: camera viewfinder (3:4) + capture button + controls
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileReportSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in p-4 pb-20">
      {/* Camera viewfinder */}
      <div className="aspect-[3/4] w-full rounded-2xl animate-shimmer" />
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full animate-shimmer" />
        <div className="w-16 h-16 rounded-full animate-shimmer" />
        <div className="w-12 h-12 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE LIST SKELETON — generic list for laws, incidents, history, etc.
   Real: back button + title → grouped list rows with icon, label, chevron
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-fade-in px-5 pb-28">
      {/* Back + title */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
        <div className="h-6 w-32 rounded animate-shimmer" />
      </div>
      {/* Rows */}
      <div className="rounded-2xl border border-ink/5 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 border-b border-ink/5 last:border-0 min-h-[58px]">
            <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 w-2/3 rounded animate-shimmer" />
              <div className="h-3 w-1/3 rounded animate-shimmer" />
            </div>
            <div className="w-4 h-4 rounded animate-shimmer shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MOBILE ANALYTICS SKELETON — analytics / reports / map page
   Real: Header with PulseBadge → KPI cards (2-col) → Active Citizens card
         → AQI Gauge → Time series → Violation donut → Sankey → Hotspots
   ─────────────────────────────────────────────────────────────────────────── */

export function MobileAnalyticsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center h-16 px-4 gap-3">
          <div className="h-8 w-28 rounded-lg animate-shimmer" />
          <div className="h-6 w-14 rounded-full animate-shimmer" />
        </div>
      </div>

      <div className="p-4 space-y-4 mt-2">
        {/* KPI cards — 2-col grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink/5 p-4 space-y-2">
              <div className="w-10 h-10 rounded-2xl animate-shimmer" />
              <div className="h-2.5 w-20 rounded animate-shimmer" />
              <div className="h-8 w-14 rounded animate-shimmer" />
            </div>
          ))}
        </div>

        {/* Active Citizens card */}
        <div className="h-32 w-full rounded-[2rem] animate-shimmer" />

        {/* AQI Gauge */}
        <div className="h-52 w-full rounded-2xl border border-ink/5 p-4 space-y-3">
          <div className="h-4 w-24 rounded animate-shimmer" />
          <div className="h-32 w-full rounded animate-shimmer" />
        </div>

        {/* Time series */}
        <div className="h-64 w-full rounded-[2rem] border border-ink/5 p-4 space-y-3">
          <div className="h-4 w-32 rounded animate-shimmer" />
          <div className="h-48 w-full rounded animate-shimmer" />
        </div>

        {/* Violation donut */}
        <div className="h-56 w-full rounded-[2rem] border border-ink/5 p-4 space-y-3">
          <div className="h-4 w-36 rounded animate-shimmer" />
          <div className="h-40 w-40 mx-auto rounded-full animate-shimmer" />
        </div>

        {/* Hotspot list */}
        <div className="rounded-2xl border border-ink/5 p-4 space-y-3">
          <div className="h-4 w-28 rounded animate-shimmer" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 rounded animate-shimmer" />
                <div className="h-3 w-16 rounded animate-shimmer" />
              </div>
              <div className="h-1.5 w-full rounded-full animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
