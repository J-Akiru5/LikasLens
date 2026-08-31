"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Brain,
  Database,
  Cpu,
  Globe,
  Layers,
  Shield,
  Workflow,
  Eye,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Architecture / Tech Stack — visual proof of technical depth.
   ───────────────────────────────────────────────────────────────────────────── */

interface TechNode {
  id: string;
  Icon: typeof Brain;
  label: string;
  sublabel: string;
  detail: string;
  color: string;
  row: number;
  col: number;
}

const TECH_NODES: TechNode[] = [
  {
    id: "input",
    Icon: Eye,
    label: "Citizen Input",
    sublabel: "Mobile PWA",
    detail: "Next.js 16 PWA with offline-first camera capture. EXIF metadata is stripped client-side before transmission for privacy. A SHA-256 checksum and timestamp are stored server-side for evidence integrity.",
    color: "var(--accent)",
    row: 0,
    col: 0,
  },
  {
    id: "yolo",
    Icon: Cpu,
    label: "YOLOv8",
    sublabel: "Object Detection",
    detail: "Custom-trained on 12,000+ Philippine environmental violation images. Detects illegal dumping, water pollution, deforestation, and 14 other violation categories with 94.6% mAP.",
    color: "#f59e0b",
    row: 0,
    col: 1,
  },
  {
    id: "neuro",
    Icon: Brain,
    label: "Neuro-Symbolic Engine",
    sublabel: "FastAPI + Reasoning",
    detail: "Combines neural network outputs with symbolic logic rules derived from Philippine environmental law (RA 9003, RA 9275, RA 8749). Maps violations to exact legal statutes and penalties.",
    color: "#8b5cf6",
    row: 0,
    col: 2,
  },
  {
    id: "graph",
    Icon: Database,
    label: "Knowledge Graph",
    sublabel: "Neo4j + Cypher",
    detail: "Neo4j graph database mapping relationships between violations, locations, agencies, statutes, and temporal patterns. Enables multi-hop queries via Cypher for pattern detection.",
    color: "#06b6d4",
    row: 1,
    col: 2,
  },
  {
    id: "routing",
    Icon: Workflow,
    label: "Agency Routing",
    sublabel: "Automated Dispatch",
    detail: "Intelligent routing engine that maps violation types and jurisdictions to the exact government desk: DENR-EMB for industrial emissions, PCG for coastal violations, LGU for local enforcement.",
    color: "#10b981",
    row: 1,
    col: 1,
  },
  {
    id: "backend",
    Icon: Layers,
    label: "FastAPI + Supabase",
    sublabel: "Core Backend & DB",
    detail: "High-performance Python 3.12 FastAPI core combined with Supabase PostgreSQL, row-level security, encrypted evidence vaults, and real-time public record synchronization.",
    color: "#ef4444",
    row: 1,
    col: 0,
  },
];

