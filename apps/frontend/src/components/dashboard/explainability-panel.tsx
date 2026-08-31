"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Brain,
  Scale,
  MapPin,
  Users,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Sparkles,
  Link2,
} from "lucide-react";
import { getSupabaseClient } from "@likaslens/shared";
import { ConfidenceWaterfall } from "./confidence-waterfall";
import type {
  TicketExplainResponse,
  RuleChain,
  NeighbourTicket,
} from "@likaslens/shared";

// ── Types ──────────────────────────────────────────────────────────────

interface ExplainPanelProps {
  ticketId: string;
  /** Fallback data when explain endpoint is unavailable */
  fallback?: {
    category?: string;
    confidence?: number;
    ai_triage_summary?: string;
  };
}

type TabId = "breakdown" | "rules" | "similar" | "counterfactual";

// ── Statute Chip ───────────────────────────────────────────────────────

function StatuteChip({ statute }: { statute: string }) {
  const shortName = statute.includes("(")
    ? statute.split("(")[0].trim()
    : statute.split("—")[0].trim();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple/10 text-purple text-xs font-medium border border-purple/20">
      <Scale className="w-3 h-3" />
      {shortName}
    </span>
  );
}

// ── Agency Chip ────────────────────────────────────────────────────────

function AgencyChip({ agency }: { agency: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium border border-accent/20">
      <Link2 className="w-3 h-3" />
      {agency}
    </span>
  );
}

// ── Neighbour Card ─────────────────────────────────────────────────────

