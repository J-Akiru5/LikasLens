"use client";

import { useState, useEffect } from "react";

export function useIsGhostMode() {
  const [isGhost, setIsGhost] = useState(false);
  useEffect(() => {
    const check = () => setIsGhost(document.documentElement.getAttribute("data-theme") === "ghost");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return isGhost;
}

export function useChartColors() {
  const isGhost = useIsGhostMode();
  return {
    isGhost,
    text: isGhost ? "#e2e8f0" : "#334155",
    textMuted: isGhost ? "#94a3b8" : "#64748b",
    axisLine: isGhost ? "#334155" : "#cbd5e1",
    splitLine: isGhost ? "#1e293b" : "#f1f5f9",
    border: isGhost ? "#0f172a" : "#e2e8f0",
    emphasisText: isGhost ? "#e2e8f0" : "#0f172a",
  };
}
