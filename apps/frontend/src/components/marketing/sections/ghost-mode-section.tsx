"use client";

import { m } from "framer-motion";
import { Fingerprint, Eye, ShieldCheck, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/* ─────────────────────────────────────────────────────────────────────────────
   Ghost Mode — the signature safety mechanic. Not a cosmetic dark theme.
   ───────────────────────────────────────────────────────────────────────────── */

const PROTECTIONS = [
  "Photo location stripped (EXIF)",
  "Device fingerprint removed",
  "Encrypted transport",
  "Zero-knowledge routing",
];

interface GhostModeSectionProps {
  ghostMode: boolean;
  onGhostToggle: () => void;
}

export function GhostModeSection({ ghostMode, onGhostToggle }: GhostModeSectionProps) {
  const t = useTranslations("landing");

  return (
    <section id="ghost" className="ec-section bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div
          style={{
            borderRadius: "20px",
            overflow: "hidden",
            border: `1px solid ${ghostMode ? "color-mix(in oklab, var(--accent-bright) 30%, transparent)" : "color-mix(in oklab, var(--border) 80%, transparent)"}`,
            boxShadow: ghostMode 
              ? "0 20px 40px -10px color-mix(in oklab, var(--accent-bright) 10%, transparent)" 
              : "0 10px 40px -10px rgba(0,0,0,0.05)",
            background: ghostMode
              ? "linear-gradient(150deg, rgba(13,26,18,0.9) 0%, rgba(13,26,18,0.7) 100%)"
              : "var(--panel)",
            backdropFilter: ghostMode ? "blur(24px)" : "none",
            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="grid md:grid-cols-2 gap-0">

            {/* Left — copy + toggle */}
            <div className="p-8 md:p-14 flex flex-col justify-center gap-6">
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
                  padding: "5px 12px", borderRadius: 9999,
                  border: `1px solid ${ghostMode ? "color-mix(in oklab, var(--accent-bright) 35%, transparent)" : "var(--border)"}`,
                  fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  color: ghostMode ? "var(--accent-bright)" : "var(--muted)",
                  transition: "all 0.4s",
                }}
              >
                <Fingerprint style={{ width: 15, height: 15 }} aria-hidden="true" />
                {ghostMode ? t("ghostModeActive") : t("yourSafetyMatters")}
              </span>

              <h2
                style={{
                  fontSize: "var(--display-section)",
                  fontFamily: "var(--font-heading)", fontWeight: 700,
                  letterSpacing: "-0.03em", lineHeight: 1.08,
                  color: ghostMode ? "var(--hero-ink)" : "var(--ink)",
                  margin: 0, transition: "color 0.5s",
                  textWrap: "balance" as const,
                }}
              >
                {t("ghostSpotlightTitle1")} {t("ghostSpotlightTitle2")}
              </h2>

              <p
                style={{
                  fontSize: 16, lineHeight: 1.65, margin: 0, maxWidth: 460,
                  color: ghostMode ? "rgba(240,237,232,0.65)" : "var(--muted)",
                  transition: "color 0.5s",
                }}
              >
                {t("ghostSpotlightDesc")}
              </p>

              <button
                onClick={onGhostToggle}
                aria-pressed={ghostMode}
                aria-label={ghostMode ? t("turnOffGhostMode") : t("turnOnGhostMode")}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 self-start cursor-pointer"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginTop: 8, padding: "13px 24px", borderRadius: 10,
                  border: "none", fontFamily: "var(--font-body)",
                  fontSize: 14, fontWeight: 700,
                  background: ghostMode ? "var(--accent-bright)" : "var(--accent)",
                  color: ghostMode ? "var(--hero-bg)" : "#fff",
                  boxShadow: ghostMode
                    ? "0 8px 22px -10px rgba(46,230,200,0.5)"
                    : "0 8px 22px -10px rgba(27,67,50,0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                {ghostMode ? (
                  <><ShieldCheck style={{ width: 16, height: 16 }} aria-hidden="true" /> {t("turnOffGhostMode")}</>
                ) : (
                  <><Eye style={{ width: 16, height: 16 }} aria-hidden="true" /> {t("turnOnGhostMode")}</>
                )}
              </button>

              {/* Data Privacy & Whistleblower Protection Context Card */}
              <a
                href="/privacy"
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "16px",
                  background: ghostMode 
                    ? "linear-gradient(135deg, rgba(46, 230, 200, 0.12) 0%, rgba(46, 230, 200, 0.02) 100%)" 
                    : "linear-gradient(135deg, rgba(17, 24, 20, 0.06) 0%, rgba(17, 24, 20, 0.02) 100%)",
                  clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
                  borderLeft: ghostMode ? "3px solid #2ee6c8" : "3px solid var(--accent)",
                  textDecoration: "none",
                  position: "relative",
                  transition: "all 0.3s ease",
                  maxWidth: 480,
                }}
                className="hover:-translate-y-0.5 group"
              >
                {/* Icon */}
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: ghostMode ? "rgba(46, 230, 200, 0.15)" : "rgba(27, 67, 50, 0.08)",
                  borderRadius: "50%",
                  color: ghostMode ? "#2ee6c8" : "var(--accent)",
                  position: "relative",
                  zIndex: 1
                }}>
                  <ShieldCheck style={{ width: 15, height: 15 }} />
                </div>
                
                {/* Text */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{
                    margin: 0, fontSize: 12.5, lineHeight: 1.5,
                    color: ghostMode ? "rgba(240,237,232,0.9)" : "var(--ink)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500
                  }}>
                    <strong style={{ color: ghostMode ? "#2ee6c8" : "var(--accent)", fontWeight: 800 }}>{t("starkRealityTitle")} </strong>
                    {t("starkRealityBody")}
                  </p>
                  <p style={{
                    margin: "6px 0 0", fontSize: 10.5,
                    color: ghostMode ? "rgba(46,230,200,0.8)" : "var(--accent)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "flex", alignItems: "center", gap: 5,
                    fontWeight: 700
                  }}
                  className="group-hover:underline"
                  >
                    <span>{t("readGlobalWitnessReport")}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </p>
                </div>
              </a>
            </div>

            {/* Right — operational artifact. Flips with the mode. */}
            <div
              className="relative flex items-center justify-center p-8 md:p-14 min-h-[340px]"
              style={{
                borderLeft: `1px solid ${ghostMode ? "color-mix(in oklab, var(--accent-bright) 18%, transparent)" : "var(--border)"}`,
                transition: "border-color 0.5s",
              }}
            >
              {ghostMode && (
                <div
                  aria-hidden="true"
                  style={{ position: "absolute", inset: 0, pointerEvents: "none",
                    background: "radial-gradient(ellipse at center, color-mix(in oklab, var(--accent-bright) 10%, transparent) 0%, transparent 70%)" }}
                />
              )}

              <m.div
                key={ghostMode ? "ghost" : "civic"}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative", zIndex: 2 }}
              >
                {ghostMode ? (
                  <>
                    {/* Scanning fingerprint — the protection readout */}
                    <div style={{ position: "relative", display: "inline-block", overflow: "hidden", padding: 14 }}>
                      <m.div
                        animate={{ filter: ["drop-shadow(0 0 0px var(--accent-bright))", "drop-shadow(0 0 12px var(--accent-bright))", "drop-shadow(0 0 0px var(--accent-bright))"] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                      >
                        <Fingerprint style={{ width: 92, height: 92, color: "var(--accent-bright)" }} />
                      </m.div>
                      <m.div
                        animate={{ top: ["-20%", "120%"] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
                        style={{
                          position: "absolute", left: 0, right: 0, height: 12,
                          background: "linear-gradient(to bottom, transparent, var(--accent-bright), transparent)",
                          boxShadow: "0 0 10px color-mix(in oklab, var(--accent-bright) 60%, transparent)",
                          pointerEvents: "none", zIndex: 10,
                        }}
                      />
                    </div>

                    <div>
                      <p style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "var(--accent-bright)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                        {t("identityHidden")}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(240,237,232,0.55)", margin: 0 }}>
                        {t("photoLocationRemoved")}
                      </p>
                    </div>

                    {/* Protection checklist — body sans, not mono decoration */}
                    <ul style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", margin: "8px 0 0", padding: 0, listStyle: "none" }}>
                      {[t("protection1"), t("protection2"), t("protection3"), t("protection4")].map((item) => (
                        <li key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <CheckCircle style={{ width: 15, height: 15, color: "var(--accent-bright)", flexShrink: 0 }} />
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(240,237,232,0.7)" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    {/* Civic — the "before" state */}
                    <div style={{ width: 92, height: 92, borderRadius: 16, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel-elevated)" }}>
                      <Eye style={{ width: 44, height: 44, color: "var(--muted)" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                        {t("normalReport")}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", margin: 0 }}>
                        {t("yourNameShown")}
                      </p>
                    </div>
                  </>
                )}
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