function NeighbourCard({ ticket }: { ticket: NeighbourTicket }) {
  const statusColors: Record<string, string> = {
    open: "bg-red-50 text-red-600",
    investigating: "bg-amber/10 text-amber",
    monitoring: "bg-purple/10 text-purple",
    resolved: "bg-green/10 text-green",
    closed: "bg-ink/10 text-ink/60",
  };
  const confPct = (ticket.ai_confidence * 100).toFixed(0);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5 hover:border-ink/10 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink truncate">{ticket.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              statusColors[ticket.status] ?? "bg-ink/10 text-ink/60"
            }`}
          >
            {ticket.status}
          </span>
          <span className="text-[10px] text-ink/40">
            Conf: {confPct}%
          </span>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-ink/30 shrink-0" />
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────

export function ExplainabilityPanel({ ticketId, fallback }: ExplainPanelProps) {
  const [data, setData] = useState<TicketExplainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("breakdown");

  const fetchExplain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getSupabaseClient();
      const { data: res, error } = await db.from("tickets").select("*").eq("id", ticketId).single();
      if (res) {
        setData(res as unknown as TicketExplainResponse);
      } else {
        setError("Explain data unavailable");
      }
    } catch {
      setError("Unable to load AI explanation");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchExplain();
  }, [fetchExplain]);

  // Use data or fallback
  const category = data?.category ?? fallback?.category ?? "Unknown";
  const confidence = data?.confidence ?? fallback?.confidence ?? 0;
  const breakdown = data?.confidence_breakdown;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "breakdown", label: "Confidence", icon: Brain },
    { id: "rules", label: "Rules", icon: Scale },
    { id: "similar", label: "Similar", icon: Users },
    { id: "counterfactual", label: "What-If", icon: Sparkles },
  ];

  return (
    <div className="bg-panel rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ink/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">AI Explainability</h3>
            <p className="text-xs text-ink/50">
              Confidence breakdown and rule reasoning for this incident
            </p>
          </div>
        </div>
      </div>

      {/* Confidence badge */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink/50">Category:</span>
            <span className="text-xs font-semibold text-ink">{category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink/50">Confidence:</span>
            <span
              className={`text-sm font-bold ${
                confidence >= 0.7
                  ? "text-green"
                  : confidence >= 0.4
                  ? "text-amber"
                  : "text-red"
              }`}
            >
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-5 flex gap-1 border-b border-ink/5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all rounded-t-lg -mb-px ${
              activeTab === id
                ? "text-purple border-b-2 border-purple bg-purple/5"
                : "text-ink/40 hover:text-ink/70"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 min-h-[280px]">
        {loading && (
          <div className="flex flex-col items-center justify-center h-[240px] gap-3">
            <Loader2 className="w-6 h-6 text-purple animate-spin" />
            <span className="text-xs text-ink/50">Analyzing incident...</span>
          </div>
        )}

        {error && !data && (
          <div className="flex flex-col items-center justify-center h-[240px] gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-amber/40" />
            <p className="text-xs text-ink/50">{error}</p>
            <button
              onClick={fetchExplain}
              className="text-xs text-purple font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Confidence Breakdown Tab ──────────────────────── */}
            {activeTab === "breakdown" && (
              <div className="space-y-4">
                {breakdown ? (
                  <ConfidenceWaterfall
                    breakdown={breakdown}
                    finalConfidence={confidence}
                    height={200}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[180px] gap-2 text-center">
                    <Brain className="w-8 h-8 text-ink/15" />
                    <p className="text-xs text-ink/40">
                      No breakdown data available
                    </p>
                  </div>
                )}

                {/* AI triage summary */}
                {fallback?.ai_triage_summary && (
                  <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-ink/40 font-medium mb-1">
                      AI Triage Summary
                    </p>
                    <p className="text-xs text-ink/70 leading-relaxed">
                      {fallback.ai_triage_summary}
                    </p>
                  </div>
                )}

                {/* Explanation of each factor */}
                {breakdown && (
                  <div className="space-y-2">
                    <FactorExplanation
                      label="Visual Detection (YOLO)"
                      value={breakdown.visual}
                      description="Object detection confidence from YOLOv8 model analyzing the uploaded image"
                      color="text-cyan"
                    />
                    <FactorExplanation
                      label="Community Corroboration"
                      value={breakdown.community_corroboration}
                      description="Score boosted when multiple reporters submit similar reports (chain)"
                      color="text-green"
                    />
                    <FactorExplanation
                      label="Geographic Proximity"
                      value={breakdown.geo_within_known_zone}
                      description="Score boosted when other reports exist within ~5km radius"
                      color="text-purple"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Rules Tab ─────────────────────────────────────── */}
            {activeTab === "rules" && data?.rule_chain && (
              <div className="space-y-4">
                <RuleChainDisplay ruleChain={data.rule_chain} />
              </div>
            )}

            {activeTab === "rules" && !data?.rule_chain && (
              <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-center">
                <Scale className="w-8 h-8 text-ink/15" />
                <p className="text-xs text-ink/40">
                  Rule chain data not available
                </p>
              </div>
            )}

            {/* ── Similar Tab ───────────────────────────────────── */}
            {activeTab === "similar" && data?.neighbours && (
              <div className="space-y-2">
                {data.neighbours.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-center">
                    <Users className="w-8 h-8 text-ink/15" />
                    <p className="text-xs text-ink/40">
                      No similar incidents found
                    </p>
                  </div>
                )}
                {data.neighbours.map((n) => (
                  <NeighbourCard key={n.id} ticket={n} />
                ))}
              </div>
            )}

            {activeTab === "similar" && !data?.neighbours && (
              <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-center">
                <Users className="w-8 h-8 text-ink/15" />
                <p className="text-xs text-ink/40">
                  Similar incidents data not available
                </p>
              </div>
            )}

            {/* ── Counterfactual Tab ────────────────────────────── */}
            {activeTab === "counterfactual" && (
              <div className="space-y-4">
                <CounterfactualPanel
                  confidence={confidence}
                  breakdown={breakdown}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function FactorExplanation({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: number;
  description: string;
  color: string;
}) {
  const pct = (value * 100).toFixed(0);
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-ink/[0.02] border border-ink/5">
      <div className={`mt-0.5 w-2 h-2 rounded-full ${color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-ink">{label}</span>
          <span className={`text-xs font-bold ${color}`}>{pct}%</span>
        </div>
        <p className="text-[11px] text-ink/50 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function RuleChainDisplay({ ruleChain }: { ruleChain: RuleChain }) {
  return (
    <div className="space-y-3">
      {/* Rule fired */}
      <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-4">
        <p className="text-[10px] uppercase tracking-wider text-ink/40 font-medium mb-2">
          Rule Triggered
        </p>
        <code className="text-xs text-ink/80 font-mono bg-ink/[0.04] px-2 py-1 rounded">
          {ruleChain.rule_fired}
        </code>
      </div>

      {/* Statute */}
      <div className="rounded-xl bg-purple/5 border border-purple/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-4 h-4 text-purple" />
          <p className="text-[10px] uppercase tracking-wider text-purple/70 font-medium">
            Applicable Law
          </p>
        </div>
        <StatuteChip statute={ruleChain.statute} />
        <p className="text-xs text-ink/60 mt-2 leading-relaxed">
          {ruleChain.statute}
        </p>
      </div>

      {/* Agency */}
      <div className="rounded-xl bg-accent/5 border border-accent/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-accent" />
          <p className="text-[10px] uppercase tracking-wider text-accent/70 font-medium">
            Enforcing Agency
          </p>
        </div>
        <AgencyChip agency={ruleChain.agency} />
      </div>

      {/* Flow visualization */}
      <div className="flex items-center gap-2 text-xs text-ink/40">
        <span className="px-2 py-1 rounded bg-ink/[0.04] text-ink/60">
          Detection
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="px-2 py-1 rounded bg-purple/10 text-purple">
          Classification
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="px-2 py-1 rounded bg-accent/10 text-accent">
          Routing
        </span>
      </div>
    </div>
  );
}

