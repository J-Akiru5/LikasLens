"use client";

import { m } from "framer-motion";
import { PublicScoreboard } from "@likaslens/shared";
import { useTranslations } from "next-intl";

/* ─────────────────────────────────────────────────────────────────────────────
   Public Records — the accountability surface. Frames the shared scoreboard
   as open case files. No redundant eyebrow; the section title carries voice.
   ───────────────────────────────────────────────────────────────────────────── */

export function ScoreboardSection() {
  const t = useTranslations("landing");
  return (
    <section id="scoreboard" className="ec-section" style={{ background: "transparent" }}>
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
            {t("publicRecordsTitle")}
          </h2>
          <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
            {t("publicRecordDesc")}
          </p>
        </m.div>

        <div
          className="group hover:shadow-lg transition-all duration-500"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            overflow: "hidden",
            padding: "8px 0",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
          }}
        >
          <PublicScoreboard />
        </div>
      </div>
    </section>
  );
}
