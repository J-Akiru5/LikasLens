"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Network, ChevronDown, ChevronUp, AlertTriangle, Cpu, Scale, Building2, ShieldCheck, X, TreePine, Droplets, Trash2, Fish, CircleCheck, ArrowRight, Activity, Sparkles, Layers } from "lucide-react";
import { cn } from "@likaslens/shared";
import { useSwipeDownToClose } from "@/hooks/use-swipe-down-to-close";

interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: "incident" | "ai" | "law" | "agency" | "proof";
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  details: string;
  code: string;
  meta: Record<string, string>;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface Preset {
  id: string;
  title: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

interface KnowledgeLaw {
  code: string;
  title: string;
  issuing_agency: string | null;
  is_primary: boolean;
  source: string;
  review_status: "verified" | "pending";
  citation_url: string | null;
}

interface KnowledgeAgency {
  name: string;
  focus_area: string | null;
  city_municipality: string | null;
  province: string | null;
  region: string | null;
}

interface KnowledgeSelected {
  code: string;
  name: string | null;
  description: string | null;
  laws: KnowledgeLaw[];
  agencies: KnowledgeAgency[];
  method: "relational" | "vector" | "none";
}

interface KnowledgeSuggestion {
  code: string;
  title: string;
  similarity: number;
}

interface HazardSummary {
  code: string;
  name: string;
  description: string | null;
  laws: { code: string; title: string; is_primary: boolean; review_status: string }[];
  linked: boolean;
}

interface KnowledgeResponse {
  backend: string;
  hazards: HazardSummary[];
  selected: KnowledgeSelected | null;
  suggestions: KnowledgeSuggestion[];
}

const NODE_CONFIG = {
  incident: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "Incident", radius: 24 },
  ai: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "AI Engine", radius: 22 },
  law: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Law", radius: 22 },
  agency: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Agency", radius: 22 },
  proof: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", label: "Proof", radius: 20 },
} as const;

