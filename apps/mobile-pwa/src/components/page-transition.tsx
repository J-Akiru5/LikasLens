"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * PageTransition — wraps page content and applies a fade-in on route change.
 * Combined with loading.tsx skeletons, this gives the feel of:
 * tap → instant skeleton → smooth fade → real content.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname && ref.current) {
      ref.current.style.opacity = "0";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.style.transition = "opacity 0.18s ease-out";
            ref.current.style.opacity = "1";
          }
        });
      });
    }
    prevPath.current = pathname;
  }, [pathname]);

  return (
    <div ref={ref} className="min-h-full">
      {children}
    </div>
  );
}
