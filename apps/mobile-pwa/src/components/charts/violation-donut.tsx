"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, useEChartsTheme } from "./echarts-theme";
import { useChartColors } from "./use-chart-colors";
import { laravelGet } from "@likaslens/shared";
import { useTranslations } from "next-intl";

interface ReportsByType {
  [type: string]: number;
}

const TYPE_COLORS: Record<string, string> = {
  illegal_dumping: "#f87171",
  water_pollution: "#22d3ee",
  illegal_logging: "#34d399",
  air_pollution: "#fbbf24",
  open_burning: "#fb923c",
  wildlife_poaching: "#a78bfa",
  mining_violation: "#60a5fa",
  land_encroachment: "#4ade80",
  marine_pollution: "#0ea5e9",
  hazardous_waste: "#ef4444",
  deforestation: "#059669",
  other: "#94a3b8",
};

function formatType(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const VIOLATION_KEY_MAP: Record<string, string> = {
  illegal_dumping: "illegalDumping",
  water_pollution: "waterPollution",
  illegal_logging: "illegalLogging",
  air_pollution: "airPollution",
  open_burning: "other",
  wildlife_poaching: "wildlifePoaching",
  mining_violation: "miningViolation",
  land_encroachment: "landEncroachment",
  other: "other",
  unknown: "other",
};

export function ViolationDonut() {
  const t = useTranslations("violationDonut");
  const tReport = useTranslations("report");
  const [data, setData] = useState<{ name: string; value: number; itemStyle: { color: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const chartTheme = useEChartsTheme();
  const c = useChartColors();

  useEffect(() => {
    async function fetchImpact() {
      try {
        const res = await laravelGet<any>("/public/impact");
        if (res?.success && res?.data?.reports_by_type) {
          const entries = Object.entries(res.data.reports_by_type as ReportsByType);
          setData(
            entries.map(([type, count]) => ({
              name: formatType(type),
              value: count,
              itemStyle: { color: TYPE_COLORS[type] ?? "#94a3b8" },
            }))
          );
        }
      } catch {
        const fallback: Array<{ code: string; count: number }> = [
          { code: "illegal_dumping", count: 34 },
          { code: "water_pollution", count: 28 },
          { code: "illegal_logging", count: 22 },
          { code: "air_pollution", count: 18 },
          { code: "open_burning", count: 12 },
          { code: "other", count: 8 },
        ];
        setData(
          fallback.map(({ code, count }) => ({
            name: tReport(VIOLATION_KEY_MAP[code] ?? "other"),
            value: count,
            itemStyle: { color: TYPE_COLORS[code] ?? "#94a3b8" },
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const option = {
    tooltip: {
      trigger: "item" as const,
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical" as const,
      right: 4,
      top: "center",
      textStyle: { color: c.textMuted, fontSize: 10 },
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 6,
    },
    series: [
      {
        type: "pie",
        radius: ["48%", "72%"],
        center: ["32%", "50%"],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: {
          borderRadius: 5,
          borderColor: c.border,
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: "bold" as const,
            color: c.emphasisText,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        data: data,
      },
    ],
    graphic: [
      {
        type: "text" as const,
        left: "27%",
        top: "44%",
        style: {
          text: total.toString(),
          textAlign: "center" as const,
          fill: c.text,
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
        },
      },
      {
        type: "text" as const,
        left: "27%",
        top: "54%",
        style: {
          text: t("total"),
          textAlign: "center" as const,
          fill: c.textMuted,
          fontSize: 9,
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2,
        },
      },
    ],
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut" as const,
  };

  if (loading) {
    return (
      <div className="ios-grouped-list p-5 flex items-center justify-center" style={{ minHeight: 260 }}>
        <div className="animate-pulse text-sm text-ink/40">{t("loadingViolations")}</div>
      </div>
    );
  }

  return (
    <div className="ios-grouped-list p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] text-ink/50 uppercase tracking-widest">
          {t("violationBreakdown")}
        </span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 240, width: "100%" }}
        theme={chartTheme}
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </div>
  );
}
