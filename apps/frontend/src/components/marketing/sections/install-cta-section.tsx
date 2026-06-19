"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Smartphone, Download, Camera } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Install CTA — refine. Keep the phone mockup + steps. Drop the ghost-card
   pattern (1px border + ≥16px blur shadow) and mono-as-decoration.
   ───────────────────────────────────────────────────────────────────────────── */

interface InstallCtaSectionProps {
  ghostMode: boolean;
}

const STEPS = [
  { n: "1", title: "Open it in your browser", sub: "Chrome, Edge, or Safari on your mobile device" },
  { n: "2", title: "Tap the share or menu button", sub: 'Choose "Add to Home Screen" or "Install App"' },
  { n: "3", title: "Start reporting", sub: "LikasLens lands on your home screen like any native app" },
];

export function InstallCtaSection({ ghostMode }: InstallCtaSectionProps) {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  }
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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
    }
  };

  return (
    <section id="install-guide" className="ec-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            background: ghostMode
              ? "var(--panel)"
              : "linear-gradient(150deg, #1b4332 0%, #163829 55%, #0d1a12 100%)",
            border: ghostMode ? "1px solid var(--border)" : "none",
          }}
        >
          <div className="relative grid md:grid-cols-2 gap-0 items-center">
            {/* Left — copy + steps */}
            <div className="p-8 md:p-14 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
                    fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    color: ghostMode ? "var(--accent-bright)" : "rgba(255,255,255,0.7)",
                  }}
                >
                  <Smartphone style={{ width: 15, height: 15 }} aria-hidden="true" />
                  Progressive web app
                </span>
                <h2
                  style={{
                    fontSize: "var(--display-section)",
                    fontFamily: "var(--font-heading)", fontWeight: 700,
                    letterSpacing: "-0.03em", lineHeight: 1.06, margin: 0,
                    color: ghostMode ? "var(--ink)" : "#fff",
                    textWrap: "balance" as const,
                  }}
                >
                  Carry the record in your pocket.
                </h2>
                <p
                  style={{
                    fontSize: 16, lineHeight: 1.65, margin: 0, maxWidth: 460,
                    color: ghostMode ? "var(--muted)" : "rgba(255,255,255,0.72)",
                  }}
                >
                  Install LikasLens like a native app. Capture photos instantly,
                  file reports offline, and receive push notifications when an
                  agency acts on your case.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {STEPS.map(({ n, title, sub }) => (
                  <div key={n} className="flex items-start gap-4">
                    <span
                      style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: ghostMode ? "color-mix(in oklab, var(--accent-bright) 10%, transparent)" : "rgba(255,255,255,0.10)",
                        color: "#2ee6c8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontFamily: "var(--font-data)", fontWeight: 700,
                      }}
                    >
                      {n}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, fontFamily: "var(--font-body)", margin: "0 0 2px", color: ghostMode ? "var(--ink)" : "#fff" }}>{title}</p>
                      <p style={{ fontSize: 12.5, fontFamily: "var(--font-body)", margin: 0, color: ghostMode ? "var(--muted)" : "rgba(255,255,255,0.6)" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleInstall}
                aria-label="Install LikasLens app on your device"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 self-start"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "13px 24px",
                  borderRadius: 10, background: "#2ee6c8", color: "#0d1a12",
                  fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 6px 16px -8px rgba(46,230,200,0.5)",
                  transition: "all 0.25s ease",
                }}
              >
                <Download style={{ width: 16, height: 16 }} aria-hidden="true" /> Install LikasLens
              </button>
            </div>

            {/* Right — phone mockup */}
            <div className="flex items-center justify-center p-8 md:p-14">
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 188, height: 352, borderRadius: 38,
                    border: `4px solid ${ghostMode ? "rgba(46,230,200,0.2)" : "rgba(255,255,255,0.18)"}`,
                    background: "rgba(0,0,0,0.4)", position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 78, height: 20, borderRadius: 9999, background: "rgba(0,0,0,0.7)", zIndex: 10 }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "46px 16px 24px", gap: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/likas-lens-logo.png" alt="LikasLens" style={{ width: 46, height: 46, objectFit: "contain" }} />
                    <p style={{ fontFamily: "var(--font-data)", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", margin: 0 }}>LikasLens</p>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                      <div style={{ height: 7, borderRadius: 9999, background: "rgba(255,255,255,0.08)", width: "100%" }} />
                      <div style={{ height: 7, borderRadius: 9999, background: "rgba(46,230,200,0.25)", width: "72%" }} />
                      <div style={{ height: 7, borderRadius: 9999, background: "rgba(255,255,255,0.08)", width: "85%" }} />
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(46,230,200,0.15)", border: "1px solid rgba(46,230,200,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                      <Camera style={{ width: 22, height: 22, color: "#2ee6c8" }} />
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Tap to report</p>
                  </div>
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 62, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.25)" }} />
                </div>
                <div aria-hidden="true" style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)", width: 120, height: 28, background: "radial-gradient(ellipse, rgba(46,230,200,0.3) 0%, transparent 70%)", filter: "blur(8px)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
