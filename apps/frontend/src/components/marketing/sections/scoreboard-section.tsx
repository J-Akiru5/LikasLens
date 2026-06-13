"use client";

import { motion } from "framer-motion";
import { PublicScoreboard } from "@likaslens/shared";

export function ScoreboardSection() {
  return (
    <section
      id="scoreboard"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          marginBottom: 40,
          display: "flex",
          flexDirection: "column",
          gap: 12,
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
          Community
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
          Public Records
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--muted)",
            lineHeight: 1.65,
            margin: 0,
            maxWidth: 480,
          }}
        >
          Recent reports being tracked and resolved across the platform.
        </p>
      </motion.div>
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          padding: "8px 0",
        }}
      >
        <PublicScoreboard />
      </div>
    </section>
  );
}
