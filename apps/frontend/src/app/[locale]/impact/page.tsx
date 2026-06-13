"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import {
  Leaf,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import { laravelGet } from "@likaslens/shared";
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

/* ── Skeleton Components ───────────────────────────────── */
function StatCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="h-4 w-10 rounded bg-ink/5 mb-3" />
      <div className="h-8 w-20 rounded bg-ink/5 mb-2" />
      <div className="h-3 w-24 rounded bg-ink/5" />
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        minHeight: 300,
      }}
    >
      <div className="h-5 w-40 rounded bg-ink/5 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-4">
          <div className="h-3 w-24 rounded bg-ink/5" />
          <div className="flex-1 h-6 rounded bg-ink/5" />
        </div>
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="h-5 w-48 rounded bg-ink/5 mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 mb-4 pb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="h-8 w-8 rounded-full bg-ink/5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full rounded bg-ink/5" />
            <div className="h-3 w-2/3 rounded bg-ink/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="min-h-dvh"
      style={{ background: "var(--page)", color: "var(--ink)" }}
    >
      {/* Hero skeleton */}
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: 360,
          background: "var(--accent)",
          padding: "96px 32px 64px",
        }}
      >
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded bg-white/10 mx-auto" />
          <div className="h-12 w-80 rounded bg-white/10 mx-auto" />
          <div className="h-16 w-64 rounded bg-white/10 mx-auto" />
        </div>
      </div>
      <div
        className="max-w-6xl mx-auto px-6 py-12 space-y-8"
        style={{ maxWidth: 1280 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <BarChartSkeleton />
          <FeedSkeleton />
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
    const start = 0;
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

/* ── Page Component ────────────────────────────────────── */
export default function ImpactPage() {
  const [data, setData] = useState<PublicImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
    return () => controller.abort();
  }, []);

  if (loading) return <LoadingSkeleton />;

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
    <main
      className="relative min-h-dvh"
      style={{ background: "var(--page)", color: "var(--ink)" }}
    >
      {/* ── NAVIGATION ─────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 40px",
          background: "rgba(22,52,34,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <img
            src="/icons/icon-192x192.png"
            alt="LikasLens Logo"
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <span
            style={{
              fontSize: 20,
              letterSpacing: "0.2em",
              color: "var(--hero-ink)",
              display: "flex",
              alignItems: "center",
              marginTop: 2,
              fontFamily: "var(--font-heading), sans-serif",
              textTransform: "uppercase"
            }}
          >
            <span style={{ fontWeight: 500 }}>LIK</span>
            <span style={{ fontWeight: 600, margin: "0 1px" }}>Λ</span>
            <span style={{ fontWeight: 500, marginRight: 4 }}>S</span>
            <span style={{ fontWeight: 800 }}>LENS</span>
          </span>
        </Link>

        <div className="hidden md:flex" style={{ gap: 32 }}>
          <Link
            href="/"
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.5)",
              textDecoration: "none",
            }}
          >
            Home
          </Link>
          <Link
            href="/report"
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.5)",
              textDecoration: "none",
            }}
          >
            Report
          </Link>
          <Link
            href="/laws"
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.5)",
              textDecoration: "none",
            }}
          >
            Laws
          </Link>
        </div>

        <UserNav invert />
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          minHeight: 400,
          backgroundColor: "var(--accent)",
          backgroundImage: `
            radial-gradient(ellipse 70% 60% at 10% 10%, rgba(46,230,200,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 80% 70% at 90% 20%, rgba(13,40,22,0.7) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 90%, rgba(46,230,200,0.08) 0%, transparent 50%)
          `,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          padding: "120px 32px 80px",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.025,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(240,237,232,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(240,237,232,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div variants={fadeUp}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                borderRadius: 9999,
                background: "rgba(46,230,200,0.1)",
                border: "1px solid rgba(46,230,200,0.2)",
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-bright)",
              }}
            >
              <Activity style={{ width: 12, height: 12 }} />
              Public Impact Dashboard
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              color: "var(--hero-ink)",
              margin: 0,
              maxWidth: 700,
            }}
          >
            Protecting Our
            <br />
            Environment{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-bright) 0%, #5aefb0 50%, #a8f5d0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Together
            </span>
          </motion.h1>

          {/* Big Counter */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: "clamp(3.5rem, 8vw, 6rem)",
                fontWeight: 900,
                fontFamily: "monospace",
                letterSpacing: "-0.04em",
                color: "var(--accent-bright)",
                lineHeight: 1,
              }}
            >
              <AnimatedCounter value={stats.total_reports} />
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(240,237,232,0.5)",
              }}
            >
              Environmental Reports Submitted
            </span>
          </motion.div>

          {/* Resolution Rate */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ShieldCheck style={{ width: 18, height: 18, color: "var(--accent-bright)" }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--hero-ink)",
              }}
            >
              {stats.resolution_rate}%
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "rgba(240,237,232,0.5)",
              }}
            >
              Resolution Rate
            </span>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp}>
            <Link
              href="/report"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 12,
                background: "var(--accent-bright)",
                color: "var(--hero-bg)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "-0.01em",
                textDecoration: "none",
                border: "none",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px -8px rgba(46,230,200,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Submit a Report <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero wave divider */}
        <div
          style={{
            position: "absolute",
            bottom: -2,
            left: 0,
            right: 0,
            pointerEvents: "none",
            lineHeight: 0,
          }}
        >
          <svg
            viewBox="0 0 1440 100"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ display: "block", width: "100%", height: 100 }}
          >
            <path
              d="M0,40 C180,90 360,10 540,50 C720,90 900,20 1080,55 C1260,90 1380,30 1440,50 L1440,100 L0,100 Z"
              fill="var(--page)"
            />
          </svg>
        </div>
      </section>

      {/* ── STAT CARDS GRID ──────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 48px" }}>
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
                background: "var(--panel)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
              whileHover={{ y: -4 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <card.icon style={{ width: 20, height: 20, color: card.color }} />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {card.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  letterSpacing: "-0.04em",
                  color: "var(--ink)",
                }}
              >
                <AnimatedCounter value={card.value} duration={1.2} />
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── REPORTS BY TYPE + RECENT VERIFIED ──────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 80px" }}>
        <div className="grid md:grid-cols-2 gap-6">

          {/* Reports by Type (CSS bar chart) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
              }}
            >
              <BarChart3 style={{ width: 18, height: 18, color: "var(--accent)" }} />
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Reports by Type
              </h2>
            </div>

            {typeEntries.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                No classification data available yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {typeEntries.map(([name, count]) => {
                  const pct = maxTypeCount > 0 ? (count / maxTypeCount) * 100 : 0;
                  return (
                    <div key={name}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "var(--ink)",
                            fontWeight: 600,
                          }}
                        >
                          {name}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--accent)",
                          }}
                        >
                          {count}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 9999,
                          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            height: "100%",
                            borderRadius: 9999,
                            background: "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Verified Reports Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
              }}
            >
              <CheckCircle2 style={{ width: 18, height: 18, color: "#22c55e" }} />
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Recently Resolved
              </h2>
            </div>

            {stats.recent_verified.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                No verified reports yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {stats.recent_verified.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 0",
                      borderBottom:
                        idx < stats.recent_verified.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "color-mix(in srgb, #22c55e 15%, transparent)",
                        border: "1px solid color-mix(in srgb, #22c55e 30%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 style={{ width: 14, height: 14, color: "#22c55e" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink)",
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title ?? "Environmental Report"}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "var(--muted)",
                          }}
                        >
                          <MapPin style={{ width: 10, height: 10 }} />
                          {item.location}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "var(--muted)",
                          }}
                        >
                          {item.date}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "color-mix(in srgb, #22c55e 12%, transparent)",
                            color: "#22c55e",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
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
      </section>

      {/* ── TOP BARANGAYS ────────────────────────────────── */}
      {stats.top_barangays.length > 0 && (
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 80px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
              }}
            >
              <TrendingUp style={{ width: 18, height: 18, color: "var(--secondary)" }} />
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
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
                  style={{
                    background: "color-mix(in srgb, var(--secondary) 5%, var(--panel))",
                    border: "1px solid var(--border)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 28,
                      fontWeight: 900,
                      color: "var(--secondary)",
                      lineHeight: 1,
                      display: "block",
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      margin: "8px 0 4px",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={brgy.name}
                  >
                    {brgy.name}
                  </p>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {brgy.count} report{brgy.count !== 1 ? "s" : ""}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── CTA SECTION ──────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1b4332 0%, #166534 50%, #1b4332 100%)",
            padding: "64px 32px",
            textAlign: "center",
          }}
        >
          {/* Grid texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.06,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "#fff",
                margin: 0,
                maxWidth: 500,
              }}
            >
              Every report matters.
              <br />
              <span style={{ color: "var(--accent-bright)" }}>
                Make yours count.
              </span>
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.65)",
                maxWidth: 440,
                margin: 0,
              }}
            >
              Snap a photo of any environmental issue and our AI will route it
              directly to the responsible agency. Track the resolution in real
              time.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link
                href="/report"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  borderRadius: 12,
                  background: "#2ee6c8",
                  color: "#0d1a12",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#40f0d4";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2ee6c8";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Submit a Report <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/laws"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  borderRadius: 12,
                  background: "transparent",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(46,230,200,0.4)";
                  e.currentTarget.style.color = "var(--accent-bright)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = "#fff";
                }}
              >
                Browse Environmental Laws
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── ERROR BANNER ─────────────────────────────────── */}
      {error && (
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 40px" }}>
          <div
            className="rounded-xl p-4"
            style={{
              background: "color-mix(in srgb, #ef4444 8%, var(--panel))",
              border: "1px solid color-mix(in srgb, #ef4444 20%, var(--border))",
              fontFamily: "monospace",
              fontSize: 12,
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            Some impact data could not be loaded. Showing cached or partial results.
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
