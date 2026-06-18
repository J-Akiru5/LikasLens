"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

// ── GlowCard ───────────────────────────────────────────────────────────
// Card with animated border beam that travels around the edges.
// Creates the "premium holographic" effect. Low overhead, high wow.

interface GlowCardProps {
  children: ReactNode;
  /** Enable the traveling border beam */
  beam?: boolean;
  /** Beam color */
  beamColor?: string;
  /** Enable mouse-following spotlight */
  spotlight?: boolean;
  /** Spotlight color */
  spotlightColor?: string;
  /** Extra className */
  className?: string;
}

export function GlowCard({
  children,
  beam = true,
  beamColor = "rgba(46,230,200,0.4)",
  spotlight = false,
  spotlightColor = "rgba(46,230,200,0.08)",
  className = "",
}: GlowCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Animated border beam */}
      {beam && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl z-0"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${beamColor} 10%, transparent 20%)`,
            animation: "border-beam 4s linear infinite",
          }}
        />
      )}

      {/* Inner panel (masks the beam to just the border) */}
      <div
        className="relative z-10 h-full rounded-2xl"
        style={{
          background: "var(--panel)",
          margin: "1px",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes border-beam {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes border-beam { from, to { transform: rotate(0deg); } }
        }
      `}</style>
    </motion.div>
  );
}
