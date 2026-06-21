"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setWidth(0);
    setVisible(true);

    const t1 = setTimeout(() => setWidth(60), 50);
    const t2 = setTimeout(() => setWidth(85), 200);
    const t3 = setTimeout(() => setWidth(95), 500);

    timerRef.current = setTimeout(() => {
      setWidth(100);
      setTimeout(() => setVisible(false), 300);
    }, 800);

    cleanupRef.current = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };

    return cleanupRef.current;
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, var(--accent), var(--green))",
          boxShadow: "0 0 8px var(--accent)",
        }}
      />
    </div>
  );
}
