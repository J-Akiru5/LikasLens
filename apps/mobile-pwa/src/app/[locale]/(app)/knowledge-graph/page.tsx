"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Network, ChevronDown, ChevronUp, AlertTriangle, Cpu, Scale, Building2, ShieldCheck, X } from "lucide-react";
import { cn } from "@likaslens/shared";

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
  severity: "low" | "moderate" | "high" | "critical";
  category: string;
  gremlinQuery: string;
  nodes: GraphNode[];
  links: GraphLink[];
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

function makeNodes(incident: Partial<GraphNode>, ai: Partial<GraphNode>, law: Partial<GraphNode>, agency: Partial<GraphNode>, proof: Partial<GraphNode>): GraphNode[] {
  return [
    { id: "inc", type: "incident", x: 150, y: 180, vx: 0, vy: 0, code: "INCIDENT", ...incident } as GraphNode,
    { id: "ai", type: "ai", x: 280, y: 80, vx: 0, vy: 0, code: "AI_ENGINE", ...ai } as GraphNode,
    { id: "law", type: "law", x: 400, y: 180, vx: 0, vy: 0, code: "STATUTE", ...law } as GraphNode,
    { id: "agency", type: "agency", x: 400, y: 320, vx: 0, vy: 0, code: "AGENCY", ...agency } as GraphNode,
    { id: "proof", type: "proof", x: 150, y: 320, vx: 0, vy: 0, code: "BLOCKCHAIN", ...proof } as GraphNode,
  ];
}

const BASE_LINKS: GraphLink[] = [
  { source: "inc", target: "ai", label: "Analyzed By" },
  { source: "inc", target: "proof", label: "Sealed On-Chain" },
  { source: "inc", target: "law", label: "Violates" },
  { source: "law", target: "agency", label: "Enforced By" },
  { source: "ai", target: "agency", label: "Routes To" },
];

