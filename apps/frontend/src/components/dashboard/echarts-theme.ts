"use client";

import * as echarts from "echarts/core";
import { LineChart, BarChart, GaugeChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  BarChart,
  GaugeChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export const envDarkTheme = {
  backgroundColor: "transparent",
  color: [
    "#22d3ee",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#60a5fa",
    "#4ade80",
    "#fb923c",
  ],
  textStyle: { color: "#e2e8f0" },
  title: {
    textStyle: { color: "#f1f5f9", fontSize: 16, fontWeight: 600 },
    subtextStyle: { color: "#94a3b8", fontSize: 12 },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#334155" } },
    axisTick: { lineStyle: { color: "#334155" } },
    axisLabel: { color: "#94a3b8" },
    splitLine: { lineStyle: { color: "#1e293b" } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#334155" } },
    axisTick: { lineStyle: { color: "#334155" } },
    axisLabel: { color: "#94a3b8" },
    splitLine: { lineStyle: { color: "#1e293b", type: "dashed" as const } },
  },
  tooltip: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "#334155",
    textStyle: { color: "#e2e8f0" },
  },
  legend: { textStyle: { color: "#94a3b8" } },
};

export function initECharts() {
  echarts.registerTheme("envDark", envDarkTheme);
  return echarts;
}

export { echarts };
