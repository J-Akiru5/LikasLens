"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, useEChartsTheme } from "./echarts-theme";
import { getSupabaseClient } from "@likaslens/shared";

interface AqiData {
  us_aqi: number;
  pm2_5: number;
  pm10: number;
  carbon_monoxide?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  ozone?: number;
}

function getAqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: "Good", color: "#34d399" };
  if (aqi <= 100) return { label: "Moderate", color: "#fbbf24" };
  if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "#fb923c" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#f87171" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#a855f7" };
  return { label: "Hazardous", color: "#7f1d1d" };
}

function useIsGhostMode() {
  const [isGhost, setIsGhost] = useState(false);
  useEffect(() => {
    const check = () => setIsGhost(document.documentElement.getAttribute("data-theme") === "ghost");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return isGhost;
}

export function AqiGauge() {
  const [data, setData] = useState<AqiData | null>(null);
  const [loading, setLoading] = useState(true);
  const isGhost = useIsGhostMode();
  const chartTheme = useEChartsTheme();

  useEffect(() => {
    async function fetchAqi() {
      try {
        const res = await fetch(
          "https://air-quality-api.open-meteo.com/v1/air-quality?" +
            "latitude=10.5&longitude=122.96" +
            "&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone" +
            "&timezone=Asia/Manila"
        );
        const json = await res.json();
        if (json.current) {
          setData({
            us_aqi: json.current.us_aqi ?? 0,
            pm2_5: json.current.pm2_5 ?? 0,
            pm10: json.current.pm10 ?? 0,
            carbon_monoxide: json.current.carbon_monoxide,
            nitrogen_dioxide: json.current.nitrogen_dioxide,
            sulphur_dioxide: json.current.sulphur_dioxide,
            ozone: json.current.ozone,
          });
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchAqi();
    const interval = setInterval(fetchAqi, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const aqi = data?.us_aqi ?? 0;
  const { label, color } = getAqiLabel(aqi);

  const tickColor = isGhost ? "#fff" : "#94a3b8";
  const pointerColor = isGhost ? "#e2e8f0" : "#475569";
  const labelColor = isGhost ? "#94a3b8" : "#64748b";

  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 500,
        splitNumber: 10,
        radius: "90%",
        center: ["50%", "55%"],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.15, "#34d399"],
              [0.3, "#fbbf24"],
              [0.45, "#fb923c"],
              [0.6, "#f87171"],
              [0.75, "#a855f7"],
              [1, "#7f1d1d"],
            ],
          },
        },
        pointer: {
          itemStyle: { color: pointerColor },
          length: "55%",
          width: 4,
        },
        axisTick: {
          distance: -14,
          length: 4,
          lineStyle: { color: tickColor, width: 1 },
        },
        splitLine: {
          distance: -18,
          length: 10,
          lineStyle: { color: tickColor, width: 2 },
        },
        axisLabel: {
          color: labelColor,
          distance: 24,
          fontSize: 9,
          fontFamily: "JetBrains Mono, monospace",
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
          color: color,
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
          offsetCenter: [0, "65%"],
        },
        title: {
          offsetCenter: [0, "85%"],
          color: labelColor,
          fontSize: 11,
          fontFamily: "Inter, sans-serif",
        },
        data: [{ value: aqi, name: label }],
      },
    ],
  };

  if (loading) {
    return (
      <div className="ios-grouped-list p-5 flex items-center justify-center" style={{ minHeight: 260 }}>
        <div className="animate-pulse text-sm text-ink/40">Loading AQI...</div>
      </div>
    );
  }

  return (
    <div className="ios-grouped-list p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        <span className="font-mono text-[10px] text-ink/50 uppercase tracking-widest">
          Air Quality Index
        </span>
        <span className="ml-auto font-mono text-[10px] text-ink/30">Likas Bay</span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 220, width: "100%" }}
        theme={chartTheme}
        opts={{ renderer: "canvas" }}
        notMerge
      />
      {data && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ink/10">
          <div className="text-center">
            <span className="block font-mono text-lg font-bold text-ink">{data.pm2_5.toFixed(1)}</span>
            <span className="font-mono text-[10px] text-ink/40 uppercase">PM2.5</span>
          </div>
          <div className="text-center">
            <span className="block font-mono text-lg font-bold text-ink">{data.pm10.toFixed(1)}</span>
            <span className="font-mono text-[10px] text-ink/40 uppercase">PM10</span>
          </div>
          <div className="text-center">
            <span className="block font-mono text-lg font-bold text-ink">{data.ozone?.toFixed(1) ?? "—"}</span>
            <span className="font-mono text-[10px] text-ink/40 uppercase">O3</span>
          </div>
        </div>
      )}
    </div>
  );
}