const PRESETS: Preset[] = [
  {
    id: "solid-waste", title: "Illegal Solid Waste Dumping", severity: "high", category: "Solid Waste",
    gremlinQuery: "g.V().has('incident','type','SOLID_WASTE')\n   .outE('violates').inV().as('law')\n   .outE('enforced_by').inV().as('agency')\n   .select('law','agency')",
    nodes: makeNodes(
      { label: "Trash Heap — Brgy. 143", sublabel: "Manila, NCR", details: "Illegal dumping site (~4×5m) blocking pedestrian walkway.", meta: { Type: "Solid Waste", Confidence: "94.2%", GPS: "14.5995°N 120.9842°E", Status: "Active" } },
      { label: "YOLOv8 Classifier", sublabel: "FastAPI AI-Service", details: "Computer vision model detecting 47 environmental violation classes.", meta: { Model: "YOLOv8-Env-v2", Accuracy: "94.2%", Latency: "~120ms" } },
      { label: "Republic Act 9003", sublabel: "Ecological Solid Waste Mgmt.", details: "RA 9003 Section 48 — Fines up to ₱300,000 and 6 years imprisonment.", meta: { Statute: "RA 9003", Max_Fine: "₱300,000" } },
      { label: "CENRO Task Force", sublabel: "City Environment & NR Office", details: "Specialized enforcement unit. SLA: 24-hour field response.", meta: { Unit: "CENRO", SLA: "24 Hours" } },
      { label: "Polygon Mainnet", sublabel: "Block #4,829,188", details: "Tamper-proof SHA-256 evidence hash committed to blockchain.", meta: { Network: "Polygon", Block: "#4,829,188" } }
    ),
    links: BASE_LINKS,
  },
  {
    id: "deforestation", title: "Illegal Deforestation", severity: "critical", category: "Forest Cover",
    gremlinQuery: "g.V().has('incident','type','DEFORESTATION')\n   .outE('violates').inV().as('law')\n   .outE('enforced_by').inV().as('agency')\n   .select('law','agency')",
    nodes: makeNodes(
      { label: "Canopy Loss — Mt. Apo", sublabel: "Davao del Sur", details: "Satellite imagery confirms commercial chain-sawing in protected buffer zone.", meta: { Type: "Illegal Logging", Area: "~3.2 hectares", Status: "Active" } },
      { label: "Forestry Sentinel AI", sublabel: "Multispectral Analysis", details: "NDVI change-detection model comparing satellite bands to baseline.", meta: { Model: "NDVI-ChangeNet", Change: "-12% NDVI" } },
      { label: "P.D. 705 — Forestry Code", sublabel: "Revised Forestry Code", details: "Prohibits cutting timber in forest lands without license.", meta: { Statute: "P.D. 705", Max_Fine: "₱500,000" } },
      { label: "DENR — Forest Police", sublabel: "Dept. of Env. & Natural Res.", details: "Forest rangers with arrest authority for field intercept.", meta: { Unit: "DENR Rangers", Priority: "CRITICAL" } },
      { label: "Sepolia Testnet", sublabel: "TX: 0x9f1a...8e2c", details: "Evidence hash anchored to Ethereum Sepolia.", meta: { Network: "Ethereum Sepolia", Status: "Confirmed" } }
    ),
    links: BASE_LINKS,
  },
  {
    id: "water-pollution", title: "Industrial Wastewater", severity: "critical", category: "Water Quality",
    gremlinQuery: "g.V().has('incident','type','WATER_POLLUTION')\n   .outE('violates').inV().as('law')\n   .outE('enforced_by').inV().as('agency')\n   .select('law','agency')",
    nodes: makeNodes(
      { label: "Toxic Runoff — Laguna Lake", sublabel: "Laguna de Bay", details: "Elevated COD levels and visible discoloration near discharge pipe.", meta: { Type: "Chemical Discharge", pH: "4.2 (Acidic)", COD: "380 mg/L" } },
      { label: "Water Sentinel AI", sublabel: "Spectral Analysis", details: "Analyzes photo color histograms against baseline water profiles.", meta: { Model: "WaterSpec-v1.3", Confidence: "88.5%" } },
      { label: "Republic Act 9275", sublabel: "Clean Water Act of 2004", details: "Section 27 — Discharge of pollutants is a criminal offense.", meta: { Statute: "RA 9275", Max_Fine: "₱200,000/day" } },
      { label: "DENR-EMB & LLDA", sublabel: "Laguna Lake Dev. Authority", details: "Joint inspection team with water sampling authority.", meta: { Unit: "LLDA + EMB", Action: "Joint Inspection" } },
      { label: "Arbitrum One", sublabel: "TX: 0x3b8c...c2f1", details: "Audit-grade evidence sealed on Arbitrum L2.", meta: { Network: "Arbitrum One", Status: "Finalized" } }
    ),
    links: BASE_LINKS,
  },
  {
    id: "coral-damage", title: "Marine Coral Reef Destruction", severity: "high", category: "Marine Protection",
    gremlinQuery: "g.V().has('incident','type','CORAL_DAMAGE')\n   .outE('violates').inV().as('law')\n   .outE('enforced_by').inV().as('agency')\n   .select('law','agency')",
    nodes: makeNodes(
      { label: "Blast Fishing — Sulu Sea", sublabel: "Tawi-Tawi Sanctuary", details: "Hydrophone arrays detected explosive frequency signatures.", meta: { Type: "Dynamite Fishing", Zone: "Strict Protection" } },
      { label: "Marine Audio-Visual AI", sublabel: "WaveformNet Classifier", details: "Audio pattern matching on underwater explosion frequencies.", meta: { Model: "WaveformNet-v2", Accuracy: "95.4%" } },
      { label: "Republic Act 8550", sublabel: "Philippine Fisheries Code", details: "Sections 88–92. Dynamite fishing is a grave offense.", meta: { Statute: "RA 8550", Imprisonment: "20 yrs" } },
      { label: "BFAR + PCG — Maritime", sublabel: "Bureau of Fisheries & Coast Guard", details: "PCG Patrol Boat intercepting vessel. BFAR files charges.", meta: { Unit: "BFAR + PCG", Response: "Maritime Intercept" } },
      { label: "Hedera Hashgraph", sublabel: "Consensus #HCS-0.0.491124", details: "Enterprise-grade Hedera consensus with Byzantine fault tolerance.", meta: { Network: "Hedera HCS", Cost: "0.0001 HBAR" } }
    ),
    links: BASE_LINKS,
  },
];

