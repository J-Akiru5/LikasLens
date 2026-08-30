"use client";

import { usePathname } from "next/navigation";
import { useRef, useLayoutEffect } from "react";

/**
 * PageTransition — native-feel instant page switch.
 *
 * Uses the View Transitions API where available for a smooth cross-fade.
 * Falls back to a subtle, ultra-fast opacity transition (80ms) that
 * never snaps to fully invisible — content stays visible throughout.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const prevPath = useRef(pathname);

  useLayoutEffect(() => {
    if (prevPath.current !== pathname && ref.current) {
      // Quick subtle fade — never fully invisible (0.85 → 1.0)
      ref.current.style.opacity = "0.85";
      ref.current.style.transition = "none";
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transition = "opacity 80ms ease-out";
          ref.current.style.opacity = "1";
        }
      });
    }
    prevPath.current = pathname;
  }, [pathname]);

  return (
    <div ref={ref} className="min-h-full h-full will-change-[opacity]">
      {children}
    </div>
  );
}
