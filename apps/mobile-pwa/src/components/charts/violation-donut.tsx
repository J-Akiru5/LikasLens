"use client";

import { useEffect, useState, useMemo } from "react";
import { laravelGet } from "@likaslens/shared";

interface ReportsByType {
  [type: string]: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "water quality": "#06b6d4",
  "water pollution": "#06b6d4",
  "wildlife protection": "#8b5cf6",
  "air quality": "#f59e0b",
  "air pollution": "#f59e0b",
  "pollution": "#ef4444",
  "environmental hazard": "#ec4899",
  "waste management": "#f97316",
  "waste dumping": "#f43f5e",
  "illegal dumping": "#f43f5e",
  "land use": "#84cc16",
  "land encroachment": "#4ade80",
  "coastal pollution": "#0ea5e9",
  "marine pollution": "#0ea5e9",
  "forestry violation": "#10b981",
  "illegal logging": "#059669",
  "open burning": "#d97706",
  "mining violation": "#3b82f6",
  "hazardous waste": "#ef4444",
  "deforestation": "#059669",
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
  "#3b82f6", // Blue
  "#14b8a6", // Teal
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImpact() {
      try {
        const res = await laravelGet<any>("/public/impact");
        if (res?.success && res?.data?.reports_by_type) {
          const entries = Object.entries(res.data.reports_by_type as ReportsByType);
          const totalCount = entries.reduce((sum, [, count]) => sum + count, 0);

          const sorted = entries
            .sort((a, b) => b[1] - a[1])
            .map(([type, count], idx) => {
              const name = normalizeCategoryName(type);
              const color = getCategoryColor(name, idx);
              return {
                name,
                value: count,
                color,
                percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
              };
            });

          setData(sorted);
        } else {
          throw new Error("No data");
        }
      } catch {
        const fallbackRaw = [
          { name: "Water Pollution", value: 28 },
          { name: "Illegal Dumping", value: 34 },
          { name: "Illegal Logging", value: 22 },
          { name: "Air Pollution", value: 18 },
          { name: "Open Burning", value: 12 },
          { name: "Wildlife Protection", value: 10 },
          { name: "Mining Violation", value: 8 },
          { name: "Coastal Pollution", value: 6 },
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
    fetchImpact();
  }, []);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  // SVG Donut Calculations
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~427.256

  const segments = useMemo(() => {
    if (total === 0) return [];
    let accumulatedAngle = 0;
    const GAP = data.length > 1 ? 3 : 0;

    return data.map((item) => {
      const segmentRatio = item.value / total;
      const strokeLength = Math.max(segmentRatio * CIRCUMFERENCE - GAP, 1);
      const dashArray = `${strokeLength} ${CIRCUMFERENCE - strokeLength}`;
      const dashOffset = -accumulatedAngle;
      accumulatedAngle += segmentRatio * CIRCUMFERENCE;

      return {
        ...item,
        dashArray,
        dashOffset,
      };
    });
  }, [data, total, CIRCUMFERENCE]);

  const activeItem = useMemo(() => {
    if (!selectedCategory) return null;
    return data.find((d) => d.name === selectedCategory) || null;
  }, [selectedCategory, data]);

  if (loading) {
    return (
      <div className="bg-panel rounded-2xl p-6 border border-ink/[0.08] dark:border-white/10 shadow-xs flex items-center justify-center min-h-[280px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full border-4 border-ink/10 border-t-emerald-500 animate-spin" />
          <span className="text-xs text-ink/40 font-mono">Loading violation breakdown...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-2xl p-4 border border-ink/[0.08] dark:border-white/10 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-mono text-[10px] text-ink/50 uppercase tracking-widest font-semibold block">
            Violation Breakdown
          </span>
          <span className="text-[11px] text-ink/60">Categorical incident distribution</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
          {data.length} Types
        </span>
      </div>

      {/* SVG Donut Chart */}
      <div className="relative h-[210px] w-full flex items-center justify-center my-1">
        <svg
          viewBox="0 0 200 200"
          className="w-[190px] h-[190px] transform -rotate-90"
        >
          {/* Background Track Ring */}
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-ink/[0.05] dark:text-white/[0.05]"
            strokeWidth="18"
          />

          {/* Color Segments */}
          {segments.map((seg) => {
            const isSelected = selectedCategory === seg.name;
            return (
              <circle
                key={seg.name}
                cx="100"
                cy="100"
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={isSelected ? "22" : "18"}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                style={{
                  filter: isSelected ? `drop-shadow(0 0 8px ${seg.color})` : "none",
                  transformOrigin: "center",
                }}
                onClick={() =>
                  setSelectedCategory(selectedCategory === seg.name ? null : seg.name)
                }
              />
            );
          })}
        </svg>

        {/* Center Statistical Hero */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
          style={{ transform: "rotate(0deg)" }}
        >
          {activeItem ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-90 duration-200">
              <span
                className="text-2xl font-black font-mono tracking-tight leading-none"
                style={{ color: activeItem.color }}
              >
                {activeItem.value}
              </span>
              <span className="text-[10px] font-mono font-bold text-ink/70 mt-1 uppercase max-w-[90px] truncate">
                {activeItem.name}
              </span>
              <span className="text-[9px] font-mono text-ink/40">
                {activeItem.percent}% of total
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-ink tracking-tight leading-none">
                {total}
              </span>
              <span className="text-[9px] font-mono font-bold text-ink/40 tracking-widest mt-1 uppercase">
                Total Reports
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Legend Cards with Vibrant Colors */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-ink/5">
        {data.map((item) => {
          const isSelected = selectedCategory === item.name;
          return (
            <button
              key={item.name}
              onClick={() =>
                setSelectedCategory(selectedCategory === item.name ? null : item.name)
              }
              className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? "bg-ink text-panel border-ink shadow-sm"
                  : "bg-ink/[0.02] border-ink/[0.06] hover:bg-ink/[0.05]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 6px ${item.color}60`,
                  }}
                />
                <span
                  className={`text-[11px] font-bold truncate ${
                    isSelected ? "text-panel" : "text-ink"
                  }`}
                >
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-panel/20 text-panel"
                      : "bg-ink/[0.05] text-ink/70"
                  }`}
                >
                  {item.value}
                </span>
                <span
                  className={`text-[9px] font-mono ${
                    isSelected ? "text-panel/70" : "text-ink/40"
                  }`}
                >
                  {item.percent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ViolationDonut;