export default function KnowledgeGraphPage() {
  const [activeId, setActiveId] = useState("solid-waste");
  const activePreset = PRESETS.find((p) => p.id === activeId)!;
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("inc");
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const [dragging, setDragging] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  
  const [terminalText, setTerminalText] = useState("");
  const [terminalIdx, setTerminalIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgW = 520;
  const svgH = 400;
  const nodesRef = useRef<GraphNode[]>([]);

  useEffect(() => {
    const fresh = JSON.parse(JSON.stringify(activePreset.nodes));
    nodesRef.current = fresh;
    setNodes(fresh);
    setSelectedId("inc");
    
    const intro = `> Initializing LikasLens Engine\n> Connecting to Gremlin endpoint...\n> Query type: INCIDENT_TRAVERSAL\n\n${activePreset.gremlinQuery}\n\n[OK] Traversal complete — ${activePreset.nodes.length} vertices, ${activePreset.links.length} edges\n[OK] Graph rendered`;
    setTerminalText("");
    setTerminalIdx(0);
    setIsTyping(true);
    sessionStorage.setItem("__ll_term_mobile", intro);
  }, [activeId]);

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
    const kRepel = 28000;
    const kSpring = 0.014;
    const restLen = 140;
    const gravity = 0.012;
    const cx = svgW / 2;
    const cy = svgH / 2;
    const dampen = 0.82;

    const tick = () => {
      const ns = nodesRef.current;
      if (!ns.length) { raf = requestAnimationFrame(tick); return; }

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
        }
      });

      frameCount++;
      if (frameCount % 3 === 0) setNodes(ns.map((n) => ({ ...n })));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeId]);

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
    if (node) { node.fx = x; node.fy = y; }
  }, [dragging]);

  const onSvgTouchEnd = useCallback(() => {
    if (!dragging) return;
    const node = nodesRef.current.find((n) => n.id === dragging);
    if (node) { node.fx = null; node.fy = null; }
    setDragging(null);
  }, [dragging]);

  const TypeIcon = { incident: AlertTriangle, ai: Cpu, law: Scale, agency: Building2, proof: ShieldCheck } as const;

  return (
    <div className="min-h-full pb-24 bg-[#0a0f1a]">
      <header className="sticky top-0 z-30 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-white/10 px-4 h-14 flex items-center">
        <Network className="w-4 h-4 text-[#2ee6c8] mr-2" />
        <h1 className="text-sm font-bold text-white tracking-wide">Graph Explorer</h1>
        <button onClick={() => setShowPresets(true)} className="ml-auto px-2 py-1 rounded-lg bg-white/10 text-[10px] text-white/60 font-mono">
          {activePreset.title.split(" ").slice(0, 2).join(" ")}
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

      {/* Terminal Toggle */}
      <div className="px-4 pb-4">
        <button onClick={() => setShowTerminal(!showTerminal)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#080c15] border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span className="text-[10px] font-mono text-white/40">GREMLIN QUERY LOG</span>
          </div>
          {showTerminal ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronUp className="w-3 h-3 text-white/30" />}
        </button>
        {showTerminal && (
          <pre className="mt-2 px-3 py-2 rounded-xl bg-[#060d1b] border border-white/5 text-[10px] font-mono text-[#2ee6c8]/70 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {terminalText}
          </pre>
        )}
      </div>

      {/* Preset Picker Modal */}
      {showPresets && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPresets(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-2"><div className="w-12 h-1.5 bg-gray-200 rounded-full" /></div>
            <div className="px-5 pb-3 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-lg font-bold text-ink">Select Scenario</h2>
              <button onClick={() => setShowPresets(false)} className="p-1 text-ink/40"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 pb-8 flex-1 space-y-2">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => { setActiveId(p.id); setShowPresets(false); }}
                  className={cn("w-full text-left p-4 rounded-2xl border transition-all", p.id === activeId ? "border-green bg-green/5" : "border-ink/10 bg-white")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-ink">{p.title}</span>
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", p.severity === "critical" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>{p.severity}</span>
                  </div>
                  <p className="text-xs text-ink/50">{p.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
