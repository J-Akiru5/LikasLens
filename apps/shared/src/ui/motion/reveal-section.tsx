"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

// ── RevealSection ──────────────────────────────────────────────────────
// Wraps children in a scroll-triggered stagger entrance.
// Cards cascade in as you scroll — the single highest-impact wow effect.

interface RevealSectionProps {
  children: ReactNode;
  /** Stagger delay between children in seconds (default 0.08) */
  stagger?: number;
  /** Direction of reveal */
  direction?: "up" | "down" | "left" | "right";
  /** Extra className on wrapper */
  className?: string;
}

const directionOffset = {
  up: { y: 24, x: 0 },
  down: { y: -24, x: 0 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
};

export function RevealSection({
  children,
  stagger = 0.08,
  direction = "up",
  className = "",
}: RevealSectionProps) {
  const offset = directionOffset[direction];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, ...offset },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
            >
              {child}
            </motion.div>
          ))
        : (
            <motion.div
              variants={{
                hidden: { opacity: 0, ...offset },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
            >
              {children}
            </motion.div>
          )}
    </motion.div>
  );
}
