"use client";

import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { cn } from "../utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isGhostMode, setIsGhostMode] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsGhostMode(theme === "ghost");

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setIsGhostMode(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const newTheme = isGhostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    setIsGhostMode(!isGhostMode);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isGhostMode ? "Civic" : "Ghost"} mode`}
      aria-pressed={isGhostMode}
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200",
        isGhostMode
          ? "bg-accent/10 border border-accent/20 text-accent"
          : "border border-border text-ink/60 hover:bg-ink/[0.02]",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Fingerprint
          className={cn(
            "w-4 h-4 transition-colors",
            isGhostMode ? "text-accent" : "text-muted"
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "font-mono text-xs uppercase tracking-wider font-medium",
            isGhostMode ? "text-accent" : "text-muted"
          )}
        >
          Ghost Mode
        </span>
      </div>
      <div
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors duration-200",
          isGhostMode ? "bg-accent" : "bg-ink/10"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
            isGhostMode ? "left-[22px]" : "left-0.5"
          )}
        />
      </div>
    </button>
  );
}
