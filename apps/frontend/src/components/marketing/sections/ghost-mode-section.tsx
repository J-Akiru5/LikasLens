"use client";

import { motion } from "framer-motion";
import { Fingerprint, Eye, ShieldCheck, CheckCircle, Camera } from "lucide-react";

interface GhostModeSectionProps {
  ghostMode: boolean;
  onGhostToggle: () => void;
}

export function GhostModeSection({ ghostMode, onGhostToggle }: GhostModeSectionProps) {
  return (
    <section id="ghost" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <div
        className="rounded-3xl border overflow-hidden transition-all duration-700"
        style={{
          borderColor: ghostMode ? "var(--ghost-accent)" : "var(--border)",
          borderWidth: ghostMode ? 2 : 1,
          boxShadow: ghostMode ? "0 0 80px -20px rgba(250,204,21,0.15)" : "none",
          background: ghostMode
            ? "linear-gradient(135deg, var(--hero-bg) 0%, var(--page) 100%)"
            : "var(--panel)",
        }}
      >
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-10 md:p-16 space-y-6 flex flex-col justify-center">
            <div
              className="flex items-center gap-2"
              style={{
                border: ghostMode ? "1px solid var(--ghost-accent)" : "none",
                padding: ghostMode ? "4px 8px" : "0",
                borderRadius: 4,
                alignSelf: "flex-start",
                transition: "all 0.4s",
              }}
            >
              <Fingerprint
                style={{
                  width: 20, height: 20,
                  color: ghostMode ? "var(--ghost-accent)" : "var(--muted)",
                  transition: "color 0.4s",
                }}
              />
              <span
                style={{
                  fontFamily: "monospace", fontSize: 11, textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: ghostMode ? "var(--ghost-accent)" : "var(--muted)",
                  transition: "color 0.4s",
                }}
              >
                {ghostMode ? "Ghost Mode Active" : "Your Safety Matters"}
              </span>
            </div>

            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                color: ghostMode ? "var(--hero-ink)" : "var(--ink)",
                margin: 0, transition: "color 0.5s",
              }}
            >
              Report sensitive issues{" "}
              <span style={{ color: ghostMode ? "var(--ghost-accent)" : "var(--muted)", transition: "color 0.5s" }}>
                without revealing who you are.
              </span>
            </h2>

            <p
              style={{
                fontSize: 15, lineHeight: 1.7, margin: 0,
                color: ghostMode ? "rgba(240,237,232,0.55)" : "var(--muted)",
                transition: "color 0.5s",
              }}
            >
              Reporting illegal logging, toxic dumping, or dangerous violations? Ghost Mode strips
              your identity, scrubs photo EXIF metadata, and transmits your report with zero trace.
            </p>

            <button
              onClick={onGhostToggle}
              style={{
                alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10,
                marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 700,
                background: ghostMode ? "var(--ghost-accent)" : "var(--accent)",
                color: ghostMode ? "var(--hero-bg)" : "#fff",
                boxShadow: ghostMode
                  ? "0 8px 24px -8px rgba(250,204,21,0.4)"
                  : "0 8px 24px -8px rgba(27,67,50,0.3)",
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
            style={{
              borderLeft: ghostMode ? "1px solid rgba(250,204,21,0.2)" : "1px solid var(--border)",
              transition: "border-color 0.5s",
            }}
          >
            {ghostMode && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(250,204,21,0.08) 0%, transparent 70%)" }} />
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
                          "drop-shadow(0 0 0px #facc15)", "drop-shadow(0 0 10px #facc15)",
                          "drop-shadow(0 0 0px #facc15)", "drop-shadow(0 0 0px #facc15)",
                          "drop-shadow(0 0 0px #facc15)", "drop-shadow(0 0 0px #facc15)",
                          "drop-shadow(0 0 0px #facc15)", "drop-shadow(0 0 0px #facc15)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Fingerprint style={{ width: 96, height: 96, color: "var(--ghost-accent)" }} />
                    </motion.div>
                    <motion.div
                      animate={{ top: ["-20%", "120%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                      style={{
                        position: "absolute", left: 0, right: 0, height: 12,
                        background: "linear-gradient(to bottom, transparent, rgba(250,204,21,0.8), transparent)",
                        boxShadow: "0 0 10px rgba(250,204,21,0.5)",
                        pointerEvents: "none", zIndex: 10,
                      }}
                    />
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(250,204,21,0.25) 0%, transparent 70%)", filter: "blur(12px)", pointerEvents: "none" }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--ghost-accent)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
                      Identity Hidden
                    </p>
                    <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(240,237,232,0.6)", margin: 0 }}>
                      PHOTO LOCATION REMOVED // SENT SECRETLY
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
                    {["Location data removed", "Device ID stripped", "Encrypted tunnel", "Zero-knowledge routing"].map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle style={{ width: 14, height: 14, color: "var(--ghost-accent)", flexShrink: 0 }} />
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
  );
}
