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
  { n: "1", title: "Download the App", sub: "Get the LikasLens package for Android or iOS." },
  { n: "2", title: "Install natively", sub: "Install the app directly to your device for offline support." },
  { n: "3", title: "Start reporting", sub: "LikasLens lands on your home screen with native performance." },
];

export function InstallCtaSection({ ghostMode }: InstallCtaSectionProps) {
  // PWA install logic is kept in case we add it back later, but hidden from UI for now.
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
                  Native Mobile App
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
                  Install LikasLens natively. Capture photos instantly,
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

              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <a
                  href="/downloads/likaslens.apk"
                  download="LikasLens.apk"
                  aria-label="Download LikasLens for Android"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                  style={{
                    padding: "13px 24px",
                    borderRadius: 10, background: "#2ee6c8", color: "#0d1a12",
                    fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)",
                    border: "none", textDecoration: "none",
                    boxShadow: "0 6px 16px -8px rgba(46,230,200,0.5)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style={{ width: 16, height: 16 }} fill="currentColor" aria-hidden="true"><path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10h0l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10h0l48,83.24C73.68,197.62,24.92,272.58,8,368H568c-16.92-95.42-65.68-170.38-138.85-210.55"/></svg>
                  Android APK
                </a>
                <a
                  href={process.env.NODE_ENV === "development" ? "http://localhost:3003/en/install" : "https://likaslensapp.syntaxure.dev/en/install"}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Download LikasLens for iOS"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                  style={{
                    padding: "13px 24px",
                    borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#ffffff",
                    fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)",
                    border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style={{ width: 15, height: 17 }} fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.3 48.6-.9 91.5-84.7 103.5-125.2-46.7-20-63.1-66.4-62.6-85.4zm-64.3-174.6c21.3-26.4 34.6-59.5 30.6-94.1-30.2 1.5-66.4 20.3-88.5 47-19.1 22.8-34.6 57.3-29.6 91.2 33.2 2.1 66.4-16.7 87.5-44.1z"/></svg>
                  iOS App
                </a>
              </div>
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
                    <img src="/images/likas-lens-logo.webp" alt="LikasLens" style={{ width: 46, height: 46, objectFit: "contain" }} />
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
