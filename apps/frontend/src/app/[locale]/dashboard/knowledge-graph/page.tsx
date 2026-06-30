"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { useTranslations } from "next-intl";
import {
  Network,
  RefreshCw,
  Terminal,
  ArrowRight,
  Database,
  Zap,
  Server,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Cpu,
  Scale,
  Building2,
  ShieldCheck,
  Info,
  Circle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  cypherQuery: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Node type config ────────────────────────────────────────────────────────

const NODE_CONFIG = {
  incident: {
    color: "#ef4444",
    glow: "rgba(239,68,68,0.35)",
    ring: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    label: "Incident",
    radius: 30,
  },
  ai: {
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
    ring: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    label: "AI Engine",
    radius: 26,
  },
  law: {
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.35)",
    ring: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    label: "Law / Statute",
    radius: 26,
  },
  agency: {
    color: "#22c55e",
    glow: "rgba(34,197,94,0.35)",
    ring: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    label: "Agency",
    radius: 26,
  },
  proof: {
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.35)",
    ring: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    label: "Blockchain Proof",
    radius: 24,
  },
} as const;

// SVG icon paths for each node type (16×16 viewBox centered at 0,0)
function NodeIcon({ type, selected }: { type: GraphNode["type"]; selected: boolean }) {
  const s = selected ? 1 : 0.85;
  const fill = "none";
  const stroke = "white";
  const sw = "1.5";
  switch (type) {
    case "incident":
      // AlertTriangle
      return (
        <g transform={`scale(${s})`}>
          <polygon points="0,-9 8,6 -8,6" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <line x1="0" y1="-2" x2="0" y2="2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <circle cx="0" cy="5" r="1" fill={stroke} />
        </g>
      );
    case "ai":
      // CPU chip
      return (
        <g transform={`scale(${s})`}>
          <rect x="-5" y="-5" width="10" height="10" rx="1.5" fill={fill} stroke={stroke} strokeWidth={sw} />
          <rect x="-3" y="-3" width="6" height="6" rx="0.5" fill={fill} stroke={stroke} strokeWidth="1" />
          {/* pins */}
          <line x1="-3" y1="-7" x2="-3" y2="-5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="3" y1="-7" x2="3" y2="-5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="-3" y1="5" x2="-3" y2="7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="3" y1="5" x2="3" y2="7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="-7" y1="-2" x2="-5" y2="-2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="-7" y1="2" x2="-5" y2="2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="5" y1="-2" x2="7" y2="-2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="5" y1="2" x2="7" y2="2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </g>
      );
    case "law":
      // Scale / balance
      return (
        <g transform={`scale(${s})`}>
          <line x1="0" y1="-7" x2="0" y2="7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="-3" y1="7" x2="3" y2="7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="-7" y1="-3" x2="7" y2="-3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M-7,-3 L-9,1 L-5,1 Z" fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
          <path d="M7,-3 L5,1 L9,1 Z" fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        </g>
      );
    case "agency":
      // Building
      return (
        <g transform={`scale(${s})`}>
          <rect x="-6" y="-4" width="12" height="11" rx="0.5" fill={fill} stroke={stroke} strokeWidth={sw} />
          <rect x="-2" y="3" width="4" height="4" fill={fill} stroke={stroke} strokeWidth="1" />
          <line x1="-6" y1="-7" x2="6" y2="-7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1="0" y1="-7" x2="0" y2="-4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <rect x="-4.5" y="-2" width="2.5" height="2.5" rx="0.3" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <rect x="2" y="-2" width="2.5" height="2.5" rx="0.3" fill={fill} stroke={stroke} strokeWidth="0.8" />
        </g>
      );
    case "proof":
      // Shield check
      return (
        <g transform={`scale(${s})`}>
          <path d="M0,-8 L7,-4 L7,2 Q7,7 0,10 Q-7,7 -7,2 L-7,-4 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <polyline points="-3.5,1 -1,3.5 3.5,-2" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    default:
      return <circle r="4" fill={stroke} />;
  }
}

// ─── Presets ─────────────────────────────────────────────────────────────────

function makeNodes(incident: Partial<GraphNode>, ai: Partial<GraphNode>, law: Partial<GraphNode>, agency: Partial<GraphNode>, proof: Partial<GraphNode>): GraphNode[] {
  const base: Pick<GraphNode, "vx" | "vy">[] = [{ vx: 0, vy: 0 }];
  return [
    { id: "inc", type: "incident", x: 180, y: 220, vx: 0, vy: 0, code: "INCIDENT", ...incident } as GraphNode,
    { id: "ai", type: "ai", x: 340, y: 100, vx: 0, vy: 0, code: "AI_ENGINE", ...ai } as GraphNode,
    { id: "law", type: "law", x: 500, y: 220, vx: 0, vy: 0, code: "STATUTE", ...law } as GraphNode,
    { id: "agency", type: "agency", x: 500, y: 380, vx: 0, vy: 0, code: "AGENCY", ...agency } as GraphNode,
    { id: "proof", type: "proof", x: 180, y: 380, vx: 0, vy: 0, code: "BLOCKCHAIN", ...proof } as GraphNode,
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
    id: "solid-waste",
    title: "Illegal Solid Waste Dumping",
    severity: "high",
    category: "Solid Waste",
    cypherQuery: "MATCH (h:HazardType {code: 'SOLID_WASTE'})-[:VIOLATES]->(l:Law)\n MATCH (l)-[:ENFORCED_BY]->(a:Agency)\n RETURN DISTINCT l.title AS law, a.name AS agency",
    nodes: makeNodes(
      { label: "Trash Heap — Brgy. 143", sublabel: "Manila, NCR", details: "Illegal dumping site (~4×5m) blocking pedestrian walkway. Classified via YOLOv8 vision pipeline.", meta: { Type: "Solid Waste", Confidence: "94.2%", GPS: "14.5995°N 120.9842°E", Status: "Active" } },
      { label: "YOLOv8 Classifier", sublabel: "FastAPI AI-Service", details: "Computer vision model running on LikasLens AI microservice. Detects 47 environmental violation classes.", meta: { Model: "YOLOv8-Env-v2", Accuracy: "94.2%", Latency: "~120ms", Framework: "FastAPI / Python 3.12" } },
      { label: "Republic Act 9003", sublabel: "Ecological Solid Waste Mgmt.", details: "RA 9003 Section 48 — Prohibited Acts. Fines up to ₱300,000 and 6 years imprisonment.", meta: { Statute: "RA 9003", Section: "Sec. 48", Max_Fine: "₱300,000", Imprisonment: "Up to 6 years" } },
      { label: "CENRO Task Force", sublabel: "City Environment & NR Office", details: "Specialized enforcement unit. SLA: 24-hour field response. Coordinates with MMDA for Metro Manila.", meta: { Unit: "CENRO Enforcement", SLA: "24 Hours", Jurisdiction: "Metro Manila", Contact: "CENRO-Manila" } },
      { label: "Polygon Mainnet", sublabel: "Block #4,829,188", details: "Tamper-proof SHA-256 evidence hash committed to Polygon blockchain. Permanently verifiable by courts.", meta: { Network: "Polygon (MATIC)", Block: "#4,829,188", Gas: "0.0012 MATIC ≈ $0.001", Verifiable: "polygonscan.com" } }
    ),
    links: BASE_LINKS,
  },
  {
    id: "deforestation",
    title: "Illegal Deforestation",
    severity: "critical",
    category: "Forest Cover",
    cypherQuery: "MATCH (h:HazardType {code: 'DEFORESTATION'})-[:VIOLATES]->(l:Law)\n MATCH (l)-[:ENFORCED_BY]->(a:Agency)\n RETURN DISTINCT l.title AS law, a.name AS agency",
    nodes: makeNodes(
      { label: "Canopy Loss — Mt. Apo Buffer", sublabel: "Davao del Sur", details: "Satellite imagery + citizen reports confirm commercial chain-sawing in protected forest buffer zone.", meta: { Type: "Illegal Logging", Area_Lost: "~3.2 hectares", Sat_Source: "Sentinel-2", Status: "Active" } },
      { label: "Forestry Sentinel AI", sublabel: "Multispectral Analysis", details: "NDVI change-detection model comparing bi-weekly satellite bands to baseline forest coverage.", meta: { Model: "NDVI-ChangeNet", Bands: "B04,B08 (NIR)", Change: "-12% NDVI", Confidence: "91.0%" } },
      { label: "P.D. 705 — Forestry Code", sublabel: "Revised Forestry Code", details: "Presidential Decree 705. Prohibits cutting, gathering, removing timber in forest lands without license.", meta: { Statute: "P.D. 705", Jurisdiction: "All forest lands", Max_Fine: "₱500,000", Imprisonment: "Up to 20 years" } },
      { label: "DENR — Forest Police", sublabel: "Dept. of Env. & Natural Res.", details: "Forest rangers with arrest authority. Deployed with GPS coordinates for field intercept operations.", meta: { Unit: "DENR Forest Rangers", Response: "Field Intercept", Alert: "SMS + Radio Broadcast", Priority: "CRITICAL" } },
      { label: "Sepolia Testnet", sublabel: "TX: 0x9f1a...8e2c", details: "Evidence timestamp and AI classification hash anchored to Ethereum Sepolia for demo. Mainnet-ready.", meta: { Network: "Ethereum Sepolia", TX: "0x9f1a...8e2c", Block: "#921,029", Status: "Confirmed" } }
    ),
    links: BASE_LINKS,
  },
  {
    id: "water-pollution",
    title: "Industrial Wastewater Discharge",
    severity: "critical",
    category: "Water Quality",
    cypherQuery: "MATCH (h:HazardType {code: 'WATER_POLLUTION'})-[:VIOLATES]->(l:Law)\n MATCH (l)-[:ENFORCED_BY]->(a:Agency)\n RETURN DISTINCT l.title AS law, a.name AS agency",
    nodes: makeNodes(
      { label: "Toxic Runoff — Laguna Lake", sublabel: "Laguna de Bay Watershed", details: "Elevated chemical COD levels and visible discoloration detected near industrial discharge pipe #7.", meta: { Type: "Chemical Discharge", pH_Level: "4.2 (Acidic)", COD: "380 mg/L (3× limit)", Status: "Active Spill" } },
      { label: "Water Sentinel AI", sublabel: "Spectral Analysis Engine", details: "Analyzes photo color histograms and user-reported parameters against baseline water quality profiles.", meta: { Model: "WaterSpec-v1.3", Indicators: "Color, pH, COD", Confidence: "88.5%", Engine: "FastAPI" } },
      { label: "Republic Act 9275", sublabel: "Clean Water Act of 2004", details: "RA 9275 Section 27 — Prohibited Acts. Discharge of pollutants into water bodies is a criminal offense.", meta: { Statute: "RA 9275", Section: "Sec. 27", Max_Fine: "₱200,000/day", Imprisonment: "Up to 12 years" } },
      { label: "DENR-EMB & LLDA", sublabel: "Laguna Lake Dev. Authority", details: "LLDA environmental compliance officers and EMB joint inspection team. Water sampling authority.", meta: { Unit: "LLDA + EMB-R4A", Action: "Joint Inspection", Response: "Same-day sampling", Penalty: "Cease & Desist" } },
      { label: "Arbitrum One", sublabel: "TX: 0x3b8c...c2f1", details: "Audit-grade evidence sealed on Arbitrum L2 for low-cost, high-throughput legal evidence storage.", meta: { Network: "Arbitrum One (ETH L2)", TX: "0x3b8c...c2f1", Gas: "0.00008 ETH", Status: "Finalized" } }
    ),
    links: BASE_LINKS,
  },
  {
    id: "coral-damage",
    title: "Marine Coral Reef Destruction",
    severity: "high",
    category: "Marine Protection",
    cypherQuery: "MATCH (h:HazardType {code: 'CORAL_DAMAGE'})-[:VIOLATES]->(l:Law)\n MATCH (l)-[:ENFORCED_BY]->(a:Agency)\n RETURN DISTINCT l.title AS law, a.name AS agency",
    nodes: makeNodes(
      { label: "Blast Fishing — Sulu Sea", sublabel: "Tawi-Tawi Marine Sanctuary", details: "Hydrophone arrays detected explosive frequency signatures. Visible coral fragmentation confirmed by citizen divers.", meta: { Type: "Dynamite Fishing", Zone: "Strict Protection Area", Hydrophone: "Positive Match", Depth: "8–15m" } },
      { label: "Marine Audio-Visual AI", sublabel: "WaveformNet Classifier", details: "Audio pattern matching model trained on documented underwater explosion frequencies from 12 hydrophone stations.", meta: { Model: "WaveformNet-v2", Accuracy: "95.4%", Signal: "87–120 Hz blast", Latency: "<2s detection" } },
      { label: "Republic Act 8550", sublabel: "Philippine Fisheries Code", details: "RA 8550 Sections 88–92. Dynamite fishing classified as a grave offense. Mandatory imprisonment.", meta: { Statute: "RA 8550", Section: "Sec. 88–92", Classification: "Grave Offense", Imprisonment: "20 yrs mandatory" } },
      { label: "BFAR + PCG — Maritime", sublabel: "Bureau of Fisheries & Coast Guard", details: "Philippine Coast Guard Patrol Boat 3 intercepting vessel. BFAR monitors and files charges.", meta: { Unit: "BFAR + PCG Tawi-Tawi", Vessel: "PCG Patrol Boat #3", Response: "Maritime Intercept", ETA: "~18 minutes" } },
      { label: "Hedera Hashgraph", sublabel: "Consensus #HCS-0.0.491124", details: "Enterprise-grade Hedera consensus service. Provides court-admissible timestamp proof with Byzantine fault tolerance.", meta: { Network: "Hedera Hashgraph (HCS)", Topic: "0.0.491124", Consensus: "BFT Guaranteed", Cost: "0.0001 HBAR" } }
    ),
    links: BASE_LINKS,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const t = useTranslations("dashboard");
  const [activeId, setActiveId] = useState("solid-waste");
  const activePreset = PRESETS.find((p) => p.id === activeId)!;

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("inc");
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const [dragging, setDragging] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalText, setTerminalText] = useState("");
  const [terminalIdx, setTerminalIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const [apiStatus, setApiStatus] = useState<"idle" | "connecting" | "ok" | "error">("idle");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgW = 720;
  const svgH = 440;

  // Reset nodes when preset changes
  useEffect(() => {
    const fresh = JSON.parse(JSON.stringify(activePreset.nodes));
    nodesRef.current = fresh;
    setNodes(fresh);
    setSelectedId("inc");
    const intro = `> Initializing LikasLens Neuro-Symbolic Engine\n> Connecting to Neo4j AuraDB endpoint...\n> Query type: INCIDENT_TRAVERSAL\n\n${activePreset.cypherQuery}\n\n[OK] Traversal complete — ${activePreset.nodes.length} vertices, ${activePreset.links.length} edges\n[OK] Knowledge graph rendered in browser context`;
    setTerminalText("");
    setTerminalIdx(0);
    setIsTyping(true);
    // Store full text for typewriter
    sessionStorage.setItem("__ll_term", intro);
  }, [activeId]);

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    const full = sessionStorage.getItem("__ll_term") ?? "";
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

  // Physics sim — runs at 60fps, updates React state at ~20fps (every 3rd frame)
  const nodesRef = useRef<GraphNode[]>([]);

  useEffect(() => {
    let raf: number;
    let frameCount = 0;
    const kRepel = 28000;
    const kSpring = 0.014;
    const restLen = 180;
    const gravity = 0.012;
    const cx = svgW / 2;
    const cy = svgH / 2;
    const dampen = 0.82;

    const tick = () => {
      const ns = nodesRef.current;
      if (!ns.length) { raf = requestAnimationFrame(tick); return; }

      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x || 0.01;
          const dy = ns[j].y - ns[i].y || 0.01;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2) || 1;
          if (d < 300) {
            const f = kRepel / d2;
            const fx = (dx / d) * f;
            const fy = (dy / d) * f;
            if (typeof ns[i].fx !== "number") { ns[i].vx -= fx; ns[i].vy -= fy; }
            if (typeof ns[j].fx !== "number") { ns[j].vx += fx; ns[j].vy += fy; }
          }
        }
      }

      // Spring attraction along links
      activePreset.links.forEach(({ source, target }) => {
        const s = ns.find((n) => n.id === source);
        const t = ns.find((n) => n.id === target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - restLen) * kSpring;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        if (typeof s.fx !== "number") { s.vx += fx; s.vy += fy; }
        if (typeof t.fx !== "number") { t.vx -= fx; t.vy -= fy; }
      });

      // Gravity + integrate
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
          const cfg = NODE_CONFIG[n.type];
          const pad = cfg.radius + 16;
          n.x = Math.max(pad, Math.min(svgW - pad, n.x));
          n.y = Math.max(pad + 10, Math.min(svgH - pad - 10, n.y));
        }
      });

      // Throttle React state updates to every 3rd frame (~20fps)
      frameCount++;
      if (frameCount % 3 === 0) {
        setNodes(ns.map((n) => ({ ...n })));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeId]);

  // Drag handlers
  const onNodeMouseDown = useCallback((id: string, e: React.MouseEvent<SVGGElement>) => {
    e.preventDefault();
    setDragging(id);
    setSelectedId(id);
  }, []);

  const onSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * svgW;
    const y = ((e.clientY - rect.top) / rect.height) * svgH;
    const node = nodesRef.current.find((n) => n.id === dragging);
    if (node) { node.fx = x; node.fy = y; }
  }, [dragging]);

  const onSvgMouseUp = useCallback(() => {
    if (!dragging) return;
    const node = nodesRef.current.find((n) => n.id === dragging);
    if (node) { node.fx = null; node.fy = null; }
    setDragging(null);
  }, [dragging]);

  const pingLiveApi = async () => {
    setApiStatus("connecting");
    try {
      const r = await fetch("http://localhost:8001/graph/topology");
      if (r.ok) {
        const d = await r.json();
        setApiStatus("ok");
        setTerminalText((t) => `${t}\n\n[LIVE] Connected: localhost:8001/graph/topology\n[DATA] Vertex labels: ${JSON.stringify(d.vertex_labels)}\n[DATA] Edge labels: ${JSON.stringify(d.edge_labels)}`);
      } else throw new Error();
    } catch {
      setApiStatus("error");
      setTimeout(() => setApiStatus("idle"), 3000);
    }
  };

  const severityColor: Record<string, string> = {
    critical: "text-red-500 bg-red-500/10 border-red-500/20",
    high: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    moderate: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  const TypeIcon = {
    incident: AlertTriangle,
    ai: Cpu,
    law: Scale,
    agency: Building2,
    proof: ShieldCheck,
  } as const;

  return (
    <DashboardLayoutWrapper
      pageTitle={t("graphExplorer")}
      pageSubtitle={t("graphExplorerDesc")}
    >
      {/*
        ╔══════════════════════════════════════════════════════════════╗
        ║  INDUSTRY-STANDARD LAYOUT:                                  ║
        ║  LEFT (presets 280px) | CENTER (graph hero) | RIGHT (280px) ║
        ║  BOTTOM: collapsible query terminal                         ║
        ╚══════════════════════════════════════════════════════════════╝
      */}
      <div className="flex flex-col gap-0 h-full">

        {/* ── Main 3-column workspace ─────────────────────────────── */}
        <div className="flex gap-0 min-h-0 flex-1" style={{ minHeight: "520px" }}>

          {/* ── LEFT PANEL: Presets ──────────────────────────────── */}
          <div className="w-72 shrink-0 flex flex-col border-r border-border bg-panel hidden lg:flex">
            {/* Panel header */}
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{t("incidentPresets")}</p>
              <p className="text-[11px] text-ink/50 mt-0.5">{t("selectViolation")}</p>
            </div>

            {/* Preset list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {PRESETS.map((p) => {
                const active = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all duration-150 group ${
                      active
                        ? "bg-accent/8 border-accent/40 text-ink shadow-sm"
                        : "bg-ink/[0.02] border-border/60 hover:bg-ink/[0.05] hover:border-border text-ink/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[11px] font-semibold leading-snug ${active ? "text-ink" : "text-ink/75"}`}>
                        {p.title}
                      </span>
                      <span className={`shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${severityColor[p.severity]}`}>
                        {p.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink/45 mt-1 font-medium">{p.category}</p>
                    {active && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[10px] text-accent font-medium">{t("activeTraversal")}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend — rounded card section */}
            <div className="p-3 border-t border-border">
              <div className="rounded-xl border border-border/70 bg-ink/[0.02] p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-ink/35 font-semibold mb-2.5">{t("legend")}</p>
                {(Object.entries(NODE_CONFIG) as [GraphNode["type"], typeof NODE_CONFIG[GraphNode["type"]]][]).map(([type, cfg]) => {
                  const LIcon = TypeIcon[type];
                  return (
                    <div key={type} className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}40` }}
                      >
                        <LIcon style={{ color: cfg.color }} className="w-3 h-3" strokeWidth={2} />
                      </div>
                      <span className="text-[11px] text-ink/60">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live API status — rounded card section */}
            <div className="p-3 border-t border-border">
              <div className="rounded-xl border border-border/70 bg-ink/[0.02] p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] uppercase tracking-widest text-ink/35 font-semibold">{t("aiMicroservice")}</span>
                  <span className={`w-2 h-2 rounded-full ${apiStatus === "ok" ? "bg-emerald-400" : apiStatus === "error" ? "bg-red-500" : apiStatus === "connecting" ? "bg-amber-400 animate-pulse" : "bg-ink/20"}`} />
                </div>
                <button
                  onClick={pingLiveApi}
                  disabled={apiStatus === "connecting"}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {apiStatus === "connecting" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {apiStatus === "connecting" ? t("connecting") : apiStatus === "ok" ? t("verifiedOk") : t("verifyLiveEndpoints")}
                </button>
              </div>
            </div>
          </div>

          {/* ── CENTER: Graph Canvas HERO ────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#0a0f1a] relative overflow-hidden rounded-2xl mx-2 my-2">

            {/* Toolbar strip */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-[#2ee6c8]" />
                  <span className="text-[11px] text-white/40 font-mono tracking-wide">{t("graphTraversalEngine")}</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <span className="text-[11px] font-mono text-white/30">{activePreset.nodes.length} vertices · {activePreset.links.length} edges</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6c8] animate-pulse" />
                  {t("livePhysics")}
                </span>
                <span>·</span>
                <span>{t("dragToRearrange")}</span>
              </div>
            </div>

            {/* SVG canvas */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full flex-1 min-h-0"
              style={{ cursor: dragging ? "grabbing" : "default" }}
              onMouseMove={onSvgMouseMove}
              onMouseUp={onSvgMouseUp}
              onMouseLeave={onSvgMouseUp}
            >
              {/* ── Canvas background definitions ──────────────────── */}
              <defs>
                {/* Fine dot grid — engineering/studio look */}
                <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="0.5" cy="0.5" r="0.75" fill="rgba(255,255,255,0.08)" />
                </pattern>
                {/* Major cross-grid lines */}
                <pattern id="grid-major" width="96" height="96" patternUnits="userSpaceOnUse">
                  <path d="M96,0 L0,0 0,96" fill="none" stroke="rgba(46,230,200,0.04)" strokeWidth="0.5" />
                </pattern>
                {/* Depth bloom at center — teal radar effect */}
                <radialGradient id="bloom" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="rgba(46,230,200,0.06)" />
                  <stop offset="60%" stopColor="rgba(10,20,50,0.0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
                </radialGradient>
                {/* Glow filters */}
                <filter id="glow-r" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-m" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Arrow markers */}
                <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0,1 L9,5 L0,9 Z" fill="rgba(255,255,255,0.18)" />
                </marker>
                <marker id="arr-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,1 L9,5 L0,9 Z" fill="#2ee6c8" />
                </marker>
              </defs>

              {/* Base fill — deep space navy, not grey */}
              <rect width={svgW} height={svgH} fill="#060d1b" />
              {/* Fine dot grid */}
              <rect width={svgW} height={svgH} fill="url(#dots)" />
              {/* Major teal grid overlay */}
              <rect width={svgW} height={svgH} fill="url(#grid-major)" />
              {/* Center teal bloom + edge vignette */}
              <rect width={svgW} height={svgH} fill="url(#bloom)" />

              {/* ── Links ─────────────────────────────────────────── */}
              {activePreset.links.map(({ source, target, label }, idx) => {
                const s = nodes.find((n) => n.id === source);
                const t = nodes.find((n) => n.id === target);
                if (!s || !t) return null;
                const traversed = selectedId === s.id || selectedId === t.id;
                const sCfg = NODE_CONFIG[s.type];
                const tCfg = NODE_CONFIG[t.type];

                // Offset so arrow starts at node edge
                const dx = t.x - s.x;
                const dy = t.y - s.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const sx = s.x + (dx / len) * sCfg.radius;
                const sy = s.y + (dy / len) * sCfg.radius;
                const ex = t.x - (dx / len) * (tCfg.radius + 4);
                const ey = t.y - (dy / len) * (tCfg.radius + 4);
                const mx = (sx + ex) / 2;
                const my = (sy + ey) / 2;

                return (
                  <g key={idx}>
                    <line
                      x1={sx} y1={sy} x2={ex} y2={ey}
                      stroke={traversed ? "#2ee6c8" : "rgba(255,255,255,0.12)"}
                      strokeWidth={traversed ? 1.5 : 1}
                      strokeDasharray={traversed ? "6 3" : undefined}
                      markerEnd={traversed ? "url(#arr-active)" : "url(#arr)"}
                      filter={traversed ? "url(#glow-m)" : undefined}
                    />
                    {traversed && (
                      <text
                        x={mx} y={my - 6}
                        textAnchor="middle"
                        fill="#2ee6c8"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                        opacity="0.9"
                        paintOrder="stroke"
                        stroke="#060d1b"
                        strokeWidth="4"
                        strokeLinejoin="round"
                      >
                        {label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Nodes ─────────────────────────────────────────── */}
              {nodes.map((node) => {
                const cfg = NODE_CONFIG[node.type];
                const sel = selectedId === node.id;
                const r = cfg.radius;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    style={{ cursor: "grab" }}
                    onMouseDown={(e) => onNodeMouseDown(node.id, e)}
                    onClick={() => setSelectedId(node.id)}
                  >
                    {/* Selection pulse ring */}
                    {sel && (
                      <circle
                        r={r + 10}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="1"
                        opacity="0.25"
                      />
                    )}

                    {/* Glow backdrop */}
                    {sel && (
                      <circle
                        r={r + 4}
                        fill={cfg.glow}
                        filter="url(#glow-r)"
                      />
                    )}

                    {/* Main circle */}
                    <circle
                      r={r}
                      fill={sel ? cfg.bg : "rgba(10,15,26,0.85)"}
                      stroke={cfg.color}
                      strokeWidth={sel ? 2 : 1.5}
                      style={{ transition: "stroke-width 0.15s" }}
                    />

                    {/* SVG icon */}
                    <NodeIcon type={node.type} selected={sel} />

                    {/* Label below */}
                    <text
                      y={r + 14}
                      textAnchor="middle"
                      fill={sel ? "white" : "rgba(255,255,255,0.7)"}
                      fontSize="10"
                      fontFamily="Inter, sans-serif"
                      fontWeight={sel ? "600" : "500"}
                      paintOrder="stroke"
                      stroke="#060d1b"
                      strokeWidth="4.5"
                      strokeLinejoin="round"
                    >
                      {node.sublabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── RIGHT PANEL: Inspector ───────────────────────────── */}
          <div className="w-72 shrink-0 flex flex-col border-l border-border bg-panel hidden lg:flex">
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{t("nodeInspector")}</p>
              <p className="text-[11px] text-ink/50 mt-0.5">{t("clickVertexHint")}</p>
            </div>

            {selectedNode ? (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">

                {/* Node identity — rounded card */}
                <div className="rounded-xl border border-border/70 bg-ink/[0.02] p-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: NODE_CONFIG[selectedNode.type].bg, border: `1.5px solid ${NODE_CONFIG[selectedNode.type].color}40` }}
                    >
                      {(() => { const I = TypeIcon[selectedNode.type]; return <I style={{ color: NODE_CONFIG[selectedNode.type].color }} className="w-4 h-4" strokeWidth={2} />; })()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-ink/35">{selectedNode.code}</span>
                      <h4 className="text-[13px] font-semibold text-ink leading-tight mt-0.5">{selectedNode.label}</h4>
                      <p className="text-[11px] text-ink/50 mt-0.5">{selectedNode.sublabel}</p>
                    </div>
                  </div>
                </div>

                {/* Description — rounded card */}
                <div className="rounded-xl border border-border/70 bg-ink/[0.02] p-3">
                  <p className="text-[9px] uppercase tracking-widest text-ink/35 font-semibold mb-2">{t("description")}</p>
                  <p className="text-[11px] text-ink/70 leading-relaxed">{selectedNode.details}</p>
                </div>

                {/* Vertex properties — rounded card */}
                <div className="rounded-xl border border-border/70 bg-ink/[0.02] p-3">
                  <p className="text-[9px] uppercase tracking-widest text-ink/35 font-semibold mb-2.5">{t("vertexProperties")}</p>
                  <div className="space-y-2">
                    {Object.entries(selectedNode.meta).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-2">
                        <span className="text-[10px] text-ink/40 shrink-0">{k.replace(/_/g, " ")}</span>
                        <span className="text-[10px] font-mono font-semibold text-ink/85 text-right break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vertex class badge — colored rounded card */}
                <div
                  className="rounded-xl border px-3 py-2.5 flex items-center justify-between text-[11px] font-semibold"
                  style={{
                    background: NODE_CONFIG[selectedNode.type].bg,
                    borderColor: `${NODE_CONFIG[selectedNode.type].color}35`,
                    color: NODE_CONFIG[selectedNode.type].color,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    {NODE_CONFIG[selectedNode.type].label}
                  </span>
                  <ArrowRight className="w-3 h-3 opacity-50" />
                </div>

                {/* Connections — rounded card */}
                <div className="rounded-xl border border-border/70 bg-ink/[0.02] p-3">
                  <p className="text-[9px] uppercase tracking-widest text-ink/35 font-semibold mb-2.5">{t("connections")}</p>
                  <div className="space-y-1.5">
                    {activePreset.links
                      .filter((l) => l.source === selectedId || l.target === selectedId)
                      .map((l, i) => {
                        const other = nodes.find((n) => n.id === (l.source === selectedId ? l.target : l.source));
                        if (!other) return null;
                        const OIcon = TypeIcon[other.type];
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedId(other.id)}
                            className="w-full flex items-center gap-2 text-[10px] text-ink/65 hover:text-ink/95 hover:bg-ink/[0.04] px-2 py-1.5 rounded-lg transition-colors"
                          >
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: NODE_CONFIG[other.type].bg, border: `1px solid ${NODE_CONFIG[other.type].color}30` }}>
                              <OIcon style={{ color: NODE_CONFIG[other.type].color }} className="w-2.5 h-2.5" strokeWidth={2.5} />
                            </div>
                            <span className="truncate font-medium">{other.label}</span>
                            <ArrowRight className="w-2.5 h-2.5 ml-auto shrink-0 opacity-35" />
                          </button>
                        );
                      })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
                <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] border border-border flex items-center justify-center mb-3">
                  <Info className="w-5 h-5 text-ink/20" />
                </div>
                <p className="text-[11px] text-ink/35 leading-relaxed">{t("clickVertexHint")}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM: Collapsible Terminal ─────────────────────── */}
        <div className="bg-[#080c15] shrink-0 mx-2 mb-2 rounded-2xl overflow-hidden border border-white/[0.07]">
          {/* Terminal header / toggle */}
          <button
            onClick={() => setTerminalOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2 text-white/40 hover:text-white/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-3.5 h-3.5 text-[#2ee6c8]" />
              <span className="text-[11px] font-mono tracking-wider uppercase">{t("cypherQueryLog")}</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[#22c55e] font-mono">live</span>
              </div>
            </div>
            {terminalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {terminalOpen && (
            <div className="px-4 pb-4 max-h-44 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <pre className="text-[11px] font-mono text-[#2ee6c8]/80 whitespace-pre-wrap leading-relaxed">
                <span className="text-white/30">{'$ '}</span>
                {terminalText}
                {isTyping && <span className="inline-block w-1.5 h-3 bg-[#2ee6c8] ml-0.5 animate-pulse align-middle" />}
              </pre>
            </div>
          )}
        </div>

      </div>
    </DashboardLayoutWrapper>
  );
}