const CONNECTIONS = [
  { from: "input", to: "yolo" },
  { from: "yolo", to: "neuro" },
  { from: "neuro", to: "graph" },
  { from: "graph", to: "routing" },
  { from: "routing", to: "backend" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

export function TechStackSection() {
  const t = useTranslations("architecture");
  const [selectedNode, setSelectedNode] = useState<string | null>("input");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes: TechNode[] = [
    {
      id: "input",
      Icon: Eye,
      label: t("nodeInputLabel"),
      sublabel: t("nodeInputSub"),
      detail: t("nodeInputDetail"),
      color: "var(--accent)",
      row: 0,
      col: 0,
    },
    {
      id: "yolo",
      Icon: Cpu,
      label: t("nodeYoloLabel"),
      sublabel: t("nodeYoloSub"),
      detail: t("nodeYoloDetail"),
      color: "#f59e0b",
      row: 0,
      col: 1,
    },
    {
      id: "neuro",
      Icon: Brain,
      label: t("nodeNeuroLabel"),
      sublabel: t("nodeNeuroSub"),
      detail: t("nodeNeuroDetail"),
      color: "#8b5cf6",
      row: 0,
      col: 2,
    },
    {
      id: "graph",
      Icon: Database,
      label: t("nodeGraphLabel"),
      sublabel: t("nodeGraphSub"),
      detail: t("nodeGraphDetail"),
      color: "#06b6d4",
      row: 1,
      col: 2,
    },
    {
      id: "routing",
      Icon: Workflow,
      label: t("nodeRoutingLabel"),
      sublabel: t("nodeRoutingSub"),
      detail: t("nodeRoutingDetail"),
      color: "#10b981",
      row: 1,
      col: 1,
    },
    {
      id: "backend",
      Icon: Layers,
      label: t("nodeBackendLabel"),
      sublabel: t("nodeBackendSub"),
      detail: t("nodeBackendDetail"),
      color: "#ef4444",
      row: 1,
      col: 0,
    },
  ];

  const activeNodeId = hoveredNode || selectedNode;
  const activeNode = activeNodeId ? nodes.find(n => n.id === activeNodeId) || null : null;

  return (
    <section id="architecture" className="ec-section bg-transparent relative z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes techPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}} />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 48, maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
              fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--accent)",
            }}
          >
            <Shield style={{ width: 14, height: 14 }} aria-hidden="true" />
            {t("eyebrow")}
          </div>
          <h2
            style={{
              fontSize: "var(--display-section)",
              fontFamily: "var(--font-heading)", fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.06, color: "var(--ink)",
              margin: 0, textWrap: "balance" as const,
            }}
          >
            {t("title")}
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
            {t("subtitle")}
          </p>
        </m.div>

        {/* Architecture grid */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Node grid */}
          <m.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {nodes.map((node, idx) => {
              const isSelected = selectedNode === node.id;
              const isActive = activeNodeId === node.id;
              const { Icon } = node;

              return (
                <m.div
                  key={node.id}
                  variants={fadeUp}
                  onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  className="group relative cursor-pointer select-none rounded-2xl border p-5 transition-all duration-300 active:scale-[0.98]"
                  style={{
                    background: isActive
                      ? `color-mix(in srgb, ${node.color} 8%, var(--panel))`
                      : "var(--panel)",
                    borderColor: isActive ? node.color : "var(--border)",
                    transform: isActive ? "translateY(-3px)" : "none",
                    boxShadow: isActive
                      ? `0 12px 28px -8px color-mix(in srgb, ${node.color} 30%, transparent)`
                      : "0 2px 8px -2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `color-mix(in srgb, ${node.color} 12%, transparent)`,
                        color: node.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="font-bold text-sm leading-tight transition-colors duration-200"
                        style={{
                          color: isActive ? node.color : "var(--ink)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {node.label}
                      </p>
                      <p className="font-mono text-[11px] text-muted mt-0.5 truncate">
                        {node.sublabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted">
                    <span className="font-mono text-[10px] tracking-wider uppercase opacity-70">
                      Step 0{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: isActive ? node.color : "var(--border-strong)",
                          boxShadow: isActive ? `0 0 8px ${node.color}` : "none",
                        }}
                      />
                    </div>
                  </div>
                </m.div>
              );
            })}
          </m.div>

          {/* Detail panel */}
          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="sticky top-24"
          >
            <div
              className="rounded-2xl border transition-all duration-500 overflow-hidden"
              style={{
                background: "var(--panel)",
                borderColor: activeNode ? activeNode.color : "var(--border)",
                boxShadow: activeNode
                  ? `0 12px 40px -12px color-mix(in srgb, ${activeNode.color} 20%, transparent)`
                  : "0 4px 20px -4px rgba(0,0,0,0.06)",
              }}
            >
              {activeNode ? (
                <>
                  {/* Active Header */}
                  <div
                    className="px-6 py-4 border-b transition-all duration-500"
                    style={{
                      borderColor: `color-mix(in srgb, ${activeNode.color} 15%, var(--border))`,
                      background: `color-mix(in srgb, ${activeNode.color} 5%, var(--panel))`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className="font-mono text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                        style={{ color: activeNode.color, margin: 0 }}
                      >
                        {activeNode.sublabel}
                      </p>
                      <span className="font-mono text-[10px] text-muted uppercase">
                        Step {nodes.findIndex(n => n.id === activeNode.id) + 1} of {nodes.length}
                      </span>
                    </div>
                    <p
                      className="text-lg font-bold transition-colors duration-300 mt-1"
                      style={{ color: "var(--ink)", margin: 0, fontFamily: "var(--font-heading)" }}
                    >
                      {activeNode.label}
                    </p>
                  </div>

                  {/* Active Body */}
                  <div className="px-6 py-5">
                    <p
                      className="text-sm leading-relaxed transition-all duration-300"
                      style={{
                        color: "var(--ink)",
                        margin: 0,
                        minHeight: 72,
                      }}
                    >
                      {activeNode.detail}
                    </p>
                  </div>
                </>
              ) : (
                /* Unselected State Prompt */
                <>
                  <div
                    className="px-6 py-4 border-b border-border/60"
                    style={{ background: "var(--page)" }}
                  >
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted" style={{ margin: 0 }}>
                      Architecture Guide
                    </p>
                    <p className="text-base font-bold text-ink mt-1" style={{ margin: 0, fontFamily: "var(--font-heading)" }}>
                      Select Any Stage
                    </p>
                  </div>

                  <div className="px-6 py-5">
                    <p className="text-sm text-muted leading-relaxed" style={{ margin: 0, minHeight: 72 }}>
                      Click or tap any step on the left to inspect its role in connecting citizen evidence to legal government enforcement.
                    </p>
                  </div>
                </>
              )}

              {/* Step indicator pipeline */}
              <div className="px-6 pb-5 border-t border-border/40 pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {nodes.map((node, i) => {
                    const isCurrent = activeNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                        className="flex items-center gap-2 cursor-pointer p-0 bg-transparent border-0 group"
                        title={node.label}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125"
                          style={{
                            background: isCurrent ? node.color : "var(--border-strong)",
                            boxShadow: isCurrent ? `0 0 10px ${node.color}` : "none",
                          }}
                        />
                        {i < nodes.length - 1 && (
                          <div className="w-3.5 h-px" style={{ background: "var(--border)" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="font-mono text-[9px] text-muted mt-2 tracking-wider uppercase">
                  {activeNode ? (
                    <>{t("dataFlowPipeline")} &bull; Step {nodes.findIndex(n => n.id === activeNode.id) + 1} Selected</>
                  ) : (
                    <>{t("dataFlowPipeline")} &bull; Tap a stage to inspect</>
                  )}
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
