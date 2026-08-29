"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, useEChartsTheme } from "./echarts-theme";
import { useChartColors } from "./use-chart-colors";
import { getSupabaseClient } from "@/utils/supabase/client";

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

export function ViolationDonut() {
  const [data, setData] = useState<{ name: string; value: number; itemStyle: { color: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const chartTheme = useEChartsTheme();
  const c = useChartColors();

  useEffect(() => {
    async function fetchImpact() {
      try {
        const supabase = getSupabaseClient();
        const { data: tickets } = await supabase
          .from("tickets")
          .select("ai_triage_summary");

        if (tickets && tickets.length > 0) {
          const typeCounts: Record<string, number> = {};
          tickets.forEach((t: { ai_triage_summary: string | null }) => {
            const cat = t.ai_triage_summary || "other";
            typeCounts[cat] = (typeCounts[cat] || 0) + 1;
          });
          const entries = Object.entries(typeCounts);
          setData(
            entries.map(([type, count]) => ({
              name: formatType(type),
              value: count,
              itemStyle: { color: TYPE_COLORS[type] ?? "#94a3b8" },
            }))
          );
        } else {
          throw new Error("No tickets");
        }
      } catch {
        setData([
          { name: "Illegal Dumping", value: 34, itemStyle: { color: "#f87171" } },
          { name: "Water Pollution", value: 28, itemStyle: { color: "#22d3ee" } },
          { name: "Illegal Logging", value: 22, itemStyle: { color: "#34d399" } },
          { name: "Air Pollution", value: 18, itemStyle: { color: "#fbbf24" } },
          { name: "Open Burning", value: 12, itemStyle: { color: "#fb923c" } },
          { name: "Other", value: 8, itemStyle: { color: "#94a3b8" } },
        ]);
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
      right: 8,
      top: "center",
      textStyle: { color: c.textMuted, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
    },
    series: [
      {
        type: "pie",
        radius: ["48%", "72%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: {
          borderRadius: 6,
          borderColor: c.border,
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
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
        left: "30%",
        top: "44%",
        style: {
          text: total.toString(),
          textAlign: "center" as const,
          fill: c.text,
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
        },
      },
      {
        type: "text" as const,
        left: "30%",
        top: "54%",
        style: {
          text: "TOTAL",
          textAlign: "center" as const,
          fill: c.textMuted,
          fontSize: 10,
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
      <div className="rounded-2xl border border-ink/10 bg-panel p-6 flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="animate-pulse text-sm text-ink/40">Loading violations...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wider">
          Violation Breakdown
        </span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 260, width: "100%" }}
        theme={chartTheme}
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </div>
  );
}
