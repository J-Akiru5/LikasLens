"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      // Only activate when scrolled to top
      if (el && el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    },
    [disabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing || startY.current === null) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) {
        startY.current = null;
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy < 10) return;
      pulling.current = true;
      const distance = Math.min(dy * 0.5, MAX_PULL);
      setPullDistance(distance);
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${distance}px)`;
        contentRef.current.style.transition = "none";
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
    const currentPull = pullDistance;

    if (currentPull >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(40);
      if (contentRef.current) {
        contentRef.current.style.transition = "transform 0.2s ease-out";
        contentRef.current.style.transform = "translateY(40px)";
      }
      try {
        await onRefresh();
      } catch {
        // silent
      }
      setRefreshing(false);
    }

    setPullDistance(0);
    startY.current = null;
    if (contentRef.current) {
      contentRef.current.style.transition = "transform 0.25s ease-out";
      contentRef.current.style.transform = "translateY(0)";
      setTimeout(() => {
        if (contentRef.current) contentRef.current.style.transition = "";
      }, 260);
    }
  }, [disabled, pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <>
      {/* Indicator — pointer-events-none so it never blocks header clicks */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-[998] pointer-events-none"
        style={{ height: pullDistance || (refreshing ? 40 : 0), paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-page/90 border border-ink/10 shadow-sm text-ink text-xs font-medium backdrop-blur-sm"
          style={{ opacity: 0.2 + progress * 0.8 }}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin text-green" />
          ) : (
            <ArrowDown
              className="w-4 h-4 transition-transform duration-150"
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          )}
          <span>
            {refreshing ? "Refreshing..." : pullDistance >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Scrollable content — touch handlers are on this container, not a fixed overlay */}
      <div
        ref={containerRef}
        data-ptr-content
        className={cn("h-full overflow-y-auto overscroll-contain", className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </>
  );
}
