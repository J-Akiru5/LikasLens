"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, useEChartsTheme } from "./echarts-theme";
import { useChartColors } from "./use-chart-colors";
import { getSupabaseClient } from "@/utils/supabase/client";

interface TimeSeriesData {
  dates: string[];
  reports: number[];
  resolved: number[];
}

export function TimeSeriesChart() {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const chartTheme = useEChartsTheme();
  const c = useChartColors();

  useEffect(() => {
    async function fetchTimeSeries() {
      try {
        const supabase = getSupabaseClient();
        const { data: tickets } = await supabase
          .from("tickets")
          .select("created_at, status")
          .order("created_at", { ascending: true });

        if (tickets && tickets.length > 0) {
          const dayMap: Record<string, { reports: number; resolved: number }> = {};
          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            dayMap[key] = { reports: 0, resolved: 0 };
          }

          tickets.forEach((t: { created_at: string; status: string }) => {
            const key = t.created_at.split("T")[0];
            if (dayMap[key]) {
              dayMap[key].reports++;
              if (t.status === "resolved") dayMap[key].resolved++;
            }
          });

          const dates = Object.keys(dayMap);
          setData({
            dates,
            reports: dates.map((d) => dayMap[d].reports),
            resolved: dates.map((d) => dayMap[d].resolved),
          });
        } else {
          throw new Error("No tickets");
        }
      } catch {
        // No fabricated data — show an empty chart if the API fails
        setData({ dates: [], reports: [], resolved: [] });
      } finally {
        setLoading(false);
      }
    }
    fetchTimeSeries();
  }, []);

  const option = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "cross" as const },
    },
    legend: {
      data: ["Reports", "Resolved"],
      top: 0,
      right: 0,
      textStyle: { color: c.textMuted, fontSize: 11 },
    },
    grid: {
      top: 40,
      left: 12,
      right: 12,
      bottom: 60,
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: data?.dates ?? [],
      axisLabel: {
        color: c.textMuted,
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        rotate: 30,
      },
      axisLine: { lineStyle: { color: c.axisLine } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: c.textMuted, fontSize: 10, fontFamily: "JetBrains Mono, monospace" },
      splitLine: { lineStyle: { color: c.splitLine, type: "dashed" as const } },
    },
    dataZoom: [
      { type: "inside" as const, start: 0, end: 100 },
      {
        type: "slider" as const,
        start: 0,
        end: 100,
        height: 20,
        bottom: 8,
        borderColor: c.axisLine,
        fillerColor: "rgba(34,211,238,0.15)",
        handleStyle: { color: "#22d3ee" },
        textStyle: { color: c.textMuted, fontSize: 10 },
      },
    ],
    series: [
      {
        name: "Reports",
        type: "line",
        smooth: true,
        data: data?.reports ?? [],
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(34,211,238,0.35)" },
              { offset: 1, color: "rgba(34,211,238,0.02)" },
            ],
          },
        },
        lineStyle: { color: "#22d3ee", width: 2 },
        itemStyle: { color: "#22d3ee" },
        symbol: "circle",
        symbolSize: 4,
        markLine: {
          data: [{ type: "average" as const, name: "Avg" }],
          lineStyle: { color: "#fbbf24", type: "dashed" as const },
          label: { color: "#fbbf24", fontSize: 10 },
        },
      },
      {
        name: "Resolved",
        type: "line",
        smooth: true,
        data: data?.resolved ?? [],
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(52,211,153,0.35)" },
              { offset: 1, color: "rgba(52,211,153,0.02)" },
            ],
          },
        },
        lineStyle: { color: "#34d399", width: 2 },
        itemStyle: { color: "#34d399" },
        symbol: "circle",
        symbolSize: 4,
      },
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: "cubicOut" as const,
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-panel p-6 flex items-center justify-center" style={{ minHeight: 320 }}>
        <div className="animate-pulse text-sm text-ink/40">Loading time series...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wider">
          30-Day Trend
        </span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 300, width: "100%" }}
        theme={chartTheme}
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </div>
  );
}
