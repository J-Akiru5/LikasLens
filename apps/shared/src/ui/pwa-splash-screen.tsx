"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Phase =
  | "entering"   // 0–16ms: invisible, pre-mount
  | "brand"      // Logo entrance (0–600ms)
  | "content"    // Tagline + dots appear (600ms–minDuration)
  | "holding"    // Past minDuration, waiting for content (if readyPromise given)
  | "extending"  // Waiting with "still loading" state (optional)
  | "exiting"    // Fade out (400ms)
  | "hidden";    // Removed from DOM

interface PwaSplashScreenProps {
  /**
   * Minimum time (ms) the splash will show. Even if everything loads in 200ms,
   * the splash stays this long so users can register the brand. Default: 2000
   */
  minDuration?: number;

  /**
   * Optional Promise that resolves when the app's critical content is ready.
   * After minDuration, the splash waits for this before dismissing.
   * If not provided, splash dismisses after minDuration.
   */
  readyPromise?: Promise<void>;

  /**
   * Absolute maximum wait (ms). If content isn't ready by this time, the splash
   * dismisses anyway. Prevents infinite splash on error. Default: 8000
   */
  maxDuration?: number;

  /** Override className for the wrapper. */
  className?: string;

  /** Called when the splash has fully dismissed. */
  onDismiss?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Premium PWA launch splash screen.
 *
 * Industry best practice (2026):
 * 1. Shows for a guaranteed `minDuration` (2s) — never flashes & disappears
 * 2. After minDuration, waits for `readyPromise` if provided
 * 3. Capped at `maxDuration` (8s) — never hangs forever
 * 4. Once per session (sessionStorage)
 *
 * Four-phase entrance: logo → tagline → dots (delight, not waiting)
 *
 * @example
 *   // Simple usage — always shows 2s
 *   <PwaSplashScreen />
 *
 *   // With content readiness — extends if data isn't loaded
 *   <PwaSplashScreen readyPromise={appReadyPromise} />
 */
export function PwaSplashScreen({
  minDuration = 2000,
  readyPromise,
  maxDuration = 8000,
  className,
  onDismiss,
}: PwaSplashScreenProps) {
  const [phase, setPhase] = useState<Phase>("entering");
  const [showExtending, setShowExtending] = useState(false);
  const readyRef = useRef(false);
  const minPassedRef = useRef(false);
  const dismissedRef = useRef(false);

  // ── Dismiss (once) ──────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    setPhase("exiting");
    setTimeout(() => {
      setPhase("hidden");
      onDismiss?.();
      try {
        sessionStorage.setItem("likaslens-splash-shown", "true");
      } catch {}
    }, 400); // exit animation duration
  }, [onDismiss]);

  // ── Main lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    // Once per session
    try {
      if (sessionStorage.getItem("likaslens-splash-shown") === "true") {
        setPhase("hidden");
        return;
      }
    } catch {}

    // 1. Enter animation starts on next frame
    const enterRaf = requestAnimationFrame(() => {
      setPhase("brand");
    });

    // 2. After brand entrance, show content
    const contentTimer = setTimeout(() => {
      setPhase("content");
    }, 600);

    // 3. After minDuration, check if ready
    const minDurationTimer = setTimeout(() => {
      minPassedRef.current = true;
      checkDismiss();
    }, minDuration);

    // 4. Absolute max — force dismiss even if nothing ready
    const maxTimer = setTimeout(() => {
      dismiss();
    }, maxDuration);

    // 5. Listen for readyPromise
    let readyTimer: ReturnType<typeof setTimeout> | undefined;

    if (readyPromise) {
      readyPromise.then(
        () => {
          readyRef.current = true;
          checkDismiss();
        },
        () => {
          // Promise rejected — treat as not ready, will be caught by maxTimer
        }
      );

      // After minDuration + 1.5s, show "still loading" indicator
      readyTimer = setTimeout(() => {
        if (!readyRef.current && minPassedRef.current) {
          setShowExtending(true);
          setPhase("extending");
        }
      }, minDuration + 1500);
    }

    function checkDismiss() {
      if (minPassedRef.current && (readyRef.current || !readyPromise)) {
        dismiss();
      }
    }

    return () => {
      cancelAnimationFrame(enterRaf);
      clearTimeout(contentTimer);
      clearTimeout(minDurationTimer);
      clearTimeout(maxTimer);
      if (readyTimer) clearTimeout(readyTimer);
    };
  }, [minDuration, maxDuration, readyPromise, dismiss]);

  if (phase === "hidden") return null;

  // ── Dynamic classes per phase ───────────────────────────────────────
  const isVisible = phase !== "entering"; // hidden already excluded by early return above
  const overlayOpacity = phase === "entering" ? "opacity-0" : "opacity-100";

  const brandVisible = phase === "brand" || phase === "content" || phase === "holding" || phase === "extending" || phase === "exiting";
  const brandPulse = phase === "content" || phase === "holding" || phase === "extending";

  const contentVisible = phase === "content" || phase === "holding" || phase === "extending";

  const exitFade = phase === "exiting" ? "opacity-0 scale-[0.97]" : "";

  const expCurve = "cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <div        className={cn(
        "pwa-splash fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-all duration-[400ms]",
        overlayOpacity,
        exitFade,
        className
      )}
      style={{
        background: "var(--page)",
        transitionTimingFunction: expCurve,
      }}
    >
      {/* ── Decorative background grid ────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Accent glow (radial) ──────────────────────────────────── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 70%)",
          opacity: brandVisible ? 1 : 0,
        }}
      />

      {/* ── Logo icon ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative transition-all duration-[700ms]",
          brandVisible ? "opacity-100 scale-100" : "opacity-0 scale-75",
          phase === "exiting" ? "scale-[0.85]" : "",
          brandPulse ? "translate-y-0" : ""
        )}
        style={{
          transitionTimingFunction: expCurve,
          transform: brandVisible ? "scale(1)" : "scale(0.75)",
          opacity: brandVisible ? 1 : 0,
        }}
      >
        <div
          className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-xl"
          style={{
            background: "var(--accent)",
            boxShadow:
              "0 8px 32px color-mix(in oklab, var(--accent) 25%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 10%, transparent)",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 4C16 4 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 4 16 4Z"
              fill="var(--accent-foreground)"
              opacity="0.92"
            />
            <path
              d="M16 26V14M16 14L12 18M16 14L20 18"
              stroke="var(--accent-foreground)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.65"
            />
          </svg>
        </div>

        {/* Subtle ring animation around logo */}
        {brandPulse && (
          <div
            className="absolute inset-0 -m-1 rounded-[26px] animate-[splash-ring_2s_ease-in-out_infinite]"
            style={{
              border: "1.5px solid color-mix(in oklab, var(--accent) 15%, transparent)",
            }}
          />
        )}
      </div>

      {/* ── App name + tagline ─────────────────────────────────────── */}
      <div
        className={cn(
          "mt-6 text-center transition-all duration-[600ms]",
          contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        )}
        style={{ transitionTimingFunction: expCurve }}
      >
        <h1
          className="text-[28px] font-bold tracking-tight"
          style={{ color: "var(--ink)" }}
        >
          LikasLens
        </h1>
        <p
          className="mt-1.5 text-sm font-mono"
          style={{ color: "var(--muted)" }}
        >
          From snapshot to solution
        </p>
      </div>

      {/* ── Loading dots (appear after tagline) ────────────────────── */}
      <div
        className={cn(
          "mt-10 flex items-center gap-2 transition-all duration-[500ms]",
          contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        style={{ transitionDelay: "150ms", transitionTimingFunction: expCurve }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: "var(--accent)",
              animation: `splash-dot 1.4s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Extending notice ──────────────────────────────────────────
           Only shows if content isn't ready 1.5s after minDuration.
           Calm, non-alarm — just "almost ready". */}
      {showExtending && (
        <div
          className="mt-6 transition-all duration-500"
          style={{
            animation: "splash-fade-in 400ms ease-out both",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono"
            style={{
              background: "color-mix(in oklab, var(--accent) 8%, transparent)",
              color: "var(--muted)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--accent)",
                animation: "splash-dot 1.4s ease-in-out infinite",
              }}
            />
            Almost ready
          </div>
        </div>
      )}

      {/* ── Inline keyframes ────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
@keyframes splash-dot {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1); }
}
@keyframes splash-ring {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.06); }
}
@keyframes splash-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .pwa-splash * { animation: none !important; transition: none !important; }
}
      `}} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: create a deferred promise pair for use in layouts
// ─────────────────────────────────────────────────────────────────────────────

interface DeferredPromise {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
}

/**
 * Creates a deferred promise that can be passed to `<PwaSplashScreen readyPromise={...} />`.
 * Call `resolve()` when your critical content has loaded.
 *
 * @example
 *   const ready = useDeferredPromise();
 *   // Pass to splash: <PwaSplashScreen readyPromise={ready.promise} />
 *   // Call when ready: ready.resolve()
 */
export function useDeferredPromise(): DeferredPromise {
  const deferredRef = useRef<DeferredPromise | null>(null);

  if (!deferredRef.current) {
    let resolve: () => void = () => {};
    let reject: (reason?: unknown) => void = () => {};
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    deferredRef.current = { promise, resolve, reject };
  }

  return deferredRef.current;
}
