"use client";

import { m } from "framer-motion";
import { Camera, Cpu, Send, Bell, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";


/* ─────────────────────────────────────────────────────────────────────────────
   Evidence-board pipeline — with animated connector lines.

   Each node is a distinct artifact in a real ordered flow (Capture → Classify
   → Route → Notify). Connector lines with flowing dots show the data flow
   between stages. Staggered scroll-reveal entrance.
   ───────────────────────────────────────────────────────────────────────────── */

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

/* Animated connector dot that flows between pipeline nodes */
function PipelineConnector({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className={`relative ${vertical ? "w-px h-8 mx-auto" : "hidden lg:flex items-center justify-center"}`}
      style={vertical ? {} : { width: 48, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Dashed line */}
      <div
        className={vertical ? "w-px h-full" : "h-px w-full"}
        style={{
          background: `repeating-linear-gradient(${vertical ? "180deg" : "90deg"}, var(--accent) 0px, var(--accent) 4px, transparent 4px, transparent 10px)`,
          opacity: 0.3,
        }}
      />
      {/* Flowing dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          background: "var(--accent)",
          boxShadow: "0 0 8px var(--accent-glow)",
          ...(vertical
            ? { left: "50%", transform: "translateX(-50%)", animation: "flowDotVertical 2s ease-in-out infinite" }
            : { top: "50%", transform: "translateY(-50%)", animation: "flowDotHorizontal 2s ease-in-out infinite" }),
        }}
      />
      {/* Arrow at end */}
      {!vertical && (
        <ArrowRight
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{ width: 12, height: 12, color: "var(--accent)", opacity: 0.4 }}
        />
      )}
    </div>
  );
}

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const stepIcons = [Camera, Cpu, Send, Bell];

  return (
    <section id="how-it-works" className="ec-section" style={{ background: "var(--page)" }}>
      {/* Pipeline connector animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDotHorizontal {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% - 6px); opacity: 0; }
        }
        @keyframes flowDotVertical {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 6px); opacity: 0; }
        }
      `}} />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Intro */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 56, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 16, maxWidth: 720 }}
        >
          <h2
            style={{
              fontSize: "var(--display-section)",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              color: "var(--ink)",
              margin: 0,
              textWrap: "balance" as const,
            }}
          >
            {t("title")}
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
            {t("subtitle")}
          </p>
        </m.div>

        {/* Pipeline — connected cards with flowing dots */}
        <m.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="flex flex-col lg:flex-row lg:items-stretch gap-0"
        >
          {([1, 2, 3, 4] as const).map((stepNum, index) => {
            const Icon = stepIcons[index];
            const tag = t(`step${stepNum}Tag`);
            const title = t(`step${stepNum}Title`);
            const body = t(`step${stepNum}Body`);
            const artifact = t(`step${stepNum}Artifact`);
            const meta = t(`step${stepNum}Meta`);

            return (
              <div key={stepNum} className="contents">
                {/* Card */}
                <m.article
                  variants={fadeUp}
                  className="group hover:shadow-xl transition-all duration-500 flex-1"
                  style={{
                    padding: "32px 28px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: "20px",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon style={{ width: 16, height: 16, color: "var(--accent)" }} aria-hidden="true" />
                      <span
                        style={{
                          fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: "var(--accent)",
                        }}
                      >
                        {tag}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-data)", fontSize: 16, fontWeight: 800,
                        color: "var(--border-strong)",
                      }}
                    >
                      0{stepNum}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.35rem",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      color: "var(--ink)",
                      margin: 0,
                    }}
                  >
                    {title}
                  </h3>

                  <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                    {body}
                  </p>

                  {/* Artifact strip */}
                  <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 700,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: "var(--accent)",
                        }}
                      >
                        {artifact}
                      </span>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.05em" }}>
                        {meta}
                      </span>
                    </div>
                  </div>
                </m.article>

                {/* Connector between cards (not after the last one) */}
                {index < 3 && (
                  <m.div variants={fadeUp} className="flex flex-col justify-center self-stretch">
                    {/* Desktop: horizontal connector */}
                    <div className="hidden lg:block">
                      <PipelineConnector />
                    </div>
                    {/* Mobile: vertical connector */}
                    <div className="lg:hidden">
                      <PipelineConnector vertical />
                    </div>
                  </m.div>
                )}
              </div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}
