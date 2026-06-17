"use client";

import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "./echarts-theme";

export function SankeyFlow() {
  const option = {
    tooltip: {
      trigger: "item" as const,
      triggerOn: "mousemove" as const,
    },
    series: [
      {
        type: "sankey",
        layout: "none",
        emphasis: { focus: "adjacency" as const },
        nodeAlign: "left" as const,
        lineStyle: {
          color: "gradient" as const,
          curveness: 0.5,
        },
        label: {
          color: "#e2e8f0",
          fontSize: 11,
          fontFamily: "Inter, sans-serif",
        },
        nodeWidth: 18,
        nodeGap: 12,
        data: [
          { name: "Citizen Report", itemStyle: { color: "#22d3ee" } },
          { name: "AI Detection", itemStyle: { color: "#fbbf24" } },
          { name: "Community", itemStyle: { color: "#34d399" } },
          { name: "Solid Waste", itemStyle: { color: "#f87171" } },
          { name: "Water Pollution", itemStyle: { color: "#22d3ee" } },
          { name: "Deforestation", itemStyle: { color: "#34d399" } },
          { name: "Air Quality", itemStyle: { color: "#fbbf24" } },
          { name: "CENRO", itemStyle: { color: "#60a5fa" } },
          { name: "DENR-EMB", itemStyle: { color: "#a78bfa" } },
          { name: "LLDA", itemStyle: { color: "#4ade80" } },
          { name: "BFAR", itemStyle: { color: "#0ea5e9" } },
        ],
        links: [
          { source: "Citizen Report", target: "Solid Waste", value: 34 },
          { source: "Citizen Report", target: "Water Pollution", value: 28 },
          { source: "Citizen Report", target: "Air Quality", value: 12 },
          { source: "AI Detection", target: "Solid Waste", value: 22 },
          { source: "AI Detection", target: "Deforestation", value: 18 },
          { source: "AI Detection", target: "Water Pollution", value: 15 },
          { source: "Community", target: "Deforestation", value: 10 },
          { source: "Community", target: "Solid Waste", value: 8 },
          { source: "Solid Waste", target: "CENRO", value: 64 },
          { source: "Water Pollution", target: "DENR-EMB", value: 30 },
          { source: "Water Pollution", target: "LLDA", value: 13 },
          { source: "Deforestation", target: "DENR-EMB", value: 28 },
          { source: "Air Quality", target: "DENR-EMB", value: 12 },
        ],
      },
    ],
    animation: true,
    animationDuration: 1200,
    animationEasing: "cubicOut" as const,
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wider">
          Report Routing Flow
        </span>
        <span className="ml-auto font-mono text-[10px] text-ink/30">Source → Violation → Agency</span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 260, width: "100%" }}
        theme="envDark"
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </div>
  );
}
