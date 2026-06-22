"use client";

import { useEffect } from "react";

export function HeadScripts() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("likaslens-theme");
      if (saved === "ghost") {
        document.documentElement.setAttribute("data-theme", "ghost");
      }
    } catch {}

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