function CounterfactualPanel({
  confidence,
  breakdown,
}: {
  confidence: number;
  breakdown?: {
    visual: number;
    community_corroboration: number;
    geo_within_known_zone: number;
  };
}) {
  const baseVisual = breakdown?.visual ?? confidence;

  const scenarios = [
    {
      label: "Without community corroboration",
      description:
        "If this was a single-report incident with no chain evidence",
      impact: -0.12,
      newConfidence: Math.max(0, confidence - 0.12),
    },
    {
      label: "Without geographic data",
      description:
        "If no similar reports existed in the 5km zone",
      impact: -0.08,
      newConfidence: Math.max(0, confidence - 0.08),
    },
    {
      label: "Lower visual confidence",
      description:
        "If YOLO detection was borderline (50% instead of current)",
      impact: baseVisual > 0.5 ? -(baseVisual - 0.5) * 0.5 : 0,
      newConfidence: Math.max(
        0,
        confidence - (baseVisual > 0.5 ? (baseVisual - 0.5) * 0.5 : 0)
      ),
    },
    {
      label: "With additional corroborating reports",
      description:
        "If 3 more community members reported the same issue",
      impact: 0.08,
      newConfidence: Math.min(1, confidence + 0.08),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber" />
        <p className="text-xs font-medium text-ink">
          What would change the confidence?
        </p>
      </div>

      {scenarios.map((s) => {
        const delta = s.newConfidence - confidence;
        const isPositive = delta > 0;
        return (
          <div
            key={s.label}
            className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink">{s.label}</p>
              <p className="text-[11px] text-ink/50 mt-0.5">{s.description}</p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-sm font-bold ${
                  isPositive ? "text-green" : delta < 0 ? "text-red" : "text-ink/50"
                }`}
              >
                {isPositive ? "+" : ""}
                {(delta * 100).toFixed(1)}%
              </span>
              <p className="text-[10px] text-ink/40 mt-0.5">
                → {(s.newConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        );
      })}

      <div className="mt-3 p-3 rounded-xl bg-amber/5 border border-amber/10">
        <p className="text-[11px] text-amber/80 leading-relaxed">
          <strong>Note:</strong> Counterfactuals are estimated based on the
          current confidence model. Actual outcomes may vary based on
          additional evidence and investigation.
        </p>
      </div>
    </div>
  );
}
