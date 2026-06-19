"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, useEChartsTheme } from "./echarts-theme";
import { useChartColors } from "./use-chart-colors";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse } from "@likaslens/shared";

interface TimeSeriesEntry {
  date: string;
  count: number;
  resolved: number;
}

interface AnalyticsData {
  time_series: TimeSeriesEntry[];
}

export function TimeSeriesChart() {
  const [data, setData] = useState<{ dates: string[]; reports: number[]; resolved: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const chartTheme = useEChartsTheme();
  const c = useChartColors();

  useEffect(() => {
    async function fetchTimeSeries() {
      try {
        const res = await laravelGet<ApiResponse<AnalyticsData>>("/analytics/dashboard");
        const analytics = res?.data;
        if (analytics?.time_series) {
          setData({
            dates: analytics.time_series.map((t) => t.date),
            reports: analytics.time_series.map((t) => t.count),
            resolved: analytics.time_series.map((t) => t.resolved ?? 0),
          });
        }
      } catch {
        // Fallback mock
        const now = new Date();
        const dates = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (29 - i));
          return d.toISOString().split("T")[0];
        });
        setData({
          dates,
          reports: dates.map(() => Math.floor(Math.random() * 20 + 5)),
          resolved: dates.map(() => Math.floor(Math.random() * 15 + 2)),
        });
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
      textStyle: { color: c.textMuted, fontSize: 10 },
    },
    grid: {
      top: 36,
      left: 8,
      right: 8,
      bottom: 56,
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: data?.dates ?? [],
      axisLabel: {
        color: c.textMuted,
        fontSize: 9,
        fontFamily: "JetBrains Mono, monospace",
        rotate: 30,
      },
      axisLine: { lineStyle: { color: c.axisLine } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: c.textMuted, fontSize: 9, fontFamily: "JetBrains Mono, monospace" },
      splitLine: { lineStyle: { color: c.splitLine, type: "dashed" as const } },
    },
    dataZoom: [
      { type: "inside" as const, start: 0, end: 100 },
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
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(34,211,238,0.35)" },
              { offset: 1, color: "rgba(34,211,238,0.02)" },
            ],
          },
        },
        lineStyle: { color: "#22d3ee", width: 2 },
        itemStyle: { color: "#22d3ee" },
        symbol: "circle",
        symbolSize: 3,
        markLine: {
          data: [{ type: "average" as const, name: "Avg" }],
          lineStyle: { color: "#fbbf24", type: "dashed" as const },
          label: { color: "#fbbf24", fontSize: 9 },
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
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(52,211,153,0.35)" },
              { offset: 1, color: "rgba(52,211,153,0.02)" },
            ],
          },
        },
        lineStyle: { color: "#34d399", width: 2 },
        itemStyle: { color: "#34d399" },
        symbol: "circle",
        symbolSize: 3,
      },
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: "cubicOut" as const,
  };

  if (loading) {
    return (
      <div className="ios-grouped-list p-5 flex items-center justify-center" style={{ minHeight: 300 }}>
        <div className="animate-pulse text-sm text-ink/40">Loading trend...</div>
      </div>
    );
  }

  return (
    <div className="ios-grouped-list p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] text-ink/50 uppercase tracking-widest">
          30-Day Trend
        </span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 280, width: "100%" }}
        theme={chartTheme}
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </div>
  );
}
