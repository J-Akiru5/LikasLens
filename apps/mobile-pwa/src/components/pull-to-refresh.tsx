"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@likaslens/shared";
import { useTranslations } from "next-intl";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

/**
 * PullToRefresh — native pull-to-refresh for the PWA.
 *
 * When the user pulls down from the top of a scrollable area, a refresh
 * indicator appears. Releasing after sufficient pull triggers onRefresh.
 */
export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const t = useTranslations("pullToRefresh");
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return; // Only at top
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    },
    [disabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return;

      const dy = e.touches[0].clientY - startY.current;
      if (dy < 10) return;

      pulling.current = true;
      const distance = Math.min(dy * 0.5, MAX_PULL); // Dampened pull
      setPullDistance(distance);
    },
    [disabled, refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(40); // Hold indicator visible
      try {
        await onRefresh();
      } catch {
        // silent
      }
      setRefreshing(false);
    }

    setPullDistance(0);
  }, [disabled, pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden transition-none z-10"
        style={{ height: pullDistance || (refreshing ? 40 : 0) }}
      >
        <div
          className="flex items-center gap-2 text-ink/60 text-sm font-medium"
          style={{
            opacity: progress,
            transform: `rotate(${progress * 180}deg)`,
          }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-green" />
          ) : (
            <ArrowDown className="w-5 h-5" />
          )}
          {refreshing ? (
            <span>{t("refreshing")}</span>
          ) : pullDistance >= THRESHOLD ? (
            <span>{t("releaseToRefresh")}</span>
          ) : (
            <span>{t("pullToRefresh")}</span>
          )}
        </div>
      </div>

      {/* Content shifts down when pulling */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 && !refreshing ? "transform 0.25s ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
