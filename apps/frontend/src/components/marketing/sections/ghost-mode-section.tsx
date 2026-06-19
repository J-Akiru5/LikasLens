"use client";

import { m } from "framer-motion";
import { Fingerprint, Eye, ShieldCheck, CheckCircle } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Ghost Mode — the signature safety mechanic. Not a cosmetic dark theme.

   The toggle visibly changes the operational context (palette + the artifact
   on the right flips). Solid surfaces, no glass, mono reserved for the few
   data tokens that describe the protection state.
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
  return (
    <section id="ghost" className="ec-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${ghostMode ? "color-mix(in oklab, var(--accent-bright) 35%, transparent)" : "var(--border)"}`,
            boxShadow: ghostMode ? "0 0 0 1px color-mix(in oklab, var(--accent-bright) 8%, transparent)" : "none",
            background: ghostMode
              ? "linear-gradient(150deg, var(--hero-bg) 0%, var(--page) 78%)"
              : "var(--panel)",
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
                Report the dangerous ones without exposing who you are.
              </h2>

              <p
                style={{
                  fontSize: 16, lineHeight: 1.65, margin: 0, maxWidth: 460,
                  color: ghostMode ? "rgba(240,237,232,0.65)" : "var(--muted)",
                  transition: "color 0.5s",
                }}
              >
                Illegal logging near syndicate territory. Industrial dumping under
                surveillance. Ghost Mode is built for these. It strips your
                identity, scrubs photo EXIF metadata, and transmits the report
                with no trace back to you.
              </p>

              <button
                onClick={onGhostToggle}
                aria-pressed={ghostMode}
                aria-label={ghostMode ? "Deactivate Ghost Mode" : "Activate Ghost Mode"}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 self-start"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginTop: 8, padding: "13px 24px", borderRadius: 10,
                  border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
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
                  <><ShieldCheck style={{ width: 16, height: 16 }} aria-hidden="true" /> Deactivate Ghost Mode</>
                ) : (
                  <><Eye style={{ width: 16, height: 16 }} aria-hidden="true" /> Activate Ghost Mode</>
                )}
              </button>
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
                        Identity hidden
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(240,237,232,0.55)", margin: 0 }}>
                        Location removed · sent over an encrypted tunnel
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
                    <div style={{ width: 92, height: 92, borderRadius: 16, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel-elevated)" }}>
                      <Eye style={{ width: 44, height: 44, color: "var(--muted)" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                        Standard report
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", margin: 0 }}>
                        Identity visible · location attached · public credit
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
