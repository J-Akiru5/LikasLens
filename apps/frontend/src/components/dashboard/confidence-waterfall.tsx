"use client";

import ReactECharts from "echarts-for-react";
import { envDarkTheme } from "./echarts-theme";
import type { ConfidenceBreakdown } from "@likaslens/shared";

// ── Helpers ────────────────────────────────────────────────────────────

const LABELS: Record<keyof ConfidenceBreakdown, string> = {
  visual: "Visual (YOLO)",
};

const COLORS: Record<keyof ConfidenceBreakdown, string> = {
  visual: "#22d3ee",
};

const WEIGHTS: Record<keyof ConfidenceBreakdown, number> = {
  visual: 1,
};

// ── Component ──────────────────────────────────────────────────────────

interface ConfidenceWaterfallProps {
  breakdown: ConfidenceBreakdown;
  finalConfidence: number;
  height?: number;
}

export function ConfidenceWaterfall({
  breakdown,
  finalConfidence,
  height = 220,
}: ConfidenceWaterfallProps) {
  const keys = Object.keys(breakdown) as (keyof ConfidenceBreakdown)[];

  // Build waterfall data: base → +visual → +community → +geo → final
  const weightedContributions = keys.map(
    (k) => breakdown[k] * WEIGHTS[k]
  );
  const cumulativeBase = [0, ...weightedContributions.slice(0, -1)];
  const runningTotal = weightedContributions.reduce(
    (acc, v) => {
      acc.push(acc[acc.length - 1] + v);
      return acc;
    },
    [0]
  );

  // Transparent base for waterfall effect
  const baseData = runningTotal.slice(0, -1).map((v) => v);
  // Actual contribution bars
  const contributionData = weightedContributions.map((v) => v);

  const option = {
    backgroundColor: envDarkTheme.backgroundColor,
    color: envDarkTheme.color,
    textStyle: envDarkTheme.textStyle,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: Array<{ seriesName: string; value: number; dataIndex: number }>) => {
        const contrib = params.find((p) => p.seriesName === "Contribution");
        if (!contrib) return "";
        const key = keys[contrib.dataIndex];
        const raw = breakdown[key];
        const weighted = raw * WEIGHTS[key];
        return `<div style="font-size:12px">
          <strong>${LABELS[key]}</strong><br/>
          Raw: ${(raw * 100).toFixed(0)}% × Weight: ${(WEIGHTS[key] * 100).toFixed(0)}%<br/>
          <span style="color:${COLORS[key]}">Contribution: ${(weighted * 100).toFixed(1)}%</span>
        </div>`;
      },
    },
    grid: { top: 30, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: "category",
      data: keys.map((k) => LABELS[k]),
      axisLabel: { fontSize: 10, color: "#94a3b8", rotate: 0 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      max: 1,
      axisLabel: {
        fontSize: 10,
        color: "#94a3b8",
        formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
      },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.1)" } },
    },
    series: [
      // Invisible base for waterfall
      {
        name: "Base",
        type: "bar",
        stack: "waterfall",
        itemStyle: { color: "transparent" },
        data: baseData,
        emphasis: { itemStyle: { color: "transparent" } },
      },
      // Actual contribution
      {
        name: "Contribution",
        type: "bar",
        stack: "waterfall",
        barWidth: "45%",
        data: contributionData.map((v, i) => ({
          value: v,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: COLORS[keys[i]] },
                { offset: 1, color: `${COLORS[keys[i]]}88` },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          fontSize: 11,
          fontWeight: 600,
          formatter: (params: { value: number }) =>
            `+${(params.value * 100).toFixed(1)}%`,
          color: "#e2e8f0",
        },
      },
      // Final confidence marker
      {
        name: "Final",
        type: "scatter",
        symbol: "diamond",
        symbolSize: 14,
        data: [[keys.length - 1, finalConfidence]],
        itemStyle: {
          color: finalConfidence >= 0.7 ? "#22c55e" : finalConfidence >= 0.4 ? "#f59e0b" : "#ef4444",
          shadowBlur: 8,
          shadowColor:
            finalConfidence >= 0.7
              ? "rgba(34,197,94,0.4)"
              : finalConfidence >= 0.4
              ? "rgba(245,158,11,0.4)"
              : "rgba(239,68,68,0.4)",
        },
        label: {
          show: true,
          position: "right",
          fontSize: 12,
          fontWeight: 700,
          formatter: `Final: ${(finalConfidence * 100).toFixed(0)}%`,
          color: "#e2e8f0",
        },
      },
    ],
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut",
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
