"use client";

import { useState, useRef, useCallback, type ReactNode, useEffect } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "../utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const THRESHOLD = 80;
const MAX_PULL = 120;
const TOP_RATIO = 0.2; // top 20% of viewport

export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      const touch = e.touches[0];
      if (touch.clientY > window.innerHeight * TOP_RATIO) {
        startY.current = null;
        return;
      }
      startY.current = touch.clientY;
      pulling.current = false;
    },
    [disabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      const touch = e.touches[0];
      if (startY.current === null) return;
      const dy = touch.clientY - startY.current;
      if (dy < 10) return;
      pulling.current = true;
      const el = document.querySelector("[data-ptr-content]") as HTMLElement | null;
      if (el) {
        el.style.transform = `translateY(${Math.min(dy * 0.5, MAX_PULL)}px)`;
        el.style.transition = "none";
      }
    },
    [disabled, refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !pulling.current) {
      startY.current = null;
      pulling.current = false;
      return;
    }
    pulling.current = false;
    const el = document.querySelector("[data-ptr-content]") as HTMLElement | null;
    const pull = el ? parseFloat(el.style.transform.match(/translateY\((.+)px\)/)?.[1] ?? "0") : 0;

    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(40);
      try {
        await onRefresh();
      } catch {
        // silent
      }
      setRefreshing(false);
    }

    setPullDistance(0);
    startY.current = null;
    if (el) {
      el.style.transition = "transform 0.25s ease-out";
      el.style.transform = "translateY(0)";
      setTimeout(() => { el.style.transition = ""; }, 260);
    }
  }, [disabled, onRefresh]);

  useEffect(() => {
    if (disabled) return;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <>
      {/* Fixed invisible pull zone — top 20% of viewport, only receives touches here */}
      <div
        className="fixed inset-x-0 z-[999]"
        style={{ top: 0, height: `${TOP_RATIO * 100}vh`, touchAction: "none" }}
      />

      {/* Indicator */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-[998] pointer-events-none"
        style={{ height: pullDistance || (refreshing ? 40 : 0), paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-page/90 border border-ink/10 shadow-sm text-ink text-xs font-medium backdrop-blur-sm"
          style={{ opacity: 0.2 + Math.min(pullDistance / THRESHOLD, 1) * 0.8 }}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin text-green" />
          ) : (
            <ArrowDown
              className="w-4 h-4 transition-transform duration-150"
              style={{ transform: `rotate(${Math.min(pullDistance / THRESHOLD, 1) * 180}deg)` }}
            />
          )}
          <span>
            {refreshing ? "Refreshing..." : pullDistance >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        data-ptr-content
        className={cn("h-full overflow-y-auto overscroll-contain", className)}
      >
        <div
          style={{
            transform: pullDistance > 0 && !refreshing ? `translateY(${pullDistance}px)` : undefined,
            transition: pullDistance === 0 && !refreshing ? "transform 0.25s ease-out" : undefined,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
