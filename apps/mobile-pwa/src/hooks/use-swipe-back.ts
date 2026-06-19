"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * useSwipeBack — native iOS/Android edge-swipe to go back.
 *
 * Detects a horizontal swipe starting from the left edge of the screen
 * (within 25px) and navigates back when the user lifts their finger
 * after swiping > 60px horizontally with < 40px vertical movement.
 */
export function useSwipeBack(enabled = true) {
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const swiping = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (touch.clientX > 25) return;
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      lastX.current = touch.clientX;
      swiping.current = false;
    },
    [enabled],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || startX.current === 0) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = Math.abs(touch.clientY - startY.current);

      lastX.current = touch.clientX;

      if (dy > 40) {
        startX.current = 0;
        swiping.current = false;
        return;
      }

      if (dx > 10) swiping.current = true;
      if (!swiping.current) return;

      const offset = Math.min(dx, window.innerWidth * 0.4);
      const el = containerRef.current;
      if (el) {
        el.style.transform = `translateX(${offset}px)`;
        el.style.transition = "none";
        el.style.opacity = String(1 - offset / (window.innerWidth * 0.8));
      }
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !swiping.current) {
      startX.current = 0;
      swiping.current = false;
      return;
    }

    const el = containerRef.current;
    const dx = lastX.current - startX.current;
    startX.current = 0;
    swiping.current = false;

    if (el) {
      if (dx > 60) {
        // Threshold met — slide out then navigate
        el.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
        el.style.transform = `translateX(${window.innerWidth}px)`;
        el.style.opacity = "0";
        setTimeout(() => {
          router.back();
          if (el) {
            el.style.transform = "";
            el.style.transition = "";
            el.style.opacity = "";
          }
        }, 250);
      } else {
        // Snap back
        el.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
        el.style.transform = "translateX(0)";
        el.style.opacity = "1";
        setTimeout(() => {
          if (el) el.style.transition = "";
        }, 250);
      }
    }
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return containerRef;
}
