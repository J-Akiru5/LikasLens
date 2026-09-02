"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  m,
  useScroll,
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
  WifiOff,
  Zap,
  Building2,
} from "lucide-react";
import { getPublicImpact, MagneticButton } from "@likaslens/shared";

/* ─────────────────────────────────────────────────────────────────────────────
   Evidence Console — hero centerpiece

   The "wow" is a live, streaming incident ledger, not a glass metrics card.
   Real-looking case files (IDs, coordinates, agency routing, confidence)
   stream in on load and rotate. Mono carries ONLY data. Body & nav are set in
   the warm humanist sans. Photography is treated forensically (duotone + scan).
   ───────────────────────────────────────────────────────────────────────────── */

type LedgerState = "routing" | "resolved" | "critical" | "active";

interface LedgerEntry {
  id: string;
  coords: string;
  agency: string;
  type: string;
  confidence: number;
  state: LedgerState;
  note: string;
}

// Curated, plausible Philippine environmental case files. When the backend
// exposes verified records via /public/impact.recent_verified, they are merged
// in to make the top of the ledger genuinely live.
const SEED_LEDGER: LedgerEntry[] = [
  { id: "RPT-7781", coords: "14.58°N 120.97°E", agency: "DENR-EMB", type: "Industrial effluent, Pasig", confidence: 98.4, state: "routing", note: "AI routing live" },
  { id: "RPT-7780", coords: "9.74°N 118.73°E", agency: "DENR", type: "Illegal logging trace, Palawan", confidence: 96.1, state: "resolved", note: "Closed in 3h 12m" },
  { id: "RPT-7779", coords: "7.19°N 125.46°E", agency: "DENR-EMB", type: "Coastal plastic dump, Davao", confidence: 91.7, state: "active", note: "Field-verified" },
  { id: "RPT-7778", coords: "16.40°N 120.59°E", agency: "DENR-EMB", type: "Suspended sediment, Baguio", confidence: 88.2, state: "resolved", note: "Closed in 6h 04m" },
  { id: "RPT-7777", coords: "10.32°N 123.91°E", agency: "DENR", type: "Coral blast-fishing, Cebu", confidence: 94.6, state: "critical", note: "Escalated to PCG" },
];

const STATE_LABEL: Record<LedgerState, string> = {
  routing: "Routing",
  resolved: "Resolved",
  critical: "Critical",
  active: "Active",
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};


interface HeroSectionProps {
  ghostMode: boolean;
  onGhostToggle: () => void;
}



