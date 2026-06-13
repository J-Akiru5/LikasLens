"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  FileText,
  Activity,
} from "lucide-react";
import { laravelGet, EmptyState } from "@likaslens/shared";
import type { PublicImpactData } from "@likaslens/shared";

/* ── Animations ────────────────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

/* ── Skeleton Component ────────────────────────────────── */
function ImpactSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
            <div className="h-4 w-10 rounded bg-ink/5 mb-3" />
            <div className="h-8 w-20 rounded bg-ink/5 mb-2" />
            <div className="h-3 w-24 rounded bg-ink/5" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: "var(--panel)", border: "1px solid var(--border)", minHeight: 300 }}>
          <div className="h-5 w-40 rounded bg-ink/5 mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <div className="h-3 w-24 rounded bg-ink/5" />
              <div className="flex-1 h-6 rounded bg-ink/5" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-6" style={{ background: "var(--panel)", border: "1px solid var(--border)", minHeight: 300 }}>
          <div className="h-5 w-48 rounded bg-ink/5 mb-6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="h-8 w-8 rounded-full bg-ink/5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full rounded bg-ink/5" />
                <div className="h-3 w-2/3 rounded bg-ink/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Animated Counter ──────────────────────────────────── */
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const end = value;
    const startTime = Date.now();
    const durationMs = duration * 1000;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export function ImpactSection() {
  const [data, setData] = useState<PublicImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchImpact() {
      try {
        const res = await laravelGet<{ success: boolean; data: PublicImpactData }>(
          "/public/impact",
          controller.signal,
        );
        if (res.success) {
          setData(res.data);
        }
      } catch {
        // Silent fail, just use fallbacks
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
    return () => controller.abort();
  }, []);

  const stats = data ?? {
    total_reports: 0,
    total_resolved: 0,
    total_citizens: 0,
    total_ngos: 0,
    resolution_rate: 0,
    recent_verified: [],
    reports_by_type: {},
    top_barangays: [],
  };

  const typeEntries = Object.entries(stats.reports_by_type);
  const maxTypeCount = typeEntries.length > 0
    ? Math.max(...typeEntries.map(([, c]) => c))
    : 1;

  const statCards = [
    {
      icon: FileText,
      label: "Total Reports",
      value: stats.total_reports,
      color: "var(--accent)",
    },
    {
      icon: CheckCircle2,
      label: "Resolved",
      value: stats.total_resolved,
      color: "#22c55e",
    },
    {
      icon: Users,
      label: "Active Citizens",
      value: stats.total_citizens,
      color: "var(--secondary)",
    },
    {
      icon: Building2,
      label: "Partner NGOs",
      value: stats.total_ngos,
      color: "#f59e0b",
    },
  ];

  return (
    <section id="impact" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: 40, display: "flex", flexDirection: "column", gap: 12 }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 9999,
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            width: "fit-content",
          }}
        >
          <Activity style={{ width: 12, height: 12 }} /> Overall Impact
        </span>
        <h2
          style={{
            fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Protecting Our<br />Environment Together
        </h2>
        <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
          Real-time metrics showing how citizen reports are driving measurable environmental action.
        </p>
      </motion.div>

      {loading ? (
        <ImpactSkeleton />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* STAT CARDS GRID */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {statCards.map((card) => (
              <motion.div
                key={card.label}
                variants={fadeUp}
                className="rounded-2xl p-6"
                style={{
                  background: "var(--panel)", border: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: 8,
                  transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                }}
                whileHover={{ y: -4 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <card.icon style={{ width: 20, height: 20, color: card.color }} />
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {card.label}
                  </span>
                </div>
                <span style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, fontFamily: "monospace", letterSpacing: "-0.04em", color: "var(--ink)" }}>
                  <AnimatedCounter value={card.value} duration={1.2} />
                </span>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Reports by Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl p-6"
              style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <BarChart3 style={{ width: 18, height: 18, color: "var(--accent)" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>
                  Reports by Type
                </h2>
              </div>
              {typeEntries.length === 0 ? (
                <EmptyState
                  svg="reports"
                  title="No Classification Data"
                  description="Reports by type will appear here once submitted."
                  className="py-12"
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {typeEntries.map(([name, count]) => {
                    const pct = maxTypeCount > 0 ? (count / maxTypeCount) * 100 : 0;
                    return (
                      <div key={name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>{name}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{count}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 9999, background: "color-mix(in srgb, var(--accent) 10%, transparent)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: "100%", borderRadius: 9999, background: "var(--accent)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Recent Verified Reports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <CheckCircle2 style={{ width: 18, height: 18, color: "#22c55e" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>
                  Recently Resolved
                </h2>
              </div>
              {stats.recent_verified.length === 0 ? (
                <EmptyState
                  svg="search"
                  title="No Verified Reports"
                  description="Resolved environmental reports will appear here."
                  className="py-12"
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {stats.recent_verified.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0",
                        borderBottom: idx < stats.recent_verified.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "color-mix(in srgb, #22c55e 15%, transparent)", border: "1px solid color-mix(in srgb, #22c55e 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: "#22c55e" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, lineHeight: 1.4 }}>
                          {item.title ?? "Environmental Report"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "monospace", fontSize: 10, color: "var(--muted)" }}>
                            <MapPin style={{ width: 10, height: 10 }} /> {item.location}
                          </span>
                          <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--muted)" }}>{item.date}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "color-mix(in srgb, #22c55e 12%, transparent)", color: "#22c55e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Top Barangays */}
          {stats.top_barangays.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl p-6"
              style={{ background: "var(--panel)", border: "1px solid var(--border)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <TrendingUp style={{ width: 18, height: 18, color: "var(--secondary)" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>
                  Top Locations by Report Count
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {stats.top_barangays.map((brgy, idx) => (
                  <motion.div
                    key={brgy.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    className="rounded-xl p-4"
                    style={{ background: "color-mix(in srgb, var(--secondary) 5%, var(--panel))", border: "1px solid var(--border)", textAlign: "center" }}
                  >
                    <span style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "var(--secondary)", lineHeight: 1, display: "block" }}>
                      #{idx + 1}
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "8px 0 4px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={brgy.name}>
                      {brgy.name}
                    </p>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>
                      {brgy.count} report{brgy.count !== 1 ? "s" : ""}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </section>
  );
}
