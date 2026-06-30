"use client";

import { m } from "framer-motion";
import { Fingerprint, Eye, ShieldCheck, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

/* ─────────────────────────────────────────────────────────────────────────────
   Ghost Mode — the signature safety mechanic. Not a cosmetic dark theme.

   The toggle visibly changes the operational context (palette + the artifact
   on the right flips). Solid surfaces, no glass, mono reserved for the few
   data tokens that describe the protection state.
   ───────────────────────────────────────────────────────────────────────────── */

// PROTECTIONS moved inside component

interface GhostModeSectionProps {
  ghostMode: boolean;
  onGhostToggle: () => void;
}

export function GhostModeSection({ ghostMode, onGhostToggle }: GhostModeSectionProps) {
  const t = useTranslations("landing");
  const PROTECTIONS = [
    t("photoLocationStripped"),
    t("deviceFingerprintRemoved"),
    t("encryptedTransport"),
    t("zeroKnowledgeRouting"),
  ];
  return (
    <section id="ghost" className="ec-section">
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
              ? "linear-gradient(150deg, rgba(13,26,18,0.85) 0%, rgba(13,26,18,0.55) 100%)"
              : "linear-gradient(150deg, color-mix(in oklab, var(--panel) 85%, transparent) 0%, color-mix(in oklab, var(--panel) 60%, transparent) 100%)",
            backdropFilter: "blur(24px)",
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
                {ghostMode ? "Ghost Mode active" : "Whistleblower protection"}
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

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGhostToggle}
                aria-pressed={ghostMode}
                aria-label={ghostMode ? t("deactivateGhostMode") : t("activateGhostMode")}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 self-start"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginTop: 8, padding: "13px 24px", borderRadius: 10,
                  border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
                  fontSize: 14, fontWeight: 700,
                  background: ghostMode ? "var(--accent-bright)" : "var(--accent)",
                  color: ghostMode ? "var(--hero-bg)" : "#fff",
                  boxShadow: ghostMode
                    ? "0 8px 22px -10px rgba(250,204,21,0.5)"
                    : "0 8px 22px -10px rgba(27,67,50,0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                {ghostMode ? (
                  <><ShieldCheck style={{ width: 16, height: 16 }} aria-hidden="true" /> {t("turnOffGhostMode")}</>
                ) : (
                  <><Eye style={{ width: 16, height: 16 }} aria-hidden="true" /> {t("turnOnGhostMode")}</>
                )}
              </m.button>

              {/* Context Callout */}
              <a
                href="https://globalwitness.org/en/campaigns/land-and-environmental-defenders/in-numbers-lethal-attacks-against-defenders-since-2012/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "16px",
                  background: ghostMode 
                    ? "linear-gradient(135deg, rgba(46, 230, 200, 0.15) 0%, rgba(46, 230, 200, 0.02) 100%)" 
                    : "linear-gradient(135deg, rgba(17, 24, 20, 0.08) 0%, rgba(17, 24, 20, 0.02) 100%)",
                  clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)",
                  borderLeft: ghostMode ? "3px solid var(--accent-bright)" : "3px solid var(--ink)",
                  textDecoration: "none",
                  position: "relative",
                  transition: "all 0.3s",
                  maxWidth: 460,
                }}
                className="hover:-translate-y-0.5"
              >

                {/* Icon */}
                <div style={{
                  width: 26, height: 26, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: ghostMode ? "rgba(46, 230, 200, 0.15)" : "rgba(17, 24, 20, 0.08)",
                  borderRadius: "50%",
                  color: ghostMode ? "var(--accent-bright)" : "var(--ink)",
                  position: "relative",
                  zIndex: 1
                }}>
                  <AlertCircle style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                </div>
                
                {/* Text */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{
                    margin: 0, fontSize: 13, lineHeight: 1.5,
                    color: ghostMode ? "rgba(240,237,232,0.9)" : "var(--ink)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500
                  }}>
                    <strong style={{ color: ghostMode ? "var(--accent-bright)" : "var(--ink)", fontWeight: 800 }}>STARK REALITY:</strong> The Philippines is the deadliest country in Asia for environmental defenders. We engineered Ghost Mode because protecting nature should never compromise your safety.
                  </p>
                  <p style={{
                    margin: "6px 0 0", fontSize: 11,
                    color: ghostMode ? "rgba(240,237,232,0.5)" : "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "flex", alignItems: "center", gap: 5,
                    fontWeight: 600
                  }}>
                    Source: Global Witness Report <ExternalLink style={{ width: 11, height: 11 }} />
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
                      {PROTECTIONS.map((item) => (
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
                    <m.div
                      whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{ width: 92, height: 92, borderRadius: 16, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel-elevated)", cursor: "default" }}
                    >
                      <Eye style={{ width: 44, height: 44, color: "var(--muted)" }} />
                    </m.div>
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
