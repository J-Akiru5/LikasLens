"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import { CheckCircle2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { laravelGet, EmptyState, formatDate } from "@likaslens/shared";
import type { PublicImpactData } from "@likaslens/shared";

/* ─────────────────────────────────────────────────────────────────────────────
   Impact — editorial band. Replaces the 4-up hero-metric SaaS grid.
   ───────────────────────────────────────────────────────────────────────────── */

function AnimatedCounter({ value, duration = 1.6 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const start = Date.now();
    const ms = duration * 1000;
    function tick() {
      const p = Math.min((Date.now() - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export function ImpactSection() {
  const t = useTranslations("impact");
  const [data, setData] = useState<PublicImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchImpact() {
      try {
        const res = await laravelGet<{ success: boolean; data: PublicImpactData }>(
          "/public/impact", controller.signal,
        );
        if (res.success) setData(res.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
    return () => controller.abort();
  }, []);

  const stats = data ?? {
    total_reports: 0, total_resolved: 0, total_citizens: 0, total_ngos: 0,
    resolution_rate: 0, recent_verified: [], reports_by_type: {},
  };
  const typeEntries = Object.entries(stats.reports_by_type);
  const maxType = typeEntries.length > 0 ? Math.max(...typeEntries.map(([, c]) => c)) : 1;

  const TYPE_MAP: Record<string, string> = {
    "Environmental Hazard": t("typeHazard"),
    "Waste Management": t("typeWaste"),
    "Wildlife Protection": t("typeWildlife"),
    "Air Quality": t("typeAir"),
    "Pollution": t("typePollution"),
    "Water Quality": t("typeWater"),
    "Land Use": t("typeLand"),
    "Coastal Pollution": t("typeCoastal"),
    "Forestry Violation": t("typeForestry"),
  };

  const TITLE_MAP: Record<string, string> = {
    "Illegal Dumping Detected": t("resDumping"),
    "Wildfire Risk Assessment": t("resWildfire"),
    "Coastal Erosion Threat": t("resCoastal"),
    "Illegal Wildlife Trafficking": t("resTrafficking"),
    "Roadside Erosion Hazard": t("resErosion"),
  };

  return (
    <section id="impact" className="ec-section" style={{ background: "var(--page)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Editorial intro */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 48, maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <h2
            style={{
              fontSize: "var(--display-section)",
              fontFamily: "var(--font-heading)", fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.06, color: "var(--ink)",
              margin: 0, textWrap: "balance" as const,
            }}
          >
            {t("title")}
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
            {t("subtitle")}
          </p>
        </m.div>

        {/* Hero number + photo band */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-6">
          {/* Hero number card */}
          <m.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="group hover:shadow-xl transition-all duration-500"
            style={{ padding: "40px 36px 34px", background: "var(--panel)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 28, borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }}
          >
            <div>
              <p style={{ fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px" }}>
                {t("publicRecordCases")}
              </p>
              <span style={{ display: "block", fontSize: "clamp(3.5rem, 8vw, 6rem)", fontFamily: "var(--font-heading)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, color: "var(--accent)" }}>
                {loading ? <span style={{ opacity: 0.3 }}>—</span> : <AnimatedCounter value={stats.total_reports} />}
              </span>
            </div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingTop: 22, borderTop: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontFamily: "var(--font-data)", fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  {loading ? "—" : <AnimatedCounter value={stats.total_resolved} duration={1.4} />}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>{t("resolved")}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-data)", fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  {loading ? "—" : <AnimatedCounter value={stats.total_citizens} duration={1.4} />}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>{t("citizensReporting")}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-data)", fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  {loading ? "—" : stats.total_ngos}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>{t("partnerAgencies")}</p>
              </div>
            </div>
          </m.div>

          {/* Forensic photo tile */}
          <m.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group hover:shadow-xl transition-all duration-500"
            style={{ borderRadius: "20px", minHeight: 260, position: "relative", border: "1px solid var(--border)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)", overflow: "hidden" }}
          >
            <Image
              src="/images/impact_ridge_to_reef_3d.webp"
              alt="A river winding through forested Philippine highlands"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              style={{ objectFit: "cover", objectPosition: "center", transform: "scale(1.2)" }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 32px 32px", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255, 255, 255, 0.95)", margin: 0, maxWidth: 320, lineHeight: 1.5, fontWeight: 500, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                {t("ridgeToReefDesc")}
              </p>
            </div>
          </m.div>
        </div>

        {/* Breakdown ledger — by type + recently resolved */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reports by type */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="group hover:shadow-lg transition-all duration-500"
            style={{ padding: 28, background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: "-0.01em", color: "var(--ink)", margin: "0 0 20px" }}>
              {t("reportsByType")}
            </h3>
            {typeEntries.length === 0 ? (
              <EmptyState svg="reports" title={t("noClassificationData")} description={t("reportsByTypeDesc")} className="py-10" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {typeEntries.map(([name, count]) => {
                  const pct = maxType > 0 ? (count / maxType) * 100 : 0;
                  const localizedName = TYPE_MAP[name] ?? name;
                  return (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{localizedName}</span>
                        <span style={{ fontFamily: "var(--font-data)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 9999, background: "color-mix(in oklab, var(--accent) 10%, transparent)", overflow: "hidden" }}>
                        <m.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ height: "100%", borderRadius: 9999, background: "var(--accent)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </m.div>

          {/* Recently resolved */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group hover:shadow-lg transition-all duration-500"
            style={{ padding: 28, background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: "-0.01em", color: "var(--ink)", margin: "0 0 16px" }}>
              {t("recentlyResolved")}
            </h3>
            {stats.recent_verified.length === 0 ? (
              <EmptyState svg="search" title={t("noVerifiedReports")} description={t("resolvedReportsDesc")} className="py-10" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {stats.recent_verified.slice(0, 5).map((item, idx, arr) => {
                  const localizedTitle = (item.title && TITLE_MAP[item.title]) ? TITLE_MAP[item.title] : (item.title ?? t("environmentalReport"));
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "color-mix(in oklab, var(--green) 14%, transparent)", border: "1px solid color-mix(in oklab, var(--green) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: "var(--green)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, lineHeight: 1.4 }}>{localizedTitle}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-data)", fontSize: 10, color: "var(--muted)" }}>
                            <MapPin style={{ width: 10, height: 10 }} /> {item.location}
                          </span>
                          <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--muted)" }}>{formatDate(item.date, "short")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </m.div>
        </div>
      </div>
    </section>
  );
}
