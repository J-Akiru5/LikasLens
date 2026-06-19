"use client";

import * as echarts from "echarts/core";
import { LineChart, BarChart, GaugeChart, PieChart, SankeyChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  GraphicComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useState, useEffect } from "react";

echarts.use([
  LineChart,
  BarChart,
  GaugeChart,
  PieChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  GraphicComponent,
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

export const envLightTheme = {
  backgroundColor: "transparent",
  color: [
    "#0891b2",
    "#16a34a",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#2563eb",
    "#16a34a",
    "#ea580c",
  ],
  textStyle: { color: "#334155" },
  title: {
    textStyle: { color: "#0f172a", fontSize: 16, fontWeight: 600 },
    subtextStyle: { color: "#64748b", fontSize: 12 },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { lineStyle: { color: "#cbd5e1" } },
    axisLabel: { color: "#64748b" },
    splitLine: { lineStyle: { color: "#f1f5f9" } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#cbd5e1" } },
    axisTick: { lineStyle: { color: "#cbd5e1" } },
    axisLabel: { color: "#64748b" },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
  },
  tooltip: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "#334155",
    textStyle: { color: "#e2e8f0" },
  },
  legend: { textStyle: { color: "#64748b" } },
};

echarts.registerTheme("envDark", envDarkTheme);
echarts.registerTheme("envLight", envLightTheme);

export function useEChartsTheme() {
  const [theme, setTheme] = useState<"envDark" | "envLight">("envDark");
  useEffect(() => {
    const check = () => {
      const isGhost = document.documentElement.getAttribute("data-theme") === "ghost";
      setTheme(isGhost ? "envDark" : "envLight");
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export { echarts };
