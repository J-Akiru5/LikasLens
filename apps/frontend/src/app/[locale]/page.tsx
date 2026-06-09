"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import {
  Leaf,
  Fingerprint,
  ArrowRight,
  ArrowDown,
  Eye,
  Camera,
  Smartphone,
  Download,
  BarChart3,
  ShieldCheck,
  CheckCircle,
  Bot,
} from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import { PublicScoreboard, FaqSection } from "@likaslens/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface LiveMetric {
  label: string;
  value: string;
}

const HOW_IT_WORKS = [
  {
    step: "01",
    Icon: Camera,
    title: "Snap & Send",
    description:
      "Take a photo of illegal dumping, pollution, or any environmental issue. Upload directly from your phone — GPS coordinates are attached automatically.",
  },
  {
    step: "02",
    Icon: Bot,
    title: "AI Routes It",
    description:
      "Our YOLOv8-powered vision model identifies the issue type and severity, then intelligently dispatches the report to the exact government agency responsible.",
  },
  {
    step: "03",
    Icon: CheckCircle,
    title: "Track to Resolution",
    description:
      "Follow your report through every stage — received, under review, actioned. Get notified the moment it is resolved.",
  },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function Home() {
  const [ghostMode, setGhostMode] = useState(false);
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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavScrolled(latest > 40);
  });

  // Fetch live metrics from API
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [ticketsRes, leaderboardRes] = await Promise.all([
          fetch(`${API_URL}/tickets?per_page=50`),
          fetch(`${API_URL}/leaderboard`),
        ]);

        if (!ticketsRes.ok) return;
        const ticketsData = await ticketsRes.json();
        const meta = ticketsData?.meta;
        const tickets: Array<{ status: string; created_at: string; resolved_at?: string }> =
          ticketsData?.data ?? [];

        const total: number = meta?.total ?? tickets.length;
        const resolved = tickets.filter((t) => t.status?.toLowerCase() === "resolved").length;
        const active = tickets.filter(
          (t) => !["resolved", "closed"].includes(t.status?.toLowerCase() ?? "")
        ).length;

        // Avg response time in hours
        const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at);
        let avgResponse = "—";
        if (resolvedTickets.length > 0) {
          const avgMs =
            resolvedTickets.reduce((sum, t) => {
              return sum + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime());
            }, 0) / resolvedTickets.length;
          const hours = Math.round(avgMs / 1000 / 60 / 60);
          avgResponse = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
        }

        setLiveMetrics([
          { label: "Total Reports", value: total.toLocaleString() },
          { label: "Resolved", value: resolved.toLocaleString() },
          { label: "Active Cases", value: active.toLocaleString() },
          { label: "Avg Response", value: avgResponse },
        ]);
      } catch {
        // Keep placeholder values on network error
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

  useEffect(() => {
    // Sync with global theme on mount
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "ghost" && !ghostMode) {
      setGhostMode(true);
    }

    // Watch for theme changes triggered by other components (like the Sidebar)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const theme = document.documentElement.getAttribute("data-theme");
          if (theme === "ghost") {
            setGhostMode(true);
          } else if (theme === "civic" || theme === "" || theme === "light") {
            setGhostMode(false);
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // When the user clicks the toggle ON THIS PAGE, update the global attribute
    if (ghostMode) {
      document.documentElement.setAttribute("data-theme", "ghost");
      try { localStorage.setItem("likaslens-theme", "ghost"); } catch {}
    } else {
      // Don't override if it's explicitly set to civic somewhere else, just remove ghost
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "ghost") {
        document.documentElement.setAttribute("data-theme", "civic");
        try { localStorage.setItem("likaslens-theme", "civic"); } catch {}
      }
    }
  }, [ghostMode]);

  return (
    <main className="relative min-h-dvh" style={{ background: "var(--page)", color: "var(--ink)" }}>

      {/* ── NAVIGATION ─────────────────────────────────────── */}
      <motion.nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: navScrolled ? "12px 40px" : "20px 40px",
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
          <Leaf style={{ width: 20, height: 20, color: "#2ee6c8" }} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0ede8" }}>
            LikasLens
          </span>
        </div>

        <div
          className="hidden md:flex"
          style={{ gap: 32, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.5)" }}
        >
          <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f0ede8")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.5)")}
          >Features</a>
          <a href="#scoreboard" style={{ color: "inherit", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f0ede8")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.5)")}
          >Records</a>
          <a href="#ghost" style={{ color: "inherit", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f0ede8")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.5)")}
          >Ghost Mode</a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setGhostMode(!ghostMode)}
            className="hidden sm:flex"
            style={{
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: ghostMode ? "#facc15" : "rgba(240,237,232,0.5)",
              transition: "color 0.2s",
            }}
          >
            <Fingerprint style={{ width: 14, height: 14 }} />
            Ghost
          </button>
          <UserNav invert />
        </div>
      </motion.nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100svh",
          backgroundColor: ghostMode ? "#06101e" : "#1a3828",
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

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px 80px", width: "100%" }}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              <motion.div variants={fadeUp}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "4px 12px", borderRadius: 9999,
                  background: "rgba(46,230,200,0.1)", border: "1px solid rgba(46,230,200,0.2)",
                  fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#2ee6c8",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ee6c8", display: "inline-block", animation: "breathe 3s ease-in-out infinite" }} />
                  Civic Environmental Intelligence · 2026
                </span>
              </motion.div>

              <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h1 style={{
                  fontSize: "clamp(2.8rem, 6vw, 5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.04,
                  color: "#f0ede8",
                  margin: 0,
                }}>
                  The Environment{" "}
                  <br />
                  Needs a{" "}
                  <span style={{
                    background: "linear-gradient(135deg, #2ee6c8 0%, #5aefb0 50%, #a8f5d0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    Witness.
                  </span>
                </h1>
                <p style={{ fontSize: 17, color: "rgba(240,237,232,0.55)", maxWidth: 480, lineHeight: 1.65, margin: 0 }}>
                  Snap. Report. Watch it get fixed. LikasLens connects citizens directly to government agencies through AI-powered environmental reporting.
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link
                  href="/report"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 28px", borderRadius: 12,
                    background: "#2ee6c8", color: "#0d1a12",
                    fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none", border: "none",
                    boxShadow: "0 0 0 0 rgba(46,230,200,0)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px -8px rgba(46,230,200,0.5)";
                    (e.currentTarget as HTMLElement).style.background = "#40f0d4";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(46,230,200,0)";
                    (e.currentTarget as HTMLElement).style.background = "#2ee6c8";
                  }}
                >
                   Report an Issue <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
                <a
                  href="#scoreboard"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 28px", borderRadius: 12,
                    background: "transparent", color: "#f0ede8",
                    fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em",
                    textDecoration: "none",
                    border: "1px solid rgba(240,237,232,0.12)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(46,230,200,0.4)";
                    (e.currentTarget as HTMLElement).style.color = "#2ee6c8";
                    (e.currentTarget as HTMLElement).style.background = "rgba(46,230,200,0.05)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,237,232,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "#f0ede8";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                   <BarChart3 style={{ width: 16, height: 16 }} /> See Public Records
                </a>
              </motion.div>
            </motion.div>


            {/* Right — Dashboard Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="animate-float"
            >
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(240,237,232,0.07)",
                borderRadius: 16,
                backdropFilter: "blur(20px)",
                padding: 24,
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ee6c8", display: "block", animation: "breathe 3s ease-in-out infinite" }} />
                    <span style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,237,232,0.45)" }}>
                      LikasLens · Live
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.4)",
                    border: "1px solid rgba(240,237,232,0.1)", borderRadius: 4, padding: "2px 8px",
                  }}>
                    SYS-ONLINE
                  </span>
                </div>

                {/* Metrics */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {liveMetrics.map((metric, idx) => (
                    <motion.div
                      key={metric.label}
                      animate={{ opacity: idx === metricIndex ? 1 : 0.3 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: idx < liveMetrics.length - 1 ? "1px solid rgba(240,237,232,0.06)" : "none",
                      }}
                    >
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {metric.label}
                      </span>
                      <span style={{
                        fontFamily: "monospace", fontSize: 22, fontWeight: 700,
                        color: idx === metricIndex ? "#2ee6c8" : "#f0ede8",
                        transition: "color 0.4s ease",
                      }}>
                        {metric.value}
                      </span>
                    </motion.div>
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
                            <motion.div
                              style={{ height: "100%", borderRadius: 9999, background: "#2ee6c8" }}
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1.2, delay: 0.8 + i * 0.3, ease: "easeOut" }}
                            />
                          </div>
                          <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(240,237,232,0.35)", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {step}
                          </p>
                        </div>
                        {i < 3 && (
                           <ArrowRight style={{ width: 10, height: 10, color: "rgba(240,237,232,0.3)", flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(240,237,232,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.35)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ee6c8" }} />
                    All systems operational
                  </div>
                  <button
                    onClick={handleInstall}
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: 10, color: "#2ee6c8", textDecoration: "underline" }}
                  >
                    <Download style={{ width: 12, height: 12 }} /> Install App
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: scrollOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.4)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown style={{ width: 16, height: 16, color: "#2ee6c8" }} />
          </motion.div>
        </motion.div>

        {/* Hero → wave divider */}
        <div style={{ position: "absolute", bottom: -2, left: 0, right: 0, pointerEvents: "none", lineHeight: 0 }}>
          <svg
            viewBox="0 0 1440 100"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ display: "block", width: "100%", height: 100, transition: "fill 0.6s ease" }}
          >
            <path
              d="M0,40 C180,90 360,10 540,50 C720,90 900,20 1080,55 C1260,90 1380,30 1440,50 L1440,100 L0,100 Z"
              fill={ghostMode ? "#0c1628" : "#f5f5f0"}
              style={{ transition: "fill 0.6s ease" }}
            />
          </svg>
        </div>
      </section>


      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64, display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 9999,
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--accent)", width: "fit-content",
          }}>Platform</span>
          <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--ink)", margin: 0 }}>
            From snapshot<br />to solution
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
            Three steps turn every citizen report into measurable environmental action.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}
        >
          {HOW_IT_WORKS.map(({ step, Icon, title, description }, i) => (
            <motion.div
              key={step}
              variants={fadeUp}
              style={{
                padding: 32,
                borderRadius: 20,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                cursor: "default",
              }}
              whileHover={{ y: -6, boxShadow: "0 20px 48px -16px color-mix(in srgb, var(--accent) 18%, transparent)" }}
            >
              {/* Accent bottom bar */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, var(--accent), var(--secondary))`,
                transform: "scaleX(0)", transformOrigin: "left",
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              }} className="step-bottom-bar" />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `color-mix(in srgb, var(--accent) ${8 + i * 3}%, transparent)`,
                  border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                   <Icon style={{ width: 28, height: 28, color: "var(--accent)" }} />
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 40, fontWeight: 900, color: "var(--border)", lineHeight: 1 }}>
                  {step}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── GHOST MODE ─────────────────────────────────────── */}
      <section id="ghost" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div
          className="rounded-3xl border overflow-hidden transition-all duration-700"
          style={{
            borderColor: ghostMode ? "#facc15" : "var(--border)",
            borderWidth: ghostMode ? 2 : 1,
            boxShadow: ghostMode ? "0 0 80px -20px rgba(250,204,21,0.15)" : "none",
            background: ghostMode
              ? "linear-gradient(135deg, #0d1a12 0%, #0c1628 100%)"
              : "var(--panel)",
          }}
        >
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-10 md:p-16 space-y-6 flex flex-col justify-center">
              <div className="flex items-center gap-2" style={{
                border: ghostMode ? "1px solid #facc15" : "none",
                padding: ghostMode ? "4px 8px" : "0",
                borderRadius: 4,
                alignSelf: "flex-start",
                transition: "all 0.4s",
              }}>
                <Fingerprint
                  style={{ width: 20, height: 20, color: ghostMode ? "#facc15" : "var(--muted)", transition: "color 0.4s" }}
                />
                <span style={{
                  fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                  color: ghostMode ? "#facc15" : "var(--muted)", transition: "color 0.4s",
                }}>
                  {ghostMode ? "Ghost Mode Active" : "Your Safety Matters"}
                </span>
              </div>

              <h2 style={{
                fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1,
                color: ghostMode ? "#f0ede8" : "var(--ink)", margin: 0, transition: "color 0.5s",
              }}>
                Report sensitive issues{" "}
                <span style={{ color: ghostMode ? "#facc15" : "var(--muted)", transition: "color 0.5s" }}>
                  without revealing who you are.
                </span>
              </h2>

              <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: ghostMode ? "rgba(240,237,232,0.55)" : "var(--muted)", transition: "color 0.5s" }}>
                Reporting illegal logging, toxic dumping, or dangerous violations?
                Ghost Mode strips your identity, scrubs photo EXIF metadata,
                and transmits your report with zero trace.
              </p>

              <button
                onClick={() => setGhostMode(!ghostMode)}
                style={{
                  alignSelf: "flex-start",
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 700,
                  background: ghostMode ? "#facc15" : "var(--accent)",
                  color: ghostMode ? "#0d1a12" : "#fff",
                  boxShadow: ghostMode ? "0 8px 24px -8px rgba(250,204,21,0.4)" : "0 8px 24px -8px rgba(27,67,50,0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                {ghostMode ? (
                   <><ShieldCheck style={{ width: 16, height: 16 }} /> Deactivate Ghost Mode</>
                ) : (
                   <><Eye style={{ width: 16, height: 16 }} /> Activate Ghost Mode</>
                )}
              </button>
            </div>

            <div
              className="relative flex items-center justify-center p-10 md:p-16 min-h-[320px]"
              style={{ borderLeft: ghostMode ? "1px solid rgba(250,204,21,0.2)" : "1px solid var(--border)", transition: "border-color 0.5s" }}
            >
              {ghostMode && (
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "radial-gradient(ellipse at center, rgba(250,204,21,0.08) 0%, transparent 70%)",
                }} />
              )}
              <motion.div
                key={ghostMode ? "ghost" : "normal"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
              >
                {ghostMode ? (
                  <>
                    <div style={{ position: "relative", display: "inline-block", overflow: "hidden", padding: 12 }}>
                      <motion.div
                        animate={{ 
                          x: [0, -2, 2, 0, 0, 0, 0, 0], 
                          opacity: [1, 0.3, 1, 1, 1, 1, 1, 1],
                          filter: [
                            "drop-shadow(0 0 0px #facc15)", 
                            "drop-shadow(0 0 10px #facc15)", 
                            "drop-shadow(0 0 0px #facc15)",
                            "drop-shadow(0 0 0px #facc15)",
                            "drop-shadow(0 0 0px #facc15)",
                            "drop-shadow(0 0 0px #facc15)",
                            "drop-shadow(0 0 0px #facc15)",
                            "drop-shadow(0 0 0px #facc15)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                         <Fingerprint style={{ width: 96, height: 96, color: "#facc15" }} />
                      </motion.div>
                      
                      {/* Scanning Line Effect */}
                      <motion.div
                        animate={{ top: ["-20%", "120%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                        style={{
                          position: "absolute",
                          left: 0, right: 0,
                          height: 12,
                          background: "linear-gradient(to bottom, transparent, rgba(250,204,21,0.8), transparent)",
                          boxShadow: "0 0 10px rgba(250,204,21,0.5)",
                          pointerEvents: "none",
                          zIndex: 10
                        }}
                      />
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(250,204,21,0.25) 0%, transparent 70%)", filter: "blur(12px)", pointerEvents: "none" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#facc15", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
                        Identity Hidden
                      </p>
                      <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(240,237,232,0.6)", margin: 0 }}>
                        PHOTO LOCATION REMOVED // SENT SECRETLY
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
                      {["Location data removed", "Device ID stripped", "Encrypted tunnel", "Zero-knowledge routing"].map((item) => (
                        <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                           <CheckCircle style={{ width: 14, height: 14, color: "#facc15", flexShrink: 0 }} />
                          <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,237,232,0.45)" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                     <Camera style={{ width: 96, height: 96, color: "var(--muted)" }} />
                    <div>
                      <p className="font-mono text-sm text-muted uppercase tracking-widest" style={{ margin: "0 0 4px" }}>Standard Report</p>
                      <p className="font-mono text-xs text-muted/60" style={{ margin: 0 }}>Identity visible · Location attached</p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PUBLIC SCOREBOARD ──────────────────────────────── */}
      <section id="scoreboard" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 40, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 9999,
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--accent)", width: "fit-content",
          }}>Community</span>
          <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--ink)", margin: 0 }}>Public Records</h2>
          <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
            Recent reports being tracked and resolved across the platform.
          </p>
        </motion.div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", padding: "8px 0" }}>
          <PublicScoreboard />
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── INSTALL CTA ────────────────────────────────────── */}
      <section id="install-guide" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #1b4332 100%)" }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, width: 320, height: 320, pointerEvents: "none", background: "radial-gradient(circle, rgba(46,230,200,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative grid md:grid-cols-2 gap-0 items-center">
            <div className="p-10 md:p-16 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <Smartphone style={{ width: 18, height: 18, color: "#2ee6c8" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)" }}>
                    Progressive Web App
                  </span>
                </div>
                <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", margin: 0, lineHeight: 1.1 }}>
                  Install on<br />Your Device
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: 0 }}>
                  Use LikasLens like a native app. Take photos instantly, report even when offline, and receive push notifications.
                </p>
              </div>
              <div className="space-y-5">
                {[
                  { n: "1", title: "Open in your browser", sub: "Chrome, Edge, or Safari on your mobile device" },
                  { n: "2", title: "Tap the share / menu button", sub: 'Look for "Add to Home Screen" or "Install App"' },
                  { n: "3", title: "Start reporting", sub: "LikasLens appears on your home screen like any native app" },
                ].map(({ n, title, sub }) => (
                  <div key={n} className="flex items-start gap-4">
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#2ee6c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>
                      {n}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "#fff", margin: "0 0 2px" }}>{title}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleInstall}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 24px", borderRadius: 12, background: "#2ee6c8", color: "#0d1a12", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 8px 24px -8px rgba(46,230,200,0.35)", transition: "all 0.25s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#40f0d4"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#2ee6c8"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                 <Download style={{ width: 16, height: 16 }} /> Install LikasLens
              </button>
            </div>

            {/* Phone mockup */}
            <div className="flex items-center justify-center p-10 md:p-16">
              <div style={{ position: "relative" }}>
                <div style={{ width: 192, height: 360, borderRadius: 40, border: "4px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", position: "relative", overflow: "hidden", boxShadow: "0 32px 64px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 80, height: 20, borderRadius: 9999, background: "rgba(0,0,0,0.7)", zIndex: 10 }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px 24px", gap: 12 }}>
                     <Leaf style={{ width: 32, height: 32, color: "#2ee6c8" }} />
                    <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", margin: 0 }}>LikasLens</p>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      <div style={{ height: 7, borderRadius: 9999, background: "rgba(255,255,255,0.08)", width: "100%" }} />
                      <div style={{ height: 7, borderRadius: 9999, background: "rgba(46,230,200,0.25)", width: "75%" }} />
                      <div style={{ height: 7, borderRadius: 9999, background: "rgba(255,255,255,0.08)", width: "85%" }} />
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(46,230,200,0.15)", border: "1px solid rgba(46,230,200,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                       <Camera style={{ width: 24, height: 24, color: "#2ee6c8" }} />
                    </div>
                    <p style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Tap to report</p>
                  </div>
                  <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", width: 64, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.25)" }} />
                </div>
                <div style={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)", width: 128, height: 32, background: "radial-gradient(ellipse, rgba(46,230,200,0.3) 0%, transparent 70%)", filter: "blur(8px)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
