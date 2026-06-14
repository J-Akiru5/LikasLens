"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Smartphone, Download, Camera } from "lucide-react";

interface InstallCtaSectionProps {
  ghostMode: boolean;
}

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
    <section id="install-guide" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 pb-32">
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: ghostMode
            ? "var(--panel)"
            : "linear-gradient(135deg, #1b4332 0%, #166534 50%, #1b4332 100%)",
          border: ghostMode ? "1px solid rgba(46,230,200,0.14)" : "none",
          transition: "background 0.5s ease, border-color 0.5s ease",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute", top: 0, right: 0, width: 320, height: 320, pointerEvents: "none",
            background: ghostMode
              ? "radial-gradient(circle, rgba(46,230,200,0.08) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(46,230,200,0.15) 0%, transparent 70%)",
            filter: "blur(40px)", transition: "background 0.5s ease",
          }}
        />
        {/* Grid texture — civic only */}
        {!ghostMode && (
          <div
            style={{
              position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none",
              backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        )}

        <div className="relative grid md:grid-cols-2 gap-0 items-center">
          <div className="p-10 md:p-16 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone style={{ width: 18, height: 18, color: ghostMode ? "var(--accent)" : "var(--accent-bright)" }} aria-hidden="true" />
                <span style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: ghostMode ? "var(--muted)" : "rgba(255,255,255,0.55)", transition: "color 0.4s" }}>
                  Progressive Web App
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0, color: ghostMode ? "var(--ink)" : "#fff", transition: "color 0.4s" }}>
                Install on<br />Your Device
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: ghostMode ? "var(--muted)" : "rgba(255,255,255,0.65)", transition: "color 0.4s" }}>
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
                  <span style={{
                    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                    background: ghostMode ? "rgba(46,230,200,0.08)" : "rgba(255,255,255,0.10)",
                    border: ghostMode ? "1px solid rgba(46,230,200,0.2)" : "1px solid rgba(255,255,255,0.15)",
                    color: "#2ee6c8", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                    transition: "background 0.4s, border-color 0.4s",
                  }}>
                    {n}
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 2px", color: ghostMode ? "var(--ink)" : "#fff", transition: "color 0.4s" }}>{title}</p>
                    <p style={{ fontSize: 12, margin: 0, color: ghostMode ? "var(--muted)" : "rgba(255,255,255,0.55)", transition: "color 0.4s" }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleInstall}
              aria-label="Install LikasLens app on your device"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "14px 24px",
                borderRadius: 8, background: "#2ee6c8", color: "#0d1a12", fontWeight: 700,
                fontSize: 14, border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px -8px rgba(46,230,200,0.35)", transition: "all 0.25s ease",
              }}
            >
              <Download style={{ width: 16, height: 16 }} aria-hidden="true" /> Install LikasLens
            </button>
          </div>

          {/* Phone mockup */}
          <div className="flex items-center justify-center p-10 md:p-16">
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 192, height: 360, borderRadius: 40,
                  border: ghostMode ? "4px solid rgba(46,230,200,0.2)" : "4px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.4)", position: "relative", overflow: "hidden",
                  boxShadow: ghostMode
                    ? "0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,230,200,0.08)"
                    : "0 32px 64px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                  transition: "border-color 0.4s, box-shadow 0.4s",
                }}
              >
                <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 80, height: 20, borderRadius: 9999, background: "rgba(0,0,0,0.7)", zIndex: 10 }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px 24px", gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/icon-192x192.png" alt="LikasLens Logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
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
      </m.div>
    </section>
  );
}