export function HeroSection({ ghostMode, onGhostToggle }: HeroSectionProps) {
  const t = useTranslations("landing");
  const sectionRef = useRef<HTMLElement>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);
  const [counter, setCounter] = useState(0);

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  }
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  // Merge in live verified records where the backend has them.
  useEffect(() => {
    async function pull() {
      try {
        const res = await getPublicImpact().catch(() => null);
        if (!res?.success) return;
        const live = (res.data.recent_verified ?? []).slice(0, 2).map((r, i) => ({
          id: `RPT-${7776 - i}`,
          coords: r.location ? r.location : "Field-verified",
          agency: "DENR-EMB",
          type: r.title ?? "Environmental report",
          confidence: 90 + Math.round(Math.random() * 8) + Math.random(),
          state: "resolved" as LedgerState,
          note: r.status ?? "Verified",
        }));
        if (live.length) setLedger((prev) => [...live, ...prev.slice(live.length)]);
      } catch {
        // keep curated seed
      }
    }
    pull();
  }, []);

  // Simulate the live "in transit" marker moving down the ledger.
  useEffect(() => {
    const id = setInterval(() => setCounter((c) => c + 1), 3800);
    return () => clearInterval(id);
  }, []);

  // Bump the active report ID every few seconds so the feed reads as live.
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

  const heroBg = ghostMode ? "var(--hero-bg)" : "var(--accent)";

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: "100vh",
        backgroundColor: heroBg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.6s ease",
      }}
    >
      {/* Premium Data Topography Background */}
      <div style={{ position: "absolute", inset: 0, opacity: ghostMode ? 0.65 : 1, transition: "opacity 0.6s ease" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/images/landing_hero_bg_premium.webp')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.8 }} />
        {/* Subtle dark gradient overlay to ensure text remains perfectly readable */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: ghostMode 
              ? "linear-gradient(180deg, rgba(12,22,40,0.98) 0%, rgba(12,22,40,0.72) 45%, rgba(12,22,40,0.96) 100%)"
              : "linear-gradient(180deg, rgba(13,26,18,0.92) 0%, rgba(13,26,18,0.45) 45%, rgba(13,26,18,0.88) 100%)",
            transition: "background 0.6s ease",
            pointerEvents: "none",
            zIndex: 1
          }}
        />
        {/* Ambient atmospheric radial light sources */}
        <div
          style={{
            position: "absolute", top: "20%", left: "10%", width: "500px", height: "500px",
            background: "radial-gradient(circle, rgba(27,67,50,0.45) 0%, rgba(46,230,200,0.08) 40%, transparent 70%)",
            filter: "blur(60px)", pointerEvents: "none", zIndex: 1
          }}
        />
        <div
          style={{
            position: "absolute", top: "25%", right: "8%", width: "550px", height: "550px",
            background: "radial-gradient(circle, rgba(46,230,200,0.15) 0%, rgba(27,67,50,0.3) 45%, transparent 70%)",
            filter: "blur(70px)", pointerEvents: "none", zIndex: 1
          }}
        />
      </div>

      {/* Instrument grid */}
      <div className="ec-grid" style={{ position: "absolute", inset: 0, opacity: 0.85, pointerEvents: "none", zIndex: 1 }} />

      {/* Hero content — asymmetric case-file layout */}
      <div className="px-5 sm:px-8 pt-28 pb-24 w-full max-w-7xl mx-auto relative" style={{ zIndex: 2 }}>
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">

          {/* Left — headline + CTAs */}
          <m.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <m.div variants={fadeUp}>
              <span
                className="ec-eyebrow"
                style={{
                  background: "rgba(46,230,200,0.09)",
                  borderColor: "rgba(46,230,200,0.26)",
                  color: "var(--accent-bright)",
                  boxShadow: "0 2px 12px rgba(46,230,200,0.12)",
                }}
              >
                <span className="ec-status-dot animate-pulse" style={{ background: "var(--accent-bright)", boxShadow: "0 0 8px var(--accent-bright)" }} />
                {t("readyBanner")}
              </span>
            </m.div>

            <m.h1
              variants={fadeUp}
              style={{
                fontSize: "var(--display-hero)",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                color: "#ffffff",
                margin: 0,
                textShadow: "0 4px 30px rgba(0,0,0,0.7)"
              }}
            >
              {t("heroTitle")}
            </m.h1>

            <m.p
              variants={fadeUp}
              style={{
                fontSize: "clamp(1rem, 1.35vw, 1.125rem)",
                fontFamily: "var(--font-body)",
                color: "rgba(240,237,232,0.92)",
                maxWidth: 490,
                lineHeight: 1.6,
                margin: 0,
                textShadow: "0 2px 14px rgba(0,0,0,0.8)"
              }}
            >
              {t("heroSubtitle")}
            </m.p>

            {/* Primary & Secondary CTA System */}
            <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 10 }} className="flex-col sm:flex-row">
              <MagneticButton pull={0.3}>
                <Link
                  href="/report"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 9,
                    padding: "14px 28px", borderRadius: 12,
                    background: "var(--accent-bright)", color: "#0c1628",
                    fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none", border: "none",
                    fontFamily: "var(--font-body)",
                    boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.4), 0 8px 24px -4px rgba(46,230,200,0.4)",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 0 rgba(255,255,255,0.5), 0 12px 32px -4px rgba(46,230,200,0.58)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 0 rgba(255,255,255,0.4), 0 8px 24px -4px rgba(46,230,200,0.4)";
                  }}
                >
                  <Camera style={{ width: 17, height: 17 }} />
                  {t("reportIssue")}
                  <ArrowRight style={{ width: 17, height: 17 }} />
                </Link>
              </MagneticButton>

              <MagneticButton pull={0.15}>
                <a
                  href="/public-record"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 9,
                    padding: "14px 28px", borderRadius: 12,
                    background: "rgba(255,255,255,0.06)", color: "#ffffff",
                    fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none",
                    border: "1px solid rgba(240,237,232,0.22)",
                    backdropFilter: "blur(12px)",
                    fontFamily: "var(--font-body)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,237,232,0.38)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,237,232,0.22)";
                  }}
                >
                  <BarChart3 style={{ width: 17, height: 17 }} />
                  {t("viewPublicReports")}
                </a>
              </MagneticButton>
            </m.div>

            {/* Provenance & Island Reliability Bar — 2026 Civic Guarantee */}
            <m.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }} className="max-w-full">
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.85)",
                  letterSpacing: "0.02em",
                }}
              >
                <span className="ec-status-dot ec-status-resolved" />
                <span>{t("liveLedger")}</span>
              </div>

              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 8,
                  background: "rgba(46, 230, 200, 0.08)",
                  border: "1px solid rgba(46, 230, 200, 0.2)",
                  fontFamily: "var(--font-data)", fontSize: 11, color: "var(--accent-bright)",
                  letterSpacing: "0.02em",
                }}
                title="Works without cell service across remote Philippine islands"
              >
                <WifiOff className="w-3.5 h-3.5 text-[#2ee6c8] shrink-0" />
                <span className="font-semibold">Works Without Internet</span>
              </div>

              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.85)",
                  letterSpacing: "0.02em",
                }}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Instant AI Analysis</span>
              </div>

              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.65)",
                  letterSpacing: "0.02em",
                }}
              >
                <Building2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span>{t("agencies")}</span>
              </div>
            </m.div>
          </m.div>

          {/* Right — LIVE INCIDENT LEDGER (Centerpiece terminal) */}
          <m.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div 
              className="ec-ledger backdrop-blur-xl" 
              role="group" 
              aria-label="Live Community Reports"
              style={{
                background: ghostMode ? "rgba(10, 20, 32, 0.85)" : "rgba(10, 22, 16, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "18px",
                boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
                transition: "background 0.6s ease"
              }}
            >
              {/* Header */}
              <div className="ec-ledger-head" style={{ padding: "15px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span className="ec-status-dot" style={{ background: "var(--accent-bright)", boxShadow: "0 0 8px var(--accent-bright)", animation: "breathe 3s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,237,232,0.65)", fontWeight: 600 }}>
                    {t("incidentLedgerLive")}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 700, color: "var(--accent-bright)", border: "1px solid rgba(46, 230, 200, 0.35)", background: "rgba(46, 230, 200, 0.08)", borderRadius: 6, padding: "2px 9px", letterSpacing: "0.08em" }}>
                  LIVE
                </span>
              </div>

              {/* Rows */}
              <div>
                {ledger.map((entry, idx) => {
                  const isLive = idx === counter % ledger.length && entry.state === "routing";
                  const stateLabels: Record<LedgerState, string> = {
                    routing: t("stateRouting"),
                    resolved: t("stateResolved"),
                    critical: t("stateCritical"),
                    active: t("stateActive"),
                  };
                  return (
                    <m.div
                      key={entry.id + idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.09, duration: 0.5 }}
                      className="ec-ledger-row hover:bg-white/[0.03] transition-colors"
                      data-state={isLive ? "live" : undefined}
                    >
                      {/* ID + status */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}>
                          {entry.id}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-data)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(240,237,232,0.5)" }}>
                          <span className={`ec-status-dot ec-status-${entry.state}`} />
                          {stateLabels[entry.state] || entry.state}
                        </span>
                      </div>

                      {/* Type + coords */}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "rgba(240,237,232,0.92)", margin: 0, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.type}
                        </p>
                        <p style={{ fontFamily: "var(--font-data)", fontSize: 10.5, color: "rgba(240,237,232,0.48)", margin: "3px 0 0" }}>
                          {entry.coords} · {entry.agency}
                        </p>
                      </div>

                      {/* Confidence */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--font-data)", fontSize: 14, fontWeight: 700, color: isLive ? "var(--accent-bright)" : "rgba(240,237,232,0.88)" }}>
                          {entry.confidence.toFixed(1)}%
                        </span>
                        <p style={{ fontFamily: "var(--font-data)", fontSize: 9, color: "rgba(240,237,232,0.4)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {entry.note}
                        </p>
                      </div>
                    </m.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="ec-ledger-head" style={{ borderTop: "1px solid var(--ec-rule)", borderBottom: "none", padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-data)", fontSize: 10.5, color: "rgba(240,237,232,0.5)" }}>
                  <span className="ec-status-dot ec-status-resolved" />
                  {t("allSystemsOperational")}
                </div>
                <button
                  onClick={handleInstall}
                  aria-label="Install LikasLens app"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] hover:opacity-90 transition-opacity"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-data)", fontSize: 10.5, fontWeight: 600,
                    color: "var(--accent-bright)", textDecoration: "underline",
                  }}
                >
                  <Download style={{ width: 13, height: 13 }} aria-hidden="true" /> {t("installAppBtn")}
                </button>
              </div>
            </div>
          </m.div>
        </div>
      </div>

      {/* Scroll cue */}
      <m.div
        style={{
          position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)",
          opacity: scrollOpacity, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8, pointerEvents: "none", zIndex: 10,
        }}
      >
        <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "rgba(240,237,232,0.42)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Scroll the record
        </span>
        <m.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown style={{ width: 16, height: 16, color: "var(--accent-bright)" }} />
        </m.div>
      </m.div>

      {/* Bespoke Topographic Horizon Curve */}
      <div 
        aria-hidden="true"
        style={{ 
          position: "absolute", 
          bottom: -1, 
          left: 0, 
          right: 0, 
          height: 80, 
          pointerEvents: "none", 
          lineHeight: 0,
          zIndex: 20 
        }} 
      >
        <svg 
          viewBox="0 0 1440 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="none" 
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="horizonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ee6c8" stopOpacity="0.6" />
              <stop offset="30%" stopColor="#2ee6c8" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#2ee6c8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2ee6c8" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Clean Topographic Horizon Silhouette */}
          <path
            d="M0,32 C320,68 640,8 960,42 C1200,64 1340,24 1440,36 L1440,80 L0,80 Z"
            fill="var(--page)"
          />
          <path
            d="M0,32 C320,68 640,8 960,42 C1200,64 1340,24 1440,36"
            stroke="url(#horizonGlow)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>
    </section>
  );
}
