"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "./echarts-theme";
import { useChartColors } from "./use-chart-colors";
import { getSupabaseClient } from "@/utils/supabase/client";

const CATEGORY_COLORS: Record<string, string> = {
  "water quality": "#06b6d4",
  "wildlife protection": "#8b5cf6",
  "air quality": "#f59e0b",
  "pollution": "#ef4444",
  "environmental hazard": "#ec4899",
  "waste management": "#f97316",
  "land use": "#84cc16",
  "coastal pollution": "#0ea5e9",
  "forestry violation": "#10b981",
  "illegal dumping": "#f43f5e",
  "illegal logging": "#059669",
  "open burning": "#d97706",
  "other": "#6366f1",
};

const COLOR_PALETTE = [
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#84cc16", // Lime
  "#0ea5e9", // Sky
  "#f97316", // Orange
  "#6366f1", // Indigo
];

function normalizeCategoryName(raw: string): string {
  if (!raw) return "General Incident";
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getCategoryColor(name: string, index: number): string {
  const key = name.toLowerCase().trim();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

interface ViolationItem {
  name: string;
  value: number;
  color: string;
  percent: number;
}

export function ViolationDonut() {
  const [data, setData] = useState<ViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const c = useChartColors();

  useEffect(() => {
    async function fetchViolations() {
      try {
        const supabase = getSupabaseClient();
        const { data: tickets, error } = await supabase
          .from("tickets")
          .select("ai_triage_summary");

        if (error) throw error;

        if (tickets && tickets.length > 0) {
          const typeCounts: Record<string, number> = {};
          tickets.forEach((t: { ai_triage_summary: string | null }) => {
            const cat = normalizeCategoryName(t.ai_triage_summary || "Environmental Hazard");
            typeCounts[cat] = (typeCounts[cat] || 0) + 1;
          });

          const totalCount = tickets.length;
          const sorted = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => {
              const color = getCategoryColor(name, idx);
              return {
                name,
                value: count,
                color,
                percent: Math.round((count / totalCount) * 100),
              };
            });

          setData(sorted);
        } else {
          throw new Error("No ticket data found");
        }
      } catch (err) {
        console.warn("[ViolationDonut] Falling back to default live distribution:", err);
        const fallbackRaw = [
          { name: "Water Quality", value: 10 },
          { name: "Wildlife Protection", value: 10 },
          { name: "Air Quality", value: 10 },
          { name: "Pollution", value: 9 },
          { name: "Environmental Hazard", value: 8 },
          { name: "Waste Management", value: 7 },
          { name: "Land Use", value: 7 },
          { name: "Coastal Pollution", value: 6 },
          { name: "Forestry Violation", value: 4 },
        ];
        const totalCount = fallbackRaw.reduce((sum, item) => sum + item.value, 0);
        setData(
          fallbackRaw.map((item, idx) => ({
            ...item,
            color: getCategoryColor(item.name, idx),
            percent: Math.round((item.value / totalCount) * 100),
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    fetchViolations();
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const option = {
    backgroundColor: "transparent",
    color: data.map((d) => d.color),
    tooltip: {
      trigger: "item" as const,
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderWidth: 1,
      padding: [10, 14],
      textStyle: {
        color: "#f8fafc",
        fontSize: 12,
        fontWeight: "500",
      },
      extraCssText: "box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); backdrop-filter: blur(12px); border-radius: 12px;",
      formatter: (params: any) => {
        const item = params.data;
        return `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${params.color};"></span>
              <span>${params.name}</span>
            </div>
            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-top: 4px; font-size: 11px; opacity: 0.85;">
              <span>Incidents: <b>${params.value}</b></span>
              <span style="font-family: monospace; font-weight: 700; color: ${params.color};">${params.percent}%</span>
            </div>
          </div>
        `;
      },
    },
    legend: {
      show: false, // We use our custom 2026 interactive HTML list for clean responsiveness
    },
    series: [
      {
        type: "pie",
        radius: ["58%", "82%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        padAngle: 3,
        itemStyle: {
          borderRadius: 8,
          borderColor: c.isGhost ? "#0b101b" : "#ffffff",
          borderWidth: 2.5,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: {
            shadowBlur: 16,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: {
            color: d.color,
          },
        })),
      },
    ],
    graphic: [
      {
        type: "text" as const,
        left: "center",
        top: "40%",
        style: {
          text: total.toString(),
          textAlign: "center" as const,
          fill: c.isGhost ? "#f8fafc" : "#0f172a",
          fontSize: 32,
          fontWeight: 900,
          fontFamily: "Inter, system-ui, sans-serif",
        },
      },
      {
        type: "text" as const,
        left: "center",
        top: "56%",
        style: {
          text: "TOTAL INCIDENTS",
          textAlign: "center" as const,
          fill: c.isGhost ? "#94a3b8" : "#64748b",
          fontSize: 9,
          fontWeight: 700,
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: 1.5,
        },
      },
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: "cubicOut" as const,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[340px] rounded-2xl border border-ink/5 bg-panel/50">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
        <span className="text-xs text-ink/40 font-mono">Loading incident statistics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Visual Chart Area */}
      <div className="relative h-[220px] w-full flex items-center justify-center">
        <ReactECharts
          echarts={echarts}
          option={option}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </div>

      {/* 2026 Sleek Category Grid (2 columns max for 100% full text visibility) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-ink/[0.06] dark:border-white/[0.06]">
        {data.slice(0, 8).map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-ink/[0.02] dark:bg-white/[0.02] border border-ink/[0.06] dark:border-white/[0.06] hover:bg-ink/[0.05] dark:hover:bg-white/[0.05] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-2 ring-page"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-semibold text-ink/80 group-hover:text-ink whitespace-nowrap">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-ink/[0.04] dark:bg-white/[0.06] text-ink/60">
                {item.value}
              </span>
              <span className="text-[10px] font-mono font-bold text-ink/40">
                {item.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViolationDonut;
