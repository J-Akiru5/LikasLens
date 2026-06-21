"use client";
import { useEffect, useState, useCallback } from "react";
import {
  getAdminPredictions,
  getTickets,
} from "@likaslens/shared";
import type { HotspotPrediction, PredictionMeta } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { AdminKPIsSkeleton, EmptyState, Button } from "@likaslens/shared";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Filter,
  BarChart3,
} from "lucide-react";

const RISK_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  high: { bg: "bg-red/10", text: "text-red", ring: "ring-red/20" },
  medium: { bg: "bg-amber/10", text: "text-amber", ring: "ring-amber/20" },
  low: { bg: "bg-green/10", text: "text-green", ring: "ring-green/20" },
};

function getRiskLevel(risk: number): "high" | "medium" | "low" {
  if (risk >= 70) return "high";
  if (risk >= 40) return "medium";
  return "low";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "increasing") return <TrendingUp className="w-4 h-4 text-red" />;
  if (trend === "decreasing") return <TrendingDown className="w-4 h-4 text-green" />;
  return <Minus className="w-4 h-4 text-ink/40" />;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<HotspotPrediction[]>([]);
  const [meta, setMeta] = useState<PredictionMeta | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [violationFilter, setViolationFilter] = useState<string>("");

  const loadPredictions = useCallback(async (violationType?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        days_back: "90",
        top_n: "10",
      };
      if (violationType) {
        params.violation_type = violationType;
      }

      const [predRes, ticketsRes] = await Promise.all([
        getAdminPredictions(params),
        getTickets({ per_page: "200" }),
      ]);

      if (predRes.success) {
        setPredictions(predRes.data);
        setMeta(predRes.meta);
      }
      if (ticketsRes.success) {
        setTickets(ticketsRes.data);
      }
    } catch (err) {
      console.error("Failed to load predictions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPredictions(violationFilter || undefined);
  }, [loadPredictions, violationFilter]);

  // Extract unique violation types from predictions for the filter
  const violationTypes = Array.from(
    new Set(predictions.map((p) => p.dominant_type_code).filter((c) => c !== "MIXED"))
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="h-12 w-48 rounded-xl bg-ink/5 animate-shimmer" />
          <div className="h-5 w-72 rounded bg-ink/5 animate-shimmer" />
        </div>
        <AdminKPIsSkeleton count={3} />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5">
            <div className="h-96 rounded-xl bg-ink/5 animate-shimmer" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-panel rounded-2xl p-5 border border-ink/5 space-y-3">
                <div className="h-4 w-32 rounded bg-ink/5 animate-shimmer" />
                <div className="h-3 w-24 rounded bg-ink/5 animate-shimmer" />
                <div className="h-3 w-full rounded bg-ink/5 animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const highRiskCount = predictions.filter((p) => getRiskLevel(p.predicted_risk) === "high").length;
  const avgConfidence =
    predictions.length > 0
      ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
          Predictions
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Predictive hotspot detection based on {meta?.total_reports_analyzed ?? 0} reports from the last {meta?.days_back ?? 90} days
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="kpi-card kpi-accent-amber rounded-2xl border border-border bg-amber-500/[0.02] hover:bg-amber-500/[0.04] transition-colors duration-300 p-5 relative overflow-hidden group">
          <div 
            className="absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 text-amber-500"
            style={{ opacity: 0.05 }}
          >
            <AlertTriangle className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-red/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red" />
            </div>
            <div>
              <span className="label-pill label-pill-light">High Risk Zones</span>
              <p className="font-semibold tracking-tight text-3xl text-amber-600">
                {highRiskCount}
              </p>
            </div>
          </div>
        </div>
        <div className="kpi-card kpi-accent-muted rounded-2xl border border-border bg-ink/[0.02] hover:bg-ink/[0.04] transition-colors duration-300 p-5 relative overflow-hidden group">
          <div 
            className="absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 text-ink"
            style={{ opacity: 0.05 }}
          >
            <MapPin className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-ink/60" />
            </div>
            <div>
              <span className="label-pill label-pill-light">Predicted Zones</span>
              <p className="font-semibold tracking-tight text-3xl text-ink">
                {predictions.length}
              </p>
            </div>
          </div>
        </div>
        <div className="kpi-card kpi-accent-green rounded-2xl border border-border bg-green/[0.02] hover:bg-green/[0.04] transition-colors duration-300 p-5 relative overflow-hidden group">
          <div 
            className="absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 text-green"
            style={{ opacity: 0.05 }}
          >
            <BarChart3 className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-ink/60" />
            </div>
            <div>
              <span className="label-pill label-pill-light">Avg Confidence</span>
              <p className="font-semibold tracking-tight text-3xl text-green">
                {avgConfidence}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-ink/40" />
        <select
          value={violationFilter}
          onChange={(e) => setViolationFilter(e.target.value)}
          className="bg-panel border border-ink/10 rounded-xl px-4 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-green/20"
        >
          <option value="">All violation types</option>
          {violationTypes.map((code) => (
            <option key={code} value={code}>
              {code.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Main content: Map + Predictions list */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Map area */}
        <div className="lg:col-span-3 bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5">
          <h3 className="font-semibold tracking-tight text-xl text-ink mb-4">
            Hotspot Map
          </h3>
          <div className="relative w-full h-[480px] rounded-2xl bg-ink/[0.03] overflow-hidden border border-ink/5">
            {predictions.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <EmptyState
                  icon={AlertTriangle}
                  title="No predictions available"
                  description="Not enough report data to generate hotspot predictions. At least 10 reports are needed for the predictive model."
                />
              </div>
            ) : (
              <HotspotMap predictions={predictions} tickets={tickets} />
            )}
          </div>
        </div>

        {/* Predictions list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold tracking-tight text-xl text-ink">
            Predicted Hotspots
          </h3>
          {predictions.length === 0 ? (
            <div className="bg-panel rounded-2xl p-8 border border-ink/5 text-center">
              <MapPin className="w-8 h-8 text-ink/20 mx-auto mb-3" />
              <p className="font-mono text-sm text-muted">
                Not enough data to generate predictions. More reports are needed.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {predictions.map((prediction, index) => {
                const level = getRiskLevel(prediction.predicted_risk);
                const colors = RISK_COLORS[level];
                return (
                  <div
                    key={index}
                    className={`bg-panel rounded-2xl p-5 shadow-sm border border-ink/5 ring-1 ${colors.ring} transition-colors hover:bg-ink/[0.01]`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/40">
                            #{index + 1}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest font-bold ${colors.bg} ${colors.text}`}
                          >
                            {level} risk
                          </span>
                        </div>
                        <p className="font-medium text-sm text-ink truncate">
                          {prediction.location_name}
                        </p>
                      </div>
                      <TrendIcon trend={prediction.trend} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <p className="text-ink/40 uppercase tracking-widest text-[10px]">
                          Risk Score
                        </p>
                        <p className={`font-bold text-lg ${colors.text}`}>
                          {prediction.predicted_risk}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink/40 uppercase tracking-widest text-[10px]">
                          Confidence
                        </p>
                        <p className="font-bold text-lg text-ink">
                          {prediction.confidence}%
                        </p>
                      </div>
                      <div>
                        <p className="text-ink/40 uppercase tracking-widest text-[10px]">
                          Dominant Type
                        </p>
                        <p className="font-medium text-ink/70 truncate">
                          {prediction.dominant_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink/40 uppercase tracking-widest text-[10px]">
                          Based On
                        </p>
                        <p className="font-medium text-ink/70">
                          {prediction.based_on_reports} reports
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Simple Canvas-based Hotspot Map ---------- */

function HotspotMap({
  predictions,
  tickets,
}: {
  predictions: HotspotPrediction[];
  tickets: Ticket[];
}) {
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || predictions.length === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Gather all points (predictions + tickets) for bounds
      const allLats = [
        ...predictions.map((p) => p.lat),
        ...tickets.map((t) => Number(t.latitude)),
      ].filter((v) => !isNaN(v));
      const allLngs = [
        ...predictions.map((p) => p.lng),
        ...tickets.map((t) => Number(t.longitude)),
      ].filter((v) => !isNaN(v));

      if (allLats.length === 0) return;

      const minLat = Math.min(...allLats) - 0.01;
      const maxLat = Math.max(...allLats) + 0.01;
      const minLng = Math.min(...allLngs) - 0.01;
      const maxLng = Math.max(...allLngs) + 0.01;

      const latRange = maxLat - minLat || 0.01;
      const lngRange = maxLng - minLng || 0.01;

      const padding = 40;
      const mapWidth = width - padding * 2;
      const mapHeight = height - padding * 2;

      function toX(lng: number) {
        return padding + ((lng - minLng) / lngRange) * mapWidth;
      }
      function toY(lat: number) {
        return padding + (1 - (lat - minLat) / latRange) * mapHeight;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(0,0,0,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (mapHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        const x = padding + (mapWidth / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // Draw ticket dots
      tickets.forEach((ticket) => {
        const lat = Number(ticket.latitude);
        const lng = Number(ticket.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        ctx.beginPath();
        ctx.arc(toX(lng), toY(lat), 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fill();
      });

      // Draw hotspot circles
      predictions.forEach((prediction, index) => {
        const x = toX(prediction.lng);
        const y = toY(prediction.lat);
        const level = getRiskLevel(prediction.predicted_risk);
        const baseRadius = 20 + (prediction.predicted_risk / 100) * 30;

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, baseRadius * 1.5);
        if (level === "high") {
          gradient.addColorStop(0, "rgba(220,38,38,0.35)");
          gradient.addColorStop(1, "rgba(220,38,38,0)");
        } else if (level === "medium") {
          gradient.addColorStop(0, "rgba(245,158,11,0.3)");
          gradient.addColorStop(1, "rgba(245,158,11,0)");
        } else {
          gradient.addColorStop(0, "rgba(22,163,74,0.25)");
          gradient.addColorStop(1, "rgba(22,163,74,0)");
        }

        ctx.beginPath();
        ctx.arc(x, y, baseRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Circle border
        ctx.beginPath();
        ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle =
          level === "high"
            ? "rgba(220,38,38,0.6)"
            : level === "medium"
              ? "rgba(245,158,11,0.6)"
              : "rgba(22,163,74,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`#${index + 1}`, x, y + 4);
      });

      // Axis labels
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${minLng.toFixed(3)}`, padding, height - 10);
      ctx.fillText(`${maxLng.toFixed(3)}`, width - padding, height - 10);
      ctx.textAlign = "right";
      ctx.fillText(`${maxLat.toFixed(3)}`, padding - 5, padding + 4);
      ctx.fillText(`${minLat.toFixed(3)}`, padding - 5, height - padding + 4);
    },
    [predictions, tickets]
  );

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
