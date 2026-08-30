"use client";

import { useEffect, useState } from "react";
import {
  getAnalyticsSummary,
  getAnalyticsCategories,
  getBiasRegister,
  EmptyState,
  Skeleton,
  showToast,
} from "@likaslens/shared";
import type {
  AnalyticsSummary,
  AnalyticsCategories,
  BiasRiskEntry,
} from "@likaslens/shared";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Minus,
  ShieldCheck,
} from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  mitigated: { bg: "bg-green/10", text: "text-green", icon: CheckCircle2 },
  partial: { bg: "bg-amber/10", text: "text-amber", icon: AlertTriangle },
  open: { bg: "bg-red/10", text: "text-red", icon: AlertTriangle },
  closed: { bg: "bg-ink/[0.04]", text: "text-ink/50", icon: Minus },
};

const LIKELIHOOD_COLORS: Record<string, string> = {
  high: "text-red",
  medium: "text-amber",
  low: "text-green",
};

const IMPACT_COLORS: Record<string, string> = {
  high: "text-red",
  medium: "text-amber",
  low: "text-green",
};

const CATEGORY_LABELS: Record<string, string> = {
  model: "Model Bias",
  system: "System Integrity",
  i18n: "Language / i18n",
  compliance: "Compliance",
};

function BiasRegisterSkeleton() {
  return (
    <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="h-7 w-48 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          {Array.from({ length: 2 }).map((_, j) => (
            <div
              key={j}
              className="rounded-xl border border-ink/5 p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-12 w-36 rounded-xl" variant="brand" />
        <Skeleton className="h-5 w-64 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-ink/5 p-5"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-12 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5 space-y-4">
          <Skeleton className="h-5 w-36 rounded" />
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              className="flex items-center justify-between p-3 rounded-xl border border-ink/5"
            >
              <Skeleton className="h-4 flex-1 rounded" />
              <Skeleton className="h-5 w-16 rounded-full ml-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categories, setCategories] = useState<AnalyticsCategories | null>(null);
  const [biasRisks, setBiasRisks] = useState<BiasRiskEntry[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);
  const [biasLoading, setBiasLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary()
      .then((res) => {
        if (res.success && res.data) setSummary(res.data);
      })
      .catch((err) => {
        console.error("Failed to load analytics summary:", err);
        showToast("Failed to load analytics summary", "error");
      })
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    getAnalyticsCategories()
      .then((res) => {
        if (res.success && res.data) setCategories(res.data);
      })
      .catch((err) => {
        console.error("Failed to load analytics categories:", err);
        showToast("Failed to load category data", "error");
      })
      .finally(() => setCatsLoading(false));
  }, []);

  useEffect(() => {
    getBiasRegister()
      .then((res) => {
        if (res.success) setBiasRisks(res.data);
      })
      .catch((err) => {
        console.error("Failed to load bias register:", err);
        showToast("Failed to load bias risk register", "error");
      })
      .finally(() => setBiasLoading(false));
  }, []);

  const loading = summaryLoading || catsLoading;

  if (loading) return <AnalyticsSkeleton />;

  const totalTickets = summary?.total_reports ?? 0;
  const resolutionRate = summary?.resolution_rate ?? 0;
  const statusCounts = summary?.status_counts ?? [];
  const categoryCounts = categories?.categories ?? [];

  const pendingCount = statusCounts
    .filter((s) => !["resolved", "verified", "closed"].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const kpis = [
    {
      label: "Total Reports",
      value: totalTickets,
      suffix: "",
      icon: BarChart3,
      iconBg: "bg-ink/[0.04]",
      iconColor: "text-ink/60",
      valueColor: "text-ink",
      bgTint: "bg-ink/[0.02] hover:bg-ink/[0.04]",
      ghostColor: "text-ink",
    },
    {
      label: "Resolution Rate",
      value: resolutionRate,
      suffix: "%",
      icon: TrendingUp,
      iconBg: "bg-green/10",
      iconColor: "text-green",
      valueColor: "text-green",
      bgTint: "bg-green/[0.02] hover:bg-green/[0.04]",
      ghostColor: "text-green",
    },
    {
      label: "Pending",
      value: pendingCount,
      suffix: "",
      icon: TrendingDown,
      iconBg: "bg-amber/10",
      iconColor: "text-amber",
      valueColor: "text-amber-600",
      bgTint: "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]",
      ghostColor: "text-amber-500",
    },
  ];

  // Group bias risks by category
  const biasByCategory = biasRisks.reduce<Record<string, BiasRiskEntry[]>>(
    (acc, entry) => {
      const cat = entry.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
            Analytics
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            Platform-wide statistics and risk register
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`rounded-2xl border border-ink/5 p-5 ${kpi.bgTint} group transition-colors duration-300 relative overflow-hidden`}
            >
              <div
                className={`absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 ${kpi.ghostColor}`}
                style={{ opacity: 0.05 }}
              >
                <Icon className="w-24 h-24 sm:w-28 sm:h-28" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                    {kpi.label}
                  </span>
                  <p
                    className={`font-semibold tracking-tight text-3xl mt-1 ${kpi.valueColor}`}
                  >
                    {kpi.value}
                    {kpi.suffix}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tickets section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Tickets by Status — from server-side aggregation */}
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5">
          <h3 className="font-semibold tracking-tight text-xl text-ink mb-6">
            Reports by Status
          </h3>
          {statusCounts.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No ticket data yet"
              description="Status distribution will appear once tickets are created and processed."
            />
          ) : (
            <div className="space-y-4">
              {statusCounts.map((sc) => (
                <div key={sc.status}>
                  <div className="flex justify-between font-mono text-sm mb-2">
                    <span className="text-ink/70">{sc.status}</span>
                    <span className="text-ink/40">
                      {sc.count} ({sc.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green rounded-full transition-all duration-500"
                      style={{ width: `${sc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Distribution — from server-side aggregation */}
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5">
          <h3 className="font-semibold tracking-tight text-xl text-ink mb-6">
            Reports by Category
          </h3>
          {categoryCounts.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No category data yet"
              description="Category breakdown will appear once triaged reports are processed."
            />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categoryCounts.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-3 rounded-xl border border-ink/5 hover:bg-ink/[0.02] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-ink truncate">
                      {cat.category.replace(/_/g, " ")}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      avg confidence: {(cat.avg_confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <span className="font-mono text-sm font-bold text-ink">
                      {cat.count}
                    </span>
                    <span className="font-mono text-xs text-ink/40 ml-1">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bias / Risk Register ── */}
      {biasLoading ? (
        <BiasRegisterSkeleton />
      ) : biasRisks.length === 0 ? (
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5">
          <EmptyState
            icon={ShieldAlert}
            title="No bias risks registered"
            description="AI model and system bias assessments will appear here once risk data is seeded."
            colorTheme="amber"
          />
        </div>
      ) : (
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="font-semibold tracking-tight text-xl text-ink">
                Bias / Risk Register
              </h2>
              <p className="font-mono text-xs text-muted">
                AI model and system fairness risk tracking
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(biasByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, entries]) => (
                <div key={category}>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>

                  <div className="space-y-2">
                    {entries.map((entry) => {
                      const st = STATUS_STYLES[entry.status] ?? STATUS_STYLES.open;
                      const StatusIcon = st.icon;
                      return (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-ink/5 p-4 hover:bg-ink/[0.01] transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <p className="font-medium text-sm text-ink flex-1">
                              {entry.risk}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Status badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold ${st.bg} ${st.text}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {entry.status}
                              </span>

                              {/* Likelihood */}
                              <span
                                className={`font-mono text-[10px] uppercase tracking-widest font-bold ${LIKELIHOOD_COLORS[entry.likelihood] ?? "text-ink/40"}`}
                                title={`Likelihood: ${entry.likelihood}`}
                              >
                                {entry.likelihood}
                              </span>

                              {/* Impact */}
                              <span
                                className={`font-mono text-[10px] uppercase tracking-widest font-bold ${IMPACT_COLORS[entry.impact] ?? "text-ink/40"}`}
                                title={`Impact: ${entry.impact}`}
                              >
                                {entry.impact}
                              </span>
                            </div>
                          </div>

                          {/* Mitigation text */}
                          <p className="font-mono text-xs text-ink/50 leading-relaxed">
                            {entry.mitigation}
                          </p>

                          {entry.evidence_url && (
                            <a
                              href={entry.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline mt-1.5"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Evidence
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
