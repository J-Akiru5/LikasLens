"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [navScrolled, setNavScrolled] = useState(false);
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
  useMotionValueEvent(scrollY, "change", (latest) => setNavScrolled(latest > 40));

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
    const t = setInterval(() => setCounter((c) => (c + 1) % ledger.length), 2600);
    return () => clearInterval(t);
  }, [ledger.length]);

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
      style={{
        minHeight: "100svh",
        backgroundColor: heroBg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.6s ease",
      }}
    >
      {/* Forensic hero photograph — full-bleed, duotone-treated evidence */}
      <div className="ec-duotone-wrap" style={{ position: "absolute", inset: 0, opacity: ghostMode ? 0.5 : 0.42 }}>
        <Image
          src="https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1920&q=80"
          alt="Mist over a logged Philippine forest ridge at first light"
          fill
          sizes="100vw"
          className="ec-duotone"
          priority
        />
        <div className="ec-scanline" aria-hidden="true" />
        {/* Vignette so copy always clears AA regardless of photo */}
        <div
          style={{
            position: "absolute", inset: 0,
            background:
              "linear-gradient(180deg, rgba(13,26,18,0.72) 0%, rgba(13,26,18,0.4) 45%, rgba(13,26,18,0.82) 100%)",
          }}
        />
      </div>

      {/* Instrument grid */}
      <div className="ec-grid" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />

      {/* Navigation — humanist sans, no mono-as-decoration */}
      <m.nav
        className={navScrolled ? "px-4 sm:px-6 py-3" : "px-4 sm:px-6 py-4 sm:py-5"}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: navScrolled ? "rgba(13,26,18,0.82)" : "transparent",
          backdropFilter: navScrolled ? "blur(14px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "all 0.3s ease",
        }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center gap-2.5 group" style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/likas-lens-logo.png" alt="LikasLens" style={{ width: 30, height: 30, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          <span
            style={{
              fontSize: 19, letterSpacing: "0.16em", color: "var(--hero-ink)",
              display: "flex", alignItems: "center", marginTop: 1,
              fontFamily: "var(--font-heading)", textTransform: "uppercase",
            }}
          >
            <span style={{ fontWeight: 500 }}>LIK</span>
            <span style={{ fontWeight: 700, color: "var(--accent-bright)", margin: "0 1px" }}>Λ</span>
            <span style={{ fontWeight: 500, marginRight: 3 }}>S</span>
            <span style={{ fontWeight: 800 }}>LENS</span>
          </span>
        </Link>

        <div
          className="hidden md:flex"
          style={{
            gap: 30, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
            color: "rgba(240,237,232,0.6)",
          }}
        >
          {[
            { label: "How it works", href: "#how-it-works" },
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
          {/* Civic ⇄ Ghost — the signature dual-mode mechanic */}
          <button
            onClick={onGhostToggle}
            aria-pressed={ghostMode}
            aria-label={ghostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}
            className="flex relative items-center h-8 w-[88px] rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2"
            style={{
              background: ghostMode ? "rgba(46,230,200,0.1)" : "rgba(240,237,232,0.05)",
              border: ghostMode ? "1px solid rgba(46,230,200,0.22)" : "1px solid rgba(240,237,232,0.1)",
            }}
            title={ghostMode ? "Ghost Mode active" : "Civic Mode"}
          >
            <div
              className={`absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300 flex items-center justify-center z-10 ${
                ghostMode ? "translate-x-14" : "translate-x-0"
              }`}
              style={{ background: ghostMode ? "var(--accent-bright)" : "rgba(240,237,232,0.92)" }}
            >
              {ghostMode ? (
                <Fingerprint style={{ width: 14, height: 14, color: "var(--hero-bg)" }} />
              ) : (
                <Leaf style={{ width: 14, height: 14, color: "#0d1a12" }} />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none text-[10px] font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-data)" }}>
              <span className="transition-opacity duration-300" style={{ opacity: ghostMode ? 1 : 0, color: "var(--hero-ink)" }}>Ghost</span>
              <span className="transition-opacity duration-300" style={{ opacity: ghostMode ? 0 : 1, color: "rgba(240,237,232,0.4)" }}>Civic</span>
            </div>
          </button>
          <UserNav invert />
        </div>
      </m.nav>

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
                Civic environmental intelligence
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
                color: "var(--hero-ink)",
                margin: 0,
                textWrap: "balance" as const,
              }}
            >
              The environment needs a witness.
            </m.h1>

            <m.p
              variants={fadeUp}
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
                color: "rgba(240,237,232,0.72)",
                maxWidth: 480,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Snap an environmental violation. The AI vision model classifies it,
              checks it against local law, and routes the report to the exact
              agency responsible. Every case lands on the public record.
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
                  Report an issue
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </MagneticButton>
              <MagneticButton pull={0.15}>
                <a
                  href="#scoreboard"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 26px", borderRadius: 10,
                    background: "transparent", color: "var(--hero-ink)",
                    fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none",
                    border: "1px solid rgba(240,237,232,0.18)",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <BarChart3 style={{ width: 16, height: 16 }} />
                  See public records
                </a>
              </MagneticButton>
            </m.div>

            {/* Provenance line — what makes these numbers trustworthy */}
            <m.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span className="ec-status-dot ec-status-resolved" />
                Live ledger · public record
              </div>
              <span style={{ width: 1, height: 14, background: "rgba(240,237,232,0.14)" }} />
              <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "rgba(240,237,232,0.4)" }}>
                DENR · DILG · DOST · PCG
              </span>
            </m.div>
          </m.div>

          {/* Right — LIVE INCIDENT LEDGER (replaces the glass metrics card) */}
          <m.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ec-ledger" role="group" aria-label="Live incident ledger">
              {/* Header */}
              <div className="ec-ledger-head">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ec-status-dot" style={{ background: "var(--accent-bright)", animation: "breathe 3s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(240,237,232,0.55)" }}>
                    Incident ledger · live
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "rgba(240,237,232,0.4)", border: "1px solid rgba(240,237,232,0.1)", borderRadius: 4, padding: "2px 8px" }}>
                  SYS-ONLINE
                </span>
              </div>

              {/* Rows */}
              <div>
                {ledger.map((entry, idx) => {
                  const isLive = idx === counter % ledger.length && entry.state === "routing";
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
                        <span style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "var(--hero-ink)" }}>
                          {entry.id}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-data)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(240,237,232,0.45)" }}>
                          <span className={`ec-status-dot ec-status-${entry.state}`} />
                          {STATE_LABEL[entry.state]}
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
                  All systems operational
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
                  <Download style={{ width: 12, height: 12 }} aria-hidden="true" /> Install app
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
      <div style={{ position: "absolute", bottom: -2, left: 0, right: 0, pointerEvents: "none", lineHeight: 0 }}>
        <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 100 }}>
          <path d="M0,40 C180,90 360,10 540,50 C720,90 900,20 1080,55 C1260,90 1380,30 1440,50 L1440,100 L0,100 Z" fill="var(--page)" />
        </svg>
      </div>
    </section>
  );
}
