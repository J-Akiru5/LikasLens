"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  m,
  useScroll,
  useMotionValueEvent,
  useTransform,
  Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  Camera,
  BarChart3,
  Download,
  Fingerprint,
  Leaf,
} from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import { laravelGet, MagneticButton } from "@likaslens/shared";

interface LiveMetric {
  label: string;
  value: string;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const wordAnimation: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

interface HeroSectionProps {
  ghostMode: boolean;
  onGhostToggle: () => void;
}

export function HeroSection({ ghostMode, onGhostToggle }: HeroSectionProps) {
  const [metricIndex, setMetricIndex] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([
    { label: "Reports Today", value: "—" },
    { label: "Resolved", value: "—" },
    { label: "Active Cases", value: "—" },
    { label: "Avg Response", value: "—" },
  ]);

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  }
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavScrolled(latest > 40);
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const statsData = await laravelGet<{ success: boolean; data: { active_incidents: number; resolved_today: number; avg_response_hours: number; total_reports: number } }>("/dashboard/stats").catch(() => null);
        if (!statsData?.success) return;
        const s = statsData.data;
        const avgResponse = s.avg_response_hours < 24 ? `${Math.round(s.avg_response_hours)}h` : `${Math.round(s.avg_response_hours / 24)}d`;
        setLiveMetrics([
          { label: "Total Reports", value: (s.total_reports ?? 0).toLocaleString() },
          { label: "Resolved", value: (s.resolved_today ?? 0).toLocaleString() },
          { label: "Active Cases", value: (s.active_incidents ?? 0).toLocaleString() },
          { label: "Avg Response", value: avgResponse },
        ]);
      } catch {
        // Keep placeholder values
      }
    }
    fetchMetrics();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricIndex((i) => (i + 1) % liveMetrics.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [liveMetrics.length]);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") setInstallPrompt(null);
    } else {
      document.getElementById("install-guide")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      style={{
        minHeight: "100svh",
        backgroundColor: ghostMode ? "var(--hero-bg)" : "var(--accent)",
        backgroundImage: ghostMode
          ? `
            radial-gradient(ellipse 70% 60% at 10% 10%, rgba(46,230,200,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 80% 70% at 90% 20%, rgba(6,16,30,0.8) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 90%, rgba(46,230,200,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 0% 80%, rgba(12,22,40,0.5) 0%, transparent 55%)
          `
          : `
            radial-gradient(ellipse 70% 60% at 10% 10%, rgba(46,230,200,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 80% 70% at 90% 20%, rgba(13,40,22,0.7) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 90%, rgba(46,230,200,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 0% 80%, rgba(45,106,79,0.35) 0%, transparent 55%)
          `,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.6s ease",
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

      {/* Navigation */}
      <m.nav
        className={navScrolled ? "px-4 sm:px-6 py-3" : "px-4 sm:px-6 py-4 sm:py-5"}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: navScrolled ? "rgba(22,52,34,0.92)" : "transparent",
          backdropFilter: navScrolled ? "blur(20px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
          transition: "all 0.3s ease",
        }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span
            style={{
              fontSize: 20,
              letterSpacing: "0.2em",
              color: "var(--hero-ink)",
              display: "flex",
              alignItems: "center",
              marginTop: 2,
              fontFamily: "var(--font-heading), sans-serif",
              textTransform: "uppercase",
            }}
          >
            <span style={{ fontWeight: 500 }}>LIK</span>
            <span style={{ fontWeight: 600, margin: "0 1px" }}>Λ</span>
            <span style={{ fontWeight: 500, marginRight: 4 }}>S</span>
            <span style={{ fontWeight: 800 }}>LENS</span>
          </span>
        </div>

        <div
          className="hidden md:flex brightness-0 invert drop-shadow-sm"
          style={{
            gap: 32,
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,237,232,0.5)",
          }}
        >
          {[
            { label: "Features", href: "#how-it-works" },
            { label: "Records", href: "#scoreboard" },
            { label: "Impact", href: "#impact" },
            { label: "Ghost Mode", href: "#ghost" },
          ].map((item) => (
            <a key={item.label} href={item.href} className="hover:text-white transition-colors" style={{ color: "inherit", textDecoration: "none" }}>
              {item.label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onGhostToggle}
            aria-label={ghostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}
            className="hidden sm:flex relative items-center h-8 w-[88px] rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hero-bg)]"
            style={{
              background: ghostMode ? "rgba(46, 230, 200, 0.1)" : "rgba(240, 237, 232, 0.05)",
              border: ghostMode ? "1px solid rgba(46, 230, 200, 0.2)" : "1px solid rgba(240, 237, 232, 0.1)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
            }}
            title="Toggle Ghost Mode"
          >
            <div
              className={`absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300 flex items-center justify-center z-10 ${
                ghostMode ? "translate-x-14" : "translate-x-0"
              }`}
              style={{
                background: ghostMode ? "var(--accent-bright)" : "rgba(240, 237, 232, 0.9)",
              }}
            >
              {ghostMode ? (
                <Fingerprint style={{ width: 14, height: 14, color: "var(--hero-bg)" }} />
              ) : (
                <Leaf style={{ width: 14, height: 14, color: "#0d1a12" }} />
              )}
            </div>
            
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none text-[10px] font-mono font-bold tracking-widest uppercase">
              <span className="transition-opacity duration-300" style={{ opacity: ghostMode ? 1 : 0, color: "var(--hero-ink)" }}>
                Ghost
              </span>
              <span className="transition-opacity duration-300" style={{ opacity: ghostMode ? 0 : 1, color: "rgba(240, 237, 232, 0.4)" }}>
                Civic
              </span>
            </div>
          </button>
          <UserNav invert />
        </div>
      </m.nav>

      {/* Hero Content */}
      <div
        className="px-4 sm:px-8 pt-24 pb-20 w-full max-w-7xl mx-auto"
        style={{
        }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <m.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 32 }}
          >
            <m.div variants={fadeUp}>
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
                <span
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--accent-bright)",
                    display: "inline-block",
                    animation: "breathe 3s ease-in-out infinite",
                  }}
                />
                Civic Environmental Intelligence · 2026
              </span>
            </m.div>

            <m.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <m.h1
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                style={{
                  fontSize: "clamp(2.8rem, 6vw, 5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.04,
                  color: "var(--hero-ink)",
                  margin: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.25em"
                }}
              >
                {["The", "Environment", "Needs", "a"].map((word, i) => (
                  <m.span key={i} variants={wordAnimation} style={{ display: "inline-block" }}>
                    {word}
                  </m.span>
                ))}
                <m.span
                  variants={wordAnimation}
                  style={{
                    background: "linear-gradient(135deg, var(--accent-bright) 0%, #5aefb0 50%, #a8f5d0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "inline-block"
                  }}
                >
                  Witness.
                </m.span>
              </m.h1>
              <p
                style={{
                  fontSize: 17,
                  color: "rgba(240,237,232,0.55)",
                  maxWidth: 480,
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Snap. Report. Watch it get fixed. LikasLens connects citizens
                directly to government agencies through AI-powered
                environmental reporting.
              </p>
            </m.div>

            {/* CTAs */}
            <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <MagneticButton pull={0.3}>
                <Link
                  href="/report"
                  className="group"
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
                >
                  <Camera style={{ width: 16, height: 16 }} />
                  Report an Issue <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </MagneticButton>
              <MagneticButton pull={0.15}>
                <a
                  href="#scoreboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 28px",
                    borderRadius: 12,
                    background: "transparent",
                    color: "var(--hero-ink)",
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                    border: "1px solid rgba(240,237,232,0.12)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <BarChart3 style={{ width: 16, height: 16 }} /> See Public Records
                </a>
              </MagneticButton>
            </m.div>
          </m.div>

          {/* Right — Live Metrics Card */}
          <m.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="animate-float"
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(240,237,232,0.07)",
                borderRadius: 16,
                backdropFilter: "blur(20px)",
                padding: 24,
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-bright)", display: "block", animation: "breathe 3s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,237,232,0.45)" }}>
                    LikasLens · Live
                  </span>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.4)", border: "1px solid rgba(240,237,232,0.1)", borderRadius: 4, padding: "2px 8px" }}>
                  SYS-ONLINE
                </span>
              </div>

              {/* Metrics */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {liveMetrics.map((metric, idx) => (
                  <m.div
                    key={metric.label}
                    animate={{ opacity: idx === metricIndex ? 1 : 0.3 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: idx < liveMetrics.length - 1 ? "1px solid rgba(240,237,232,0.06)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {metric.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 22,
                        fontWeight: 700,
                        color: idx === metricIndex ? "var(--accent-bright)" : "var(--hero-ink)",
                        transition: "color 0.4s ease",
                      }}
                    >
                      {metric.value}
                    </span>
                  </m.div>
                ))}
              </div>

              {/* Pipeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,237,232,0.35)", margin: 0 }}>
                  AI Routing Pipeline
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {["Capture", "Classify", "Route", "Notify"].map((step, i) => (
                    <div key={step} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ height: 6, borderRadius: 9999, background: "rgba(46,230,200,0.15)", overflow: "hidden" }}>
                          <m.div
                            style={{ height: "100%", borderRadius: 9999, background: "var(--accent-bright)" }}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.2, delay: 0.8 + i * 0.3, ease: "easeOut" }}
                          />
                        </div>
                        <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(240,237,232,0.35)", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {step}
                        </p>
                      </div>
                      {i < 3 && <ArrowRight style={{ width: 10, height: 10, color: "rgba(240,237,232,0.3)", flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(240,237,232,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.35)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-bright)" }} />
                  All systems operational
                </div>
                <button
                  onClick={handleInstall}
                  aria-label="Install LikasLens app"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hero-bg)]"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "monospace", fontSize: 10,
                    color: "var(--accent-bright)", textDecoration: "underline",
                  }}
                >
                  <Download style={{ width: 12, height: 12 }} aria-hidden="true" /> Install App
                </button>
              </div>
            </div>
          </m.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <m.div
        style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
          opacity: scrollOpacity, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8, pointerEvents: "none", zIndex: 10,
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.4)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Scroll
        </span>
        <m.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown style={{ width: 16, height: 16, color: "var(--accent-bright)" }} />
        </m.div>
      </m.div>

      {/* Wave divider */}
      <div style={{ position: "absolute", bottom: -2, left: 0, right: 0, pointerEvents: "none", lineHeight: 0 }}>
        <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 100, transition: "fill 0.6s ease" }}>
          <path d="M0,40 C180,90 360,10 540,50 C720,90 900,20 1080,55 C1260,90 1380,30 1440,50 L1440,100 L0,100 Z" fill="var(--page)" style={{ transition: "fill 0.6s ease" }} />
        </svg>
      </div>
    </section>
  );
}
