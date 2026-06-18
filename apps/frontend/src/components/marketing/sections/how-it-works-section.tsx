"use client";

import { m } from "framer-motion";
import { Camera, Bot, CheckCircle } from "lucide-react";

import { SpotlightCard } from "@likaslens/shared";

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
      "Our advanced AI Vision Model identifies the issue type and severity, then intelligently dispatches the report to the exact government agency responsible.",
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
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 32px" }}
    >
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          marginBottom: 64,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 640,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 9999,
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            width: "fit-content",
          }}
        >
          Platform
        </span>
        <h2
          style={{
            fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          From snapshot
          <br />
          to solution
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "var(--muted)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Three steps turn every citizen report into measurable environmental action.
        </p>
      </m.div>

      <m.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {HOW_IT_WORKS.map(({ step, Icon, title, description }, i) => (
      <m.div
            key={step}
            variants={fadeUp}
            style={{
              borderRadius: 20,
              background: "var(--panel)",
              border: "1px solid var(--border)",
              position: "relative",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              cursor: "default",
              display: "flex",
              flexDirection: "column",
            }}
            whileHover={{
              y: -6,
              boxShadow: "0 20px 48px -16px color-mix(in srgb, var(--accent) 18%, transparent)",
            }}
          >
            <SpotlightCard
              spotlightColor="rgba(46,230,200,0.12)"
              style={{
                padding: 32,
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                height: "100%",
                width: "100%",
              }}
            >
            {/* Accent bottom bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, var(--accent), var(--secondary))`,
                transform: "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
              className="step-bottom-bar"
            />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `color-mix(in srgb, var(--accent) ${8 + i * 3}%, transparent)`,
                  border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon style={{ width: 28, height: 28, color: "var(--accent)" }} />
              </div>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 40,
                  fontWeight: 900,
                  color: "var(--border)",
                  lineHeight: 1,
                }}
              >
                {step}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>
                {title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                {description}
              </p>
            </div>
            </SpotlightCard>
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
