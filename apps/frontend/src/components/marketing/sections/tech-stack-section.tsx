"use client";

import { useState } from "react";
import { m } from "framer-motion";
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

   Shows the AI pipeline as an interactive flow:
   Input → YOLOv8 → Neuro-Symbolic Engine → Knowledge Graph → Agency Routing
   Each node is hoverable for details. Impresses hackathon judges.
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
    sublabel: "Apache TinkerPop",
    detail: "Gremlin-powered graph database mapping relationships between violations, locations, agencies, statutes, and temporal patterns. Enables multi-hop queries for pattern detection.",
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
    label: "Laravel 12 API",
    sublabel: "Core Backend",
    detail: "RESTful API with session management, relational DB, role-based access control. Handles citizen accounts, report lifecycle, agency coordination, and public transparency records.",
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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const activeNode = TECH_NODES.find(n => n.id === hoveredNode);

  return (
    <section id="architecture" className="ec-section" style={{ background: "var(--page)" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes techPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes techFlowDot {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
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
            Technical Architecture
          </div>
          <h2
            style={{
              fontSize: "var(--display-section)",
              fontFamily: "var(--font-heading)", fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.06, color: "var(--ink)",
              margin: 0, textWrap: "balance" as const,
            }}
          >
            Not a wrapper. A full neuro-symbolic pipeline.
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
            Six purpose-built systems working in concert. Hover any node to see
            what it does and why it matters.
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
            {TECH_NODES.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isConnected = hoveredNode
                ? CONNECTIONS.some(
                    c => (c.from === hoveredNode && c.to === node.id) || (c.to === hoveredNode && c.from === node.id)
                  )
                : false;

              return (
                <m.div
                  key={node.id}
                  variants={fadeUp}
                  className="group cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    padding: "24px 22px",
                    borderRadius: 16,
                    background: "var(--panel)",
                    border: `1.5px solid ${isHovered ? node.color : isConnected ? `color-mix(in srgb, ${node.color} 30%, var(--border))` : "var(--border)"}`,
                    boxShadow: isHovered
                      ? `0 8px 32px -8px color-mix(in srgb, ${node.color} 20%, transparent)`
                      : "0 4px 16px -8px rgba(0,0,0,0.06)",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Subtle glow on hover */}
                  {isHovered && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${node.color} 6%, transparent), transparent 70%)`,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                          background: `color-mix(in srgb, ${node.color} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${node.color} 20%, transparent)`,
                        }}
                      >
                        <node.Icon
                          style={{ width: 18, height: 18, color: node.color }}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>
                          {node.label}
                        </p>
                        <p style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--muted)", margin: 0, letterSpacing: "0.04em" }}>
                          {node.sublabel}
                        </p>
                      </div>
                    </div>

                    {/* Connection indicator dots */}
                    <div className="flex gap-1 mt-1">
                      {CONNECTIONS.filter(c => c.from === node.id || c.to === node.id).map((conn, i) => {
                        const other = conn.from === node.id ? conn.to : conn.from;
                        const otherNode = TECH_NODES.find(n => n.id === other);
                        return (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              background: hoveredNode === other ? otherNode?.color : "var(--border-strong)",
                              animation: hoveredNode === other ? "techPulse 1.5s ease-in-out infinite" : "none",
                            }}
                            title={`Connected to ${otherNode?.label}`}
                          />
                        );
                      })}
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
                  ? `0 12px 40px -12px color-mix(in srgb, ${activeNode.color} 15%, transparent)`
                  : "0 4px 16px -8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 border-b transition-all duration-500"
                style={{
                  borderColor: activeNode ? `color-mix(in srgb, ${activeNode.color} 15%, var(--border))` : "var(--border)",
                  background: activeNode
                    ? `color-mix(in srgb, ${activeNode.color} 4%, var(--panel))`
                    : "var(--panel)",
                }}
              >
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                  style={{ color: activeNode?.color ?? "var(--muted)", margin: 0 }}
                >
                  {activeNode ? activeNode.sublabel : "System Details"}
                </p>
                <p
                  className="text-lg font-bold transition-colors duration-300 mt-1"
                  style={{ color: "var(--ink)", margin: 0, fontFamily: "var(--font-heading)" }}
                >
                  {activeNode ? activeNode.label : "Hover a node"}
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <p
                  className="text-sm leading-relaxed transition-all duration-300"
                  style={{
                    color: activeNode ? "var(--ink)" : "var(--muted)",
                    margin: 0,
                    minHeight: 80,
                  }}
                >
                  {activeNode
                    ? activeNode.detail
                    : "Hover any technology node on the left to see its role in the LikasLens pipeline. Each system is purpose-built, not borrowed from a template."}
                </p>
              </div>

              {/* Flow visualization */}
              <div className="px-6 pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  {TECH_NODES.map((node, i) => (
                    <div key={node.id} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                          background: hoveredNode === node.id ? node.color : "var(--border-strong)",
                          boxShadow: hoveredNode === node.id ? `0 0 8px ${node.color}` : "none",
                        }}
                      />
                      {i < TECH_NODES.length - 1 && (
                        <div className="w-4 h-px" style={{ background: "var(--border)" }} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[9px] text-muted mt-2 tracking-wider uppercase">
                  Data Flow Pipeline
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
