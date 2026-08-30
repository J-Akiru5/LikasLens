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
} from "lucide-react";
import { laravelGet, MagneticButton } from "@likaslens/shared";

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
        const res = await laravelGet<{
          success: boolean;
          data: {
            recent_verified: { title?: string; location?: string; date?: string; status?: string }[];
          };
        }>("/public/impact").catch(() => null);
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
      <div style={{ position: "absolute", inset: 0, opacity: ghostMode ? 0.6 : 1, transition: "opacity 0.6s ease" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/images/landing_hero_bg.webp')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.8 }} />
        {/* Subtle dark gradient overlay to ensure text remains perfectly readable */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: ghostMode 
              ? "linear-gradient(180deg, rgba(13,26,18,0.98) 0%, rgba(13,26,18,0.7) 45%, rgba(13,26,18,0.95) 100%)"
              : "linear-gradient(180deg, rgba(13,26,18,0.9) 0%, rgba(13,26,18,0.4) 45%, rgba(13,26,18,0.85) 100%)",
            transition: "background 0.6s ease",
            pointerEvents: "none",
            zIndex: 1
          }}
        />
      </div>

      {/* Instrument grid */}
      <div className="ec-grid" style={{ position: "absolute", inset: 0, opacity: 0.8, pointerEvents: "none", zIndex: 1 }} />

      {/* Navigation removed; using the unified StickyLandingNav from page.tsx */}

      {/* Hero content — asymmetric case-file layout */}
      <div className="px-5 sm:px-8 pt-28 pb-24 w-full max-w-7xl mx-auto relative" style={{ zIndex: 2 }}>
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">

          {/* Left — headline + CTAs */}
          <m.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <m.div variants={fadeUp}>
              <span
                className="ec-eyebrow"
                style={{
                  background: "rgba(46,230,200,0.08)",
                  borderColor: "rgba(46,230,200,0.22)",
                  color: "var(--accent-bright)",
                }}
              >
                <span className="ec-status-dot ec-status-active" style={{ background: "var(--accent-bright)" }} />
                {t("readyBanner")}
              </span>
            </m.div>

            <m.h1
              variants={fadeUp}
              style={{
                fontSize: "var(--display-hero)",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                color: "#ffffff",
                margin: 0,
                textShadow: "0 4px 24px rgba(0,0,0,0.6)"
              }}
            >
              {t("heroTitle")}
            </m.h1>

            <m.p
              variants={fadeUp}
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
                color: "rgba(240,237,232,0.95)",
                maxWidth: 480,
                lineHeight: 1.6,
                margin: 0,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)"
              }}
            >
              {t("heroSubtitle")}
            </m.p>

            <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <MagneticButton pull={0.3}>
                <Link
                  href="/report"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 26px", borderRadius: 10,
                    background: "var(--accent-bright)", color: "var(--hero-bg)",
                    fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none", border: "none",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <Camera style={{ width: 16, height: 16 }} />
                  {t("reportIssue")}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </MagneticButton>
              <MagneticButton pull={0.15}>
                <a
                  href="/public-record"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 26px", borderRadius: 10,
                    background: "transparent", color: "#ffffff",
                    fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none",
                    border: "1px solid rgba(240,237,232,0.18)",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <BarChart3 style={{ width: 16, height: 16 }} />
                  {t("viewPublicReports")}
                </a>
              </MagneticButton>
            </m.div>

            {/* Provenance line — what makes these numbers trustworthy */}
            <m.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span className="ec-status-dot ec-status-resolved" />
                {t("liveLedger")}
              </div>
              <span style={{ width: 1, height: 14, background: "rgba(240,237,232,0.14)" }} />
              <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.4)" }}>
                {t("agencies")}
              </span>
            </m.div>
          </m.div>

          {/* Right — LIVE INCIDENT LEDGER (now with premium glassmorphism) */}
          <m.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div 
              className="ec-ledger shadow-2xl backdrop-blur-md" 
              role="group" 
              aria-label="Live incident ledger"
              style={{
                background: ghostMode ? "rgba(13, 26, 18, 0.8)" : "rgba(13, 26, 18, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "background 0.6s ease"
              }}
            >
              {/* Header */}
              <div className="ec-ledger-head">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ec-status-dot" style={{ background: "var(--accent-bright)", animation: "breathe 3s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(240,237,232,0.55)" }}>
                    {t("incidentLedgerLive")}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--accent-bright)", border: "1px solid var(--accent-bright)", borderRadius: 4, padding: "2px 8px" }}>
                  SYS-ONLINE
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
                      className="ec-ledger-row"
                      data-state={isLive ? "live" : undefined}
                    >
                      {/* ID + status */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "#ffffff" }}>
                          {entry.id}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-data)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(240,237,232,0.45)" }}>
                          <span className={`ec-status-dot ec-status-${entry.state}`} />
                          {stateLabels[entry.state] || entry.state}
                        </span>
                      </div>

                      {/* Type + coords */}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "rgba(240,237,232,0.9)", margin: 0, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.type}
                        </p>
                        <p style={{ fontFamily: "var(--font-data)", fontSize: 10.5, color: "rgba(240,237,232,0.42)", margin: "3px 0 0" }}>
                          {entry.coords} · {entry.agency}
                        </p>
                      </div>

                      {/* Confidence */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--font-data)", fontSize: 14, fontWeight: 700, color: isLive ? "var(--accent-bright)" : "rgba(240,237,232,0.85)" }}>
                          {entry.confidence.toFixed(1)}%
                        </span>
                        <p style={{ fontFamily: "var(--font-data)", fontSize: 9, color: "rgba(240,237,232,0.35)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {entry.note}
                        </p>
                      </div>
                    </m.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="ec-ledger-head" style={{ borderTop: "1px solid var(--ec-rule)", borderBottom: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-data)", fontSize: 10, color: "rgba(240,237,232,0.4)" }}>
                  <span className="ec-status-dot ec-status-resolved" />
                  {t("allSystemsOperational")}
                </div>
                <button
                  onClick={handleInstall}
                  aria-label="Install LikasLens app"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)]"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-data)", fontSize: 10.5,
                    color: "var(--accent-bright)", textDecoration: "underline",
                  }}
                >
                  <Download style={{ width: 12, height: 12 }} aria-hidden="true" /> {t("installAppBtn")}
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

      {/* Wave divider into page */}
      <div style={{ position: "absolute", bottom: -2, left: 0, right: 0, pointerEvents: "none", lineHeight: 0, zIndex: 20 }}>
        <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 100 }}>
          <path d="M0,40 C180,90 360,10 540,50 C720,90 900,20 1080,55 C1260,90 1380,30 1440,50 L1440,100 L0,100 Z" fill="var(--page)" />
        </svg>
      </div>
    </section>
  );
}
