"use client";

import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "./echarts-theme";

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

export function AqiGauge() {
  const [data, setData] = useState<AqiData | null>(null);
  const [loading, setLoading] = useState(true);

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
            width: 18,
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
          itemStyle: { color: "#e2e8f0" },
          length: "55%",
          width: 5,
        },
        axisTick: {
          distance: -18,
          length: 5,
          lineStyle: { color: "#fff", width: 1 },
        },
        splitLine: {
          distance: -22,
          length: 12,
          lineStyle: { color: "#fff", width: 2 },
        },
        axisLabel: {
          color: "#94a3b8",
          distance: 28,
          fontSize: 10,
          fontFamily: "JetBrains Mono, monospace",
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
          color: color,
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
          offsetCenter: [0, "65%"],
        },
        title: {
          offsetCenter: [0, "85%"],
          color: "#94a3b8",
          fontSize: 12,
          fontFamily: "Inter, sans-serif",
        },
        data: [{ value: aqi, name: label }],
      },
    ],
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-panel p-6 flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="animate-pulse text-sm text-ink/40">Loading AQI...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wider">
          Air Quality Index
        </span>
        <span className="ml-auto font-mono text-xs text-ink/40">Likas Bay</span>
      </div>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: 240, width: "100%" }}
        theme="envDark"
        opts={{ renderer: "canvas" }}
        notMerge
      />
      {data && (
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-ink/10">
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
