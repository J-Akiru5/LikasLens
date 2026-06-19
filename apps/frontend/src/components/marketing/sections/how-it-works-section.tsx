"use client";

import { m } from "framer-motion";
import { Camera, Cpu, Send, Bell } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Evidence-board pipeline — replaces the identical 3-card grid.

   Each node is a distinct artifact in a real ordered flow (Capture → Classify
   → Route → Notify), so the sequence carries information the reader needs.
   Nodes vary in emphasis: the Classify node is the densest (it's the AI core).
   ───────────────────────────────────────────────────────────────────────────── */

const NODES = [
  {
    n: "01",
    Icon: Camera,
    tag: "Capture",
    title: "A citizen files evidence",
    body: "One photo from a phone. GPS and timestamp attach automatically. Nothing else is asked of the reporter in the moment.",
    artifact: "EVIDENCE FRAME",
    meta: "IMG · EXIF · GPS · TS",
    span: "lg:col-span-5",
    emphasis: "low" as const,
  },
  {
    n: "02",
    Icon: Cpu,
    tag: "Classify",
    title: "The vision model reads it",
    body: "A neuro-symbolic model identifies the violation type and severity, then reasons over Philippine environmental law to confirm it is actionable.",
    artifact: "YOLOv8 · NEURO-SYMBOLIC",
    meta: "TYPE · SEVERITY · LEGAL MATCH",
    span: "lg:col-span-7",
    emphasis: "high" as const,
  },
  {
    n: "03",
    Icon: Send,
    tag: "Route",
    title: "Routed to the right desk",
    body: "Logging and land cases to DENR. Coastal and marine to PCG. Hazardous waste to EMB. No more reports dying in the wrong inbox.",
    artifact: "AGENCY DISPATCH",
    meta: "DENR · EMB · PCG · DILG",
    span: "lg:col-span-7",
    emphasis: "low" as const,
  },
  {
    n: "04",
    Icon: Bell,
    tag: "Notify",
    title: "Tracked until it closes",
    body: "The case is stamped onto the public record. The reporter gets a receipt and is notified the moment the agency acts.",
    artifact: "PUBLIC RECEIPT",
    meta: "CASE ID · TIMESTAMP · STATUS",
    span: "lg:col-span-5",
    emphasis: "low" as const,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="ec-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Intro — no tracked uppercase eyebrow above the heading. One section
            voice; the ledger photo in the hero already set the register. */}
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
            From a single photo to an open public case.
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
            Four steps, none of them manual beyond the first. Every stage leaves
            a record the public can read back.
          </p>
        </m.div>

        {/* Pipeline — asymmetric bento, trace lines connect the flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {NODES.map(({ n, Icon, tag, title, body, artifact, meta, span, emphasis }) => {
            const high = emphasis === "high";
            return (
              <m.article
                key={n}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={`ec-casefile ${span}`}
                style={{
                  padding: high ? "30px 30px 26px" : "26px 26px 22px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  background: high ? "linear-gradient(160deg, var(--accent-subtle), var(--panel) 60%)" : "var(--panel)",
                }}
              >
                {/* Header row: tag + index. Index is real (ordered flow), so it earns its place. */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: high ? "var(--accent)" : "var(--muted)",
                    }}
                  >
                    <Icon style={{ width: 15, height: 15 }} aria-hidden="true" />
                    {tag}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-data)", fontSize: 13, fontWeight: 700,
                      color: high ? "var(--accent)" : "var(--muted-subtle)",
                      opacity: 0.7,
                    }}
                  >
                    {n}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: high ? "clamp(1.5rem, 2vw, 1.9rem)" : "clamp(1.25rem, 1.6vw, 1.5rem)",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    color: "var(--ink)",
                    margin: 0,
                    textWrap: "balance" as const,
                  }}
                >
                  {title}
                </h3>

                <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                  {body}
                </p>

                {/* Artifact strip — mono, carries real data only */}
                <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        color: high ? "var(--accent)" : "var(--ink)",
                      }}
                    >
                      {artifact}
                    </span>
                    <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--muted-subtle)", letterSpacing: "0.04em" }}>
                      {meta}
                    </span>
                  </div>
                  {/* Inline confidence bar on the AI node — ties it to the hero ledger */}
                  {high && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 9999, background: "color-mix(in oklab, var(--accent) 12%, transparent)", overflow: "hidden" }}>
                        <m.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "94.6%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: "100%", borderRadius: 9999, background: "var(--accent)" }}
                        />
                      </div>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>94.6%</span>
                    </div>
                  )}
                </div>

                {/* Dotted trace hint toward the next node (desktop) */}
                <div className="ec-trace hidden lg:block" aria-hidden="true" style={{ position: "absolute", right: -22, top: "50%", width: 18, height: 2 }} />
              </m.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
