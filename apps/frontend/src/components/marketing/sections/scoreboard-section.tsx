"use client";

import { m } from "framer-motion";
import { PublicScoreboard } from "@likaslens/shared";

/* ─────────────────────────────────────────────────────────────────────────────
   Public Records — the accountability surface. Frames the shared scoreboard
   as open case files. No redundant eyebrow; the section title carries voice.
   ───────────────────────────────────────────────────────────────────────────── */

export function ScoreboardSection() {
  return (
    <section id="scoreboard" className="ec-section" style={{ background: "var(--page)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 36, maxWidth: 720, display: "flex", flexDirection: "column", gap: 14 }}
        >
          <h2
            style={{
              fontSize: "var(--display-section)",
              fontFamily: "var(--font-heading)", fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.06,
              color: "var(--ink)", margin: 0,
              textWrap: "balance" as const,
            }}
          >
            The scoreboard governments cannot edit.
          </h2>
          <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
            Open case files, tracked from the moment they are filed. Resolution
            times and non-responses are both on the record.
          </p>
        </m.div>

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
      </div>
    </section>
  );
}
