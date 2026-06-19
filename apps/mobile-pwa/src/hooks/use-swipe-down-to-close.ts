"use client";

import { useRef, useCallback, useEffect } from "react";

interface SwipeDownToCloseOptions {
  threshold?: number;
}

/**
 * useSwipeDownToClose — native bottom sheet dismiss gesture.
 *
 * Attach the returned ref to the bottom sheet drag handle / header area.
 * When the user swipes down from that area, the onClose callback fires.
 */
export function useSwipeDownToClose(
  onClose: () => void,
  options: SwipeDownToCloseOptions = {},
) {
  const { threshold = 80 } = options;
  const startY = useRef(0);
  const currentY = useRef(0);
  const swiping = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const el = ref.current;
    if (!el) return;

    const sheetRect = el.getBoundingClientRect();
    const touchInSheet = touch.clientY - sheetRect.top;

    // Check if touch is in the scrollable content area (below the header/drag handle)
    const contentEl = el.querySelector(".overflow-y-auto, [data-scrollable]") as HTMLElement | null;
    const isHeaderTouch = touchInSheet <= 100;

    if (!isHeaderTouch && contentEl) {
      // Only allow swipe-to-close from content when content is already scrolled to top
      if (contentEl.scrollTop > 0) return;
    }

    if (!isHeaderTouch && !contentEl) return;

    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const dy = touch.clientY - startY.current;
    currentY.current = touch.clientY;

    if (dy < 10) return;
    if (dy < 0) return;

    swiping.current = true;
    const el = ref.current;
    if (el) {
      el.style.transition = "none";
      el.style.transform = `translateY(${Math.min(dy, window.innerHeight * 0.4)}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const dy = currentY.current - startY.current;
    const el = ref.current;

    if (el) {
      el.style.transition = "transform 0.25s ease-out";
      if (dy > threshold && swiping.current) {
        el.style.transform = `translateY(${window.innerHeight}px)`;
        setTimeout(() => {
          onClose();
          if (el) el.style.transform = "";
        }, 250);
      } else {
        el.style.transform = "translateY(0)";
        setTimeout(() => {
          if (el) {
            el.style.transition = "";
            el.style.transform = "";
          }
        }, 250);
      }
    }
    swiping.current = false;
    startY.current = 0;
    currentY.current = 0;
  }, [onClose, threshold]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return ref;
}