function NodeIcon({ type }: { type: GraphNode["type"] }) {
  const fill = "none";
  const stroke = "white";
  const sw = "1.5";
  switch (type) {
    case "incident":
      return (
        <g>
          <polygon points="0,-7 6,5 -6,5" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <line x1="0" y1="-2" x2="0" y2="1.5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <circle cx="0" cy="4" r="0.8" fill={stroke} />
        </g>
      );
    case "ai":
      return (
        <g>
          <rect x="-4" y="-4" width="8" height="8" rx="1" fill={fill} stroke={stroke} strokeWidth={sw} />
          <rect x="-2" y="-2" width="4" height="4" rx="0.5" fill={fill} stroke={stroke} strokeWidth="1" />
        </g>
      );
    case "law":
      return (
        <g>
          <line x1="0" y1="-6" x2="0" y2="6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="-6" y1="-2.5" x2="6" y2="-2.5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M-6,-2.5 L-7.5,1 L-4.5,1 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M6,-2.5 L4.5,1 L7.5,1 Z" fill={fill} stroke={stroke} strokeWidth="1" />
        </g>
      );
    case "agency":
      return (
        <g>
          <rect x="-5" y="-3.5" width="10" height="9" rx="0.5" fill={fill} stroke={stroke} strokeWidth={sw} />
          <rect x="-1.5" y="2.5" width="3" height="3" fill={fill} stroke={stroke} strokeWidth="1" />
          <line x1="-5" y1="-6" x2="5" y2="-6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </g>
      );
    case "proof":
      return (
        <g>
          <path d="M0,-7 L6,-3.5 L6,1.5 Q6,6 0,8.5 Q-6,6 -6,1.5 L-6,-3.5 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <polyline points="-3,0.5 -0.8,3 3,-1.5" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    default:
      return <circle r="3" fill={stroke} />;
  }
}

const EMPTY_PRESET: Preset = { id: "", title: "Knowledge graph", nodes: [], links: [] };

/** Map the live payload onto the node/link shape the mobile renderer uses. */
function buildPreset(selected: KnowledgeSelected): Preset {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const hazardId = "hazard";
  nodes.push({
    id: hazardId,
    type: "incident",
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    label: selected.name ?? selected.code,
    sublabel: "Violation type",
    details: selected.description ?? "No description recorded for this violation type.",
    code: selected.code,
    meta: {
      linked_statutes: String(selected.laws.length),
      agencies: String(selected.agencies.length),
      method: selected.method,
    },
  });

  const laws = selected.laws.slice(0, 4);
  laws.forEach((law, index) => {
    const id = `law:${law.code}`;
    nodes.push({
      id,
      type: "law",
      x: 260,
      y: 90 + index * 80,
      vx: 0,
      vy: 0,
      label: law.title,
      sublabel: law.code,
      details: law.issuing_agency
        ? `Issued by ${law.issuing_agency}.`
        : "No issuing agency recorded.",
      code: law.code,
      meta: {
        review_status: law.review_status,
        source: law.source,
        primary: law.is_primary ? "yes" : "no",
        citation: law.citation_url ?? "not recorded",
      },
    });
    links.push({
      source: hazardId,
      target: id,
      label: law.is_primary ? "Violates" : "Also relates",
    });
  });

  const agencies = selected.agencies.slice(0, 5);
  agencies.forEach((agency, index) => {
    const id = `agency:${agency.name}`;
    nodes.push({
      id,
      type: "agency",
      x: 420,
      y: 70 + index * 70,
      vx: 0,
      vy: 0,
      label: agency.name,
      sublabel: agency.focus_area ?? "Agency",
      details:
        [agency.city_municipality, agency.province, agency.region].filter(Boolean).join(", ") ||
        "No location recorded.",
      code: "AGENCY",
      meta: {
        focus_area: agency.focus_area ?? "not recorded",
        region: agency.region ?? "not recorded",
      },
    });
  });

  let edges = 0;
  for (const law of laws) {
    for (const agency of agencies) {
      if (edges >= 12) break;
      links.push({
        source: `law:${law.code}`,
        target: `agency:${agency.name}`,
        label: "Enforced by",
      });
      edges += 1;
    }
  }

  return { id: selected.code, title: selected.name ?? selected.code, nodes, links };
}

function terminalFor(
  selected: KnowledgeSelected | null,
  suggestions: KnowledgeSuggestion[],
): string {
  if (!selected) return "> Knowledge store: postgres + pgvector\n> No violation type returned.";
  const lines = [
    "> Knowledge store: postgres + pgvector",
    `> Hazard: ${selected.name ?? selected.code} (${selected.code})`,
    `> Method: ${selected.method}`,
    `> Linked statutes: ${selected.laws.length}`,
    ...selected.laws.map(
      (law) =>
        `  - ${law.code} (${law.review_status}${law.is_primary ? ", primary" : ""}) ${law.title}`,
    ),
    `> Agencies in scope: ${selected.agencies.length}`,
  ];
  if (selected.laws.length === 0) {
    lines.push("> No statute is linked to this violation type yet.");
  }
  if (suggestions.length > 0) {
    lines.push("> Suggested by pgvector similarity (not an assertion):");
    lines.push(
      ...suggestions.map((s) => `  ~ ${s.code} sim=${s.similarity.toFixed(3)} ${s.title}`),
    );
  }
  return lines.join("\n");
}

export default function KnowledgeGraphPage() {
  const [hazards, setHazards] = useState<HazardSummary[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [knowledge, setKnowledge] = useState<KnowledgeSelected | null>(null);
  const [suggestions, setSuggestions] = useState<KnowledgeSuggestion[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const activePreset = useMemo(
    () => (knowledge ? buildPreset(knowledge) : EMPTY_PRESET),
    [knowledge],
  );
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("inc");
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const [dragging, setDragging] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const presetSheetRef = useSwipeDownToClose(() => setShowPresets(false));
  
  const [terminalText, setTerminalText] = useState("");
  const [terminalIdx, setTerminalIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState<"idle" | "connecting" | "ok" | "error">("idle");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgW = 520;
  const svgH = 400;
  const nodesRef = useRef<GraphNode[]>([]);

  const loadKnowledge = useCallback(async (hazard?: string) => {
    setLoadState("loading");
    try {
      const url = hazard
        ? `/api/v1/graph/knowledge?hazard=${encodeURIComponent(hazard)}`
        : "/api/v1/graph/knowledge";
      const res = await fetch(url);
      if (!res.ok) throw new Error("knowledge request failed");
      const data = (await res.json()) as KnowledgeResponse;
      setHazards(data.hazards ?? []);
      setKnowledge(data.selected ?? null);
      setSuggestions(data.suggestions ?? []);
      setSelectedCode(data.selected?.code ?? "");
      setLoadState("ok");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadKnowledge();
  }, [loadKnowledge]);

  useEffect(() => {
    const fresh = JSON.parse(JSON.stringify(activePreset.nodes));
    nodesRef.current = fresh;
    setNodes(fresh);
    setSelectedId(activePreset.nodes[0]?.id ?? null);
    const intro = terminalFor(knowledge, suggestions);
    setTerminalText("");
    setTerminalIdx(0);
    setIsTyping(true);
    sessionStorage.setItem("__ll_term_mobile", intro);
  }, [activePreset, knowledge, suggestions]);

  useEffect(() => {
    if (!isTyping) return;
    const full = sessionStorage.getItem("__ll_term_mobile") ?? "";
    if (terminalIdx < full.length) {
      const t = setTimeout(() => {
        setTerminalText(full.slice(0, terminalIdx + 4));
        setTerminalIdx((i) => i + 4);
      }, 8);
      return () => clearTimeout(t);
    } else {
      setIsTyping(false);
    }
  }, [isTyping, terminalIdx]);

  useEffect(() => {
    let raf: number;
    let frameCount = 0;
    let isSettled = false;
    const maxFrames = 150;
    const kRepel = 28000;
    const kSpring = 0.014;
    const restLen = 140;
    const gravity = 0.012;
    const cx = svgW / 2;
    const cy = svgH / 2;
    const dampen = 0.82;

    const tick = () => {
      if (isSettled) return;
      const ns = nodesRef.current;
      if (!ns.length) {
        raf = requestAnimationFrame(tick);
        return;
      }

      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x || 0.01;
          const dy = ns[j].y - ns[i].y || 0.01;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2) || 1;
          if (d < 250) {
            const f = kRepel / d2;
            const fx = (dx / d) * f;
            const fy = (dy / d) * f;
            if (typeof ns[i].fx !== "number") { ns[i].vx -= fx; ns[i].vy -= fy; }
            if (typeof ns[j].fx !== "number") { ns[j].vx += fx; ns[j].vy += fy; }
          }
        }
      }

      activePreset.links.forEach(({ source, target }) => {
        const s = ns.find((n) => n.id === source);
        const t = ns.find((n) => n.id === target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - restLen) * kSpring;
        if (typeof s.fx !== "number") { s.vx += (dx / d) * f; s.vy += (dy / d) * f; }
        if (typeof t.fx !== "number") { t.vx -= (dx / d) * f; t.vy -= (dy / d) * f; }
      });

      let totalMotion = 0;
      ns.forEach((n) => {
        if (typeof n.fx === "number" && typeof n.fy === "number") {
          n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0;
        } else {
          n.vx += (cx - n.x) * gravity;
          n.vy += (cy - n.y) * gravity;
          n.vx *= dampen;
          n.vy *= dampen;
          n.x += n.vx;
          n.y += n.vy;
          const pad = NODE_CONFIG[n.type].radius + 10;
          n.x = Math.max(pad, Math.min(svgW - pad, n.x));
          n.y = Math.max(pad, Math.min(svgH - pad, n.y));
          totalMotion += Math.abs(n.vx) + Math.abs(n.vy);
        }
      });

      frameCount++;
      if (frameCount % 3 === 0) {
        setNodes(ns.map((n) => ({ ...n })));
      }

      // Settle cleanly once movement decays or max frames reached
      if ((totalMotion < 0.1 && frameCount > 40) || frameCount >= maxFrames) {
        isSettled = true;
        setNodes(ns.map((n) => ({ ...n })));
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      isSettled = true;
      cancelAnimationFrame(raf);
    };
  }, [activePreset]);

  // AI service reachability check
  useEffect(() => {
    let cancelled = false;
    async function pingApi() {
      setApiStatus("connecting");
      try {
        const res = await fetch("/api/v1/graph/topology", { signal: AbortSignal.timeout(5000) });
        if (!cancelled) setApiStatus(res.ok ? "ok" : "error");
      } catch {
        if (!cancelled) setApiStatus("error");
      }
    }
    pingApi();
    const interval = setInterval(pingApi, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const onNodeTouchStart = useCallback((id: string) => {
    setDragging(id);
    setSelectedId(id);
  }, []);

  const onSvgTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const touch = e.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * svgW;
    const y = ((touch.clientY - rect.top) / rect.height) * svgH;
    const node = nodesRef.current.find((n) => n.id === dragging);
    if (node) {
      node.fx = x;
      node.fy = y;
      node.x = x;
      node.y = y;
      setNodes(nodesRef.current.map((n) => ({ ...n })));
    }
  }, [dragging]);

  const onSvgTouchEnd = useCallback(() => {
    if (!dragging) return;
    const node = nodesRef.current.find((n) => n.id === dragging);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    setDragging(null);
  }, [dragging]);

  const TypeIcon = { incident: AlertTriangle, ai: Cpu, law: Scale, agency: Building2, proof: ShieldCheck } as const;

  return (
    <div className="min-h-full pb-6 bg-[#0a0f1a]">
      <header className="sticky top-0 z-30 bg-[#0a0f1a]/95 backdrop-blur-xl border-b border-white/10 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2ee6c8]/10 border border-[#2ee6c8]/25 flex items-center justify-center">
            <Network className="w-4 h-4 text-[#2ee6c8]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide leading-tight">Graph Explorer</h1>
            <span className="text-[9px] font-mono text-white/40 block">LIVE KNOWLEDGE BASE</span>
          </div>
        </div>

        {/* Interactive Scenario Selector Dropdown Trigger */}
        <button
          onClick={() => setShowPresets(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131d33] hover:bg-[#1a2845] active:scale-95 border border-white/15 text-xs font-semibold text-white shadow-md transition-all cursor-pointer group"
          title="Switch Graph Scenario"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6c8] animate-pulse shrink-0" />
          <span className="truncate max-w-[120px] font-mono">{activePreset.title}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-transform group-active:translate-y-0.5" />
        </button>
      </header>

      {/* Graph Canvas */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full"
          style={{ cursor: dragging ? "grabbing" : "default" }}
          onTouchMove={onSvgTouchMove}
          onTouchEnd={onSvgTouchEnd}
        >
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(255,255,255,0.06)" />
            </pattern>
            <radialGradient id="bloom" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="rgba(46,230,200,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
            </radialGradient>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="rgba(255,255,255,0.15)" />
            </marker>
            <marker id="arr-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#2ee6c8" />
            </marker>
          </defs>

          <rect width={svgW} height={svgH} fill="#060d1b" />
          <rect width={svgW} height={svgH} fill="url(#dots)" />
          <rect width={svgW} height={svgH} fill="url(#bloom)" />

          {activePreset.links.map(({ source, target, label }, idx) => {
            const s = nodes.find((n) => n.id === source);
            const t = nodes.find((n) => n.id === target);
            if (!s || !t) return null;
            const active = selectedId === s.id || selectedId === t.id;
            const sR = NODE_CONFIG[s.type].radius;
            const tR = NODE_CONFIG[t.type].radius;
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            return (
              <g key={idx}>
                <line
                  x1={s.x + (dx / len) * sR} y1={s.y + (dy / len) * sR}
                  x2={t.x - (dx / len) * (tR + 3)} y2={t.y - (dy / len) * (tR + 3)}
                  stroke={active ? "#2ee6c8" : "rgba(255,255,255,0.1)"}
                  strokeWidth={active ? 1.5 : 0.8}
                  markerEnd={active ? "url(#arr-a)" : "url(#arr)"}
                />
                {active && (
                  <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 5} textAnchor="middle" fill="#2ee6c8" fontSize="8" fontFamily="monospace" fontWeight="600" paintOrder="stroke" stroke="#060d1b" strokeWidth="3">
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => {
            const cfg = NODE_CONFIG[node.type];
            const sel = selectedId === node.id;
            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`} style={{ cursor: "grab" }}
                onTouchStart={() => onNodeTouchStart(node.id)} onClick={() => setSelectedId(node.id)}>
                {sel && <circle r={cfg.radius + 8} fill="none" stroke={cfg.color} strokeWidth="1" opacity="0.2" />}
                {sel && <circle r={cfg.radius + 3} fill={cfg.color} opacity="0.15" />}
                <circle r={cfg.radius} fill={sel ? cfg.bg : "rgba(10,15,26,0.85)"} stroke={cfg.color} strokeWidth={sel ? 2 : 1.2} />
                <NodeIcon type={node.type} />
                <text y={cfg.radius + 12} textAnchor="middle" fill={sel ? "white" : "rgba(255,255,255,0.6)"} fontSize="8" fontFamily="sans-serif" fontWeight={sel ? "600" : "400"} paintOrder="stroke" stroke="#060d1b" strokeWidth="3">
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Inspector Bottom Sheet */}
      {selectedNode && (
        <div className="px-4 py-3">
          <div className="ios-grouped-list p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: NODE_CONFIG[selectedNode.type].bg }}>
                {(() => { const I = TypeIcon[selectedNode.type]; return <I style={{ color: NODE_CONFIG[selectedNode.type].color }} className="w-5 h-5" />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{selectedNode.code}</p>
                <p className="text-sm font-bold text-ink truncate">{selectedNode.label}</p>
              </div>
            </div>
            <p className="text-xs text-ink/60 leading-relaxed mb-3">{selectedNode.details}</p>
            <div className="space-y-2">
              {Object.entries(selectedNode.meta).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-ink/40">{k.replace(/_/g, " ")}</span>
                  <span className="font-mono font-semibold text-ink/80">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activePreset.links.filter((l) => l.source === selectedId || l.target === selectedId).map((l, i) => {
                const otherId = l.source === selectedId ? l.target : l.source;
                const other = nodes.find((n) => n.id === otherId);
                return other ? (
                  <button key={i} onClick={() => setSelectedId(otherId)} className="px-2 py-1 rounded-lg bg-ink/5 text-[10px] text-ink/60 font-medium">
                    {l.label} → {other.label.split(" ")[0]}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend + API Status */}
      <div className="px-4 pb-3 space-y-3">
        {/* Legend */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {Object.entries(NODE_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-[9px] font-mono text-ink/50">{config.label}</span>
            </div>
          ))}
        </div>

        {/* AI service reachability */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#080c15] border border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              apiStatus === "ok" ? "bg-green" : apiStatus === "connecting" ? "bg-amber animate-pulse" : apiStatus === "error" ? "bg-red" : "bg-white/20"
            }`} />
            <span className="text-[10px] font-mono text-white/40">AI SERVICE STATUS</span>
          </div>
          <span className={`text-[9px] font-mono font-bold ${
            apiStatus === "ok" ? "text-green" : apiStatus === "error" ? "text-red" : "text-white/30"
          }`}>
            {apiStatus === "ok" ? "CONNECTED" : apiStatus === "connecting" ? "PINGING..." : apiStatus === "error" ? "OFFLINE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Terminal Toggle */}
      <div className="px-4 pb-4">
        <button onClick={() => setShowTerminal(!showTerminal)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#080c15] border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span className="text-[10px] font-mono text-white/40">CYPHER QUERY LOG</span>
          </div>
          {showTerminal ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronUp className="w-3 h-3 text-white/30" />}
        </button>
        {showTerminal && (
          <pre className="mt-2 px-3 py-2 rounded-xl bg-[#060d1b] border border-white/5 text-[10px] font-mono text-[#2ee6c8]/70 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {terminalText}
          </pre>
        )}
      </div>

      {/* Preset Picker Modal / Bottom Sheet (Modern White Theme with Edge) */}
      {showPresets && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowPresets(false)}
          />
          <div
            ref={presetSheetRef}
            className="relative bg-white text-ink rounded-t-[28px] shadow-[0_-16px_50px_rgba(0,0,0,0.25)] max-h-[80vh] flex flex-col border-t-2 border-ink/10 overflow-hidden"
          >
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1.5">
              <div className="w-10 h-1.5 bg-ink/20 rounded-full" />
            </div>

            {/* Sheet Header with Edge */}
            <div className="px-5 pb-3.5 flex justify-between items-center border-b border-ink/10 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink tracking-tight">Select Graph Scenario</h2>
                  <p className="text-[10px] text-ink/50 font-mono">4 ACTIVE REASONING SIMULATIONS</p>
                </div>
              </div>
              <button
                onClick={() => setShowPresets(false)}
                aria-label="Close presets"
                className="p-2 rounded-xl bg-ink/5 hover:bg-ink/10 text-ink/70 hover:text-ink transition-colors cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scenario Cards List with Edge */}
            <div className="overflow-y-auto px-4 py-3.5 pb-8 flex-1 space-y-2.5">
              {hazards.map((h) => {
                const isActive = h.code === selectedCode;
                return (
                  <button
                    key={h.code}
                    onClick={() => {
                      setSelectedCode(h.code);
                      void loadKnowledge(h.code);
                      setShowPresets(false);
                    }}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border-2 border-l-[6px] transition-all cursor-pointer relative overflow-hidden",
                      isActive
                        ? "border-ink bg-slate-50 shadow-md ring-2 ring-ink/10 border-l-emerald-500"
                        : "border-ink/10 bg-white hover:border-ink/25 border-l-ink/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/60">
                        {h.code}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border",
                          h.linked
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        )}
                      >
                        {h.linked ? `${h.laws.length} linked` : "none"}
                      </span>
                    </div>
                    <h3 className="text-sm font-black font-mono tracking-tight text-ink/90">
                      {h.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-mono text-ink/55">
                      {h.linked
                        ? h.laws.map((law) => law.title).join(" · ")
                        : "No statute linked yet - pgvector suggestions only"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
