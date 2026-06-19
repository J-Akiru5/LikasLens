"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

// ── AnimatedCounter ────────────────────────────────────────────────────
// Spring-physics number counter that animates from 0 to target.
// Triggers when scrolled into view. The "living data" effect.

interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Prefix before the number (e.g., "$") */
  prefix?: string;
  /** Suffix after the number (e.g., "%", "kg") */
  suffix?: string;
  /** Decimal places */
  decimals?: number;
  /** Duration in seconds (default 1.5) */
  duration?: number;
  /** Extra className */
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.5,
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (v) => {
    const num = Number(v);
    return `${prefix}${num.toFixed(decimals)}${suffix}`;
  });

  const [displayValue, setDisplayValue] = useState(
    `${prefix}0${suffix}`
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return (
    <motion.span
      ref={ref}
      className={`tabular-nums ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {displayValue}
    </motion.span>
  );
}
