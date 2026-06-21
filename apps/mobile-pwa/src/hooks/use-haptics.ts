"use client";

import { useCallback } from "react";

/**
 * useHaptics — native-feeling tactile feedback with visual fallback.
 *
 * Uses the Vibration API where available (most Android browsers + Chrome).
 * On devices without vibration support (iOS, some Linux), adds a brief visual
 * pulse animation to the `<body>` as fallback feedback.
 * Respects prefers-reduced-motion (suppressed there too).
 *
 * Patterns are tuned to feel like native system feedback:
 *  - light:   a single short tap (selection / toggle)
 *  - medium:  a firmer tap (button press)
 *  - success: two rising taps (report submitted)
 *  - error:   a sharp double-buzz (something failed)
 *  - warning: a longer single pulse
 */

export type HapticPattern = "light" | "medium" | "success" | "error" | "warning";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 18,
  success: [12, 40, 22],
  error: [30, 50, 30],
  warning: 45,
};

export function useHaptics() {
  const supported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  /** Brief visual pulse animation as fallback for unsupported devices. */
  const visualPulse = useCallback(() => {
    try {
      document.body.classList.add("haptic-pulse");
      setTimeout(() => document.body.classList.remove("haptic-pulse"), 200);
    } catch { /* no-op */ }
  }, []);

  const trigger = useCallback(
    (pattern: HapticPattern = "light") => {
      if (typeof window !== "undefined") {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) return;
      }

      if (supported) {
        try {
          navigator.vibrate(PATTERNS[pattern]);
        } catch {
          visualPulse();
        }
      } else {
        visualPulse();
      }
    },
    [supported, visualPulse],
  );

  return trigger;
}
