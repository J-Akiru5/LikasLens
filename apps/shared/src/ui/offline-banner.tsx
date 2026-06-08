"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WifiSlash, CheckCircle } from "@phosphor-icons/react";

interface OfflineBannerProps {
  /** Text shown in the offline banner. */
  offlineMessage?: string;
  /** Text shown when connection is restored. */
  restoredMessage?: string;
  /** How long (ms) to keep the restored banner visible before dismissing. */
  restoredDurationMs?: number;
}

export function OfflineBanner({
  offlineMessage = "You are offline. Reports will be queued until connection is restored.",
  restoredMessage = "Connection restored. Syncing queued reports.",
  restoredDurationMs = 4500,
}: OfflineBannerProps) {
  const [mounted, setMounted] = useState(false);

  // Three visual states: "online", "offline", "restored"
  const [status, setStatus] = useState<"online" | "offline" | "restored">(
    "online",
  );

  // Track previous online state so we only show restored after an actual dropout
  const wasOfflineRef = useRef(false);
  const restoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRestoredTimer = useCallback(() => {
    if (restoredTimerRef.current !== null) {
      clearTimeout(restoredTimerRef.current);
      restoredTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        // Transitioning from offline → online: show the success banner
        setStatus("restored");
        wasOfflineRef.current = false;

        clearRestoredTimer();
        restoredTimerRef.current = setTimeout(() => {
          setStatus("online");
        }, restoredDurationMs);
      } else {
        setStatus("online");
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      clearRestoredTimer();
      setStatus("offline");
    };

    // Set initial state
    if (navigator.onLine) {
      setStatus("online");
      wasOfflineRef.current = false;
    } else {
      setStatus("offline");
      wasOfflineRef.current = true;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearRestoredTimer();
    };
  }, [clearRestoredTimer, restoredDurationMs]);

  // SSR guard
  if (!mounted) return null;

  // Completely online with no recent restoration — render nothing
  if (status === "online") return null;

  const isRestored = status === "restored";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "fixed top-0 left-0 right-0 z-50",
        "px-4 py-3",
        "flex items-center justify-center gap-2.5",
        "text-sm font-medium",
        "animate-slide-down",
        isRestored
          ? "bg-green-600 text-white shadow-lg shadow-green-600/30 animate-fade-out"
          : "bg-accent text-white shadow-lg shadow-accent/30",
      ].join(" ")}
    >
      {isRestored ? (
        <>
          <CheckCircle weight="fill" className="w-4 h-4 flex-shrink-0" />
          <span>{restoredMessage}</span>
        </>
      ) : (
        <>
          <WifiSlash weight="bold" className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>{offlineMessage}</span>
        </>
      )}
    </div>
  );
}
