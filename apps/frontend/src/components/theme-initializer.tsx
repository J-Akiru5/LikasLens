"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("likaslens-theme");
      if (savedTheme === "ghost") {
        document.documentElement.setAttribute("data-theme", "ghost");
      }
    } catch (e) {}
  }, []);

  return null;
}
