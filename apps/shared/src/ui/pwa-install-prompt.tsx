"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { cn } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallPromptProps {
  /** Delay (ms) before the sheet slides up. Use to sequence after splash. Default 0. */
  appearDelay?: number;
  /** Override className. */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PWA Install Prompt — premium slide-up bottom sheet.
 *
 * Shows after the app determines this device can install the PWA.
 * Designed to complement the splash screen: splash → install prompt.
 *
 * On Android/Chrome it captures the native `beforeinstallprompt` event and
 * lets the user trigger it. On iOS it shows Share-button instructions.
 *
 * The sheet slides up with a spring animation, has a backdrop overlay,
 * and auto-dismisses once the user installs or dismisses.
 *
 * @example
 *   // Simple — shows immediately when installable
 *   <PwaInstallPrompt />
 *
 *   // After splash — delay 800ms to let splash exit animation finish
 *   <PwaInstallPrompt appearDelay={800} />
 */
export function PwaInstallPrompt({
  appearDelay = 0,
  className,
}: PwaInstallPromptProps) {
  // ── State ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"hidden" | "queued" | "visible" | "dismissed">("hidden");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  // ── Detect install eligibility ──────────────────────────────────────
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /ipad|iphone|ipod/.test(ua);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) return; // Already installed

    // Check if permanently dismissed
    try {
      if (localStorage.getItem("pwa-install-dismissed") === "true") return;
    } catch {}

    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // iOS: queue to show after delay
      setPhase("queued");
      return;
    }

    // Android/Chrome: listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setPhase("queued");
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if no beforeinstallprompt fires within 10s, show manual
    // instructions (some Android browsers suppress the event)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt.current && phase === "hidden") {
        setPhase("queued");
      }
    }, 10000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Appear delay → visible ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== "queued") return;

    const timer = setTimeout(() => {
      setPhase("visible");
    }, appearDelay);

    return () => clearTimeout(timer);
  }, [phase, appearDelay]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (prompt) {
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setPhase("dismissed");
      }
      deferredPrompt.current = null;
      // If user dismissed native prompt, keep our sheet open so they
      // can tap "Install" again (the native prompt is one-shot, but
      // the user may have accidentally dismissed)
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setPhase("dismissed");
    try {
      localStorage.setItem("pwa-install-dismissed", "true");
    } catch {}
  }, []);

  // ── Render ──────────────────────────────────────────────────────────
  if (phase !== "visible") return null;

  const expCurve = "cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[70] animate-[install-backdrop_300ms_ease-out_both]"
        style={{
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* ── Sheet ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed left-0 right-0 bottom-0 z-[71] outline-none animate-[install-sheet_400ms_cubic-bezier(0.16,1,0.3,1)_both]",
          className
        )}
        style={{
          background: "var(--panel)",
          borderRadius: "var(--r-sheet, 24px) var(--r-sheet, 24px) 0 0",
          boxShadow: "0 -12px 40px rgba(0, 0, 0, 0.18)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-label="Install LikasLens"
        aria-modal="true"
      >
        {/* ── Grabber handle ──────────────────────────────────────── */}
        <div className="flex justify-center pt-2 pb-1">
          <div
            className="w-9 h-[5px] rounded-full"
            style={{ background: "color-mix(in oklab, var(--ink) 18%, transparent)" }}
          />
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        <div className="px-6 pb-8 pt-2">
          {/* App icon row */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center shadow-md shrink-0"
              style={{
                background: "var(--accent)",
                boxShadow: "0 4px 16px color-mix(in oklab, var(--accent) 20%, transparent)",
              }}
            >
              <svg
                width="28"
                height="28"
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
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
                {isIOS ? "Install LikasLens" : "Add to Home Screen"}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                {isIOS
                  ? "Install the app for offline reports, push alerts, and a native experience."
                  : "Get offline reports, instant notifications, and faster access right from your home screen."}
              </p>
            </div>
          </div>

          {/* Feature list */}
          {!isIOS && (
            <div className="mb-5 space-y-2.5">
              {[
                { icon: Download, text: "Works offline — report without internet" },
                { icon: Smartphone, text: "Opens instantly, no browser chrome" },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.text} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "color-mix(in oklab, var(--accent) 10%, transparent)" }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--accent)" }}
                      />
                    </div>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {isIOS && (
            <div className="mb-5 p-3.5 rounded-xl" style={{ background: "color-mix(in oklab, var(--ink) 4%, transparent)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Tap the <strong>Share</strong> button <span className="text-base">⎙</span> in Safari, then scroll down and tap{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!isIOS && deferredPrompt.current && (
              <button
                onClick={handleInstall}
                className="flex-1 h-12 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  boxShadow: "0 4px 14px color-mix(in oklab, var(--accent) 25%, transparent)",
                }}
              >
                Install Now
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={cn(
                "h-12 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]",
                deferredPrompt.current && !isIOS ? "px-6" : "flex-1"
              )}
              style={{
                background: "color-mix(in oklab, var(--ink) 6%, transparent)",
                color: "var(--muted)",
              }}
            >
              {deferredPrompt.current && !isIOS ? "Not now" : "Got it"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline keyframes ──────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
@keyframes install-backdrop {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes install-sheet {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  [class*="install-"] { animation: none !important; }
  [class*="ios-sheet"] { animation: none !important; }
}
      `}} />
    </>
  );
}
