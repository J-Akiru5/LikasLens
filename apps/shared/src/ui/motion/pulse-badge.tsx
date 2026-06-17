"use client";

// ── PulseBadge ─────────────────────────────────────────────────────────
// Live indicator with breathing glow. Signals "this system is alive."

interface PulseBadgeProps {
  /** Badge text */
  label?: string;
  /** Dot color (Tailwind class) */
  color?: string;
  /** Glow color (CSS value) */
  glowColor?: string;
  /** Size */
  size?: "sm" | "md";
  /** Extra className */
  className?: string;
}

export function PulseBadge({
  label = "Live",
  color = "bg-green",
  glowColor = "rgba(34,197,94,0.4)",
  size = "sm",
  className = "",
}: PulseBadgeProps) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full font-medium ${textSize} ${className}`}
      style={{
        background: glowColor.replace(/[\d.]+\)$/, "0.1)"),
        border: `1px solid ${glowColor.replace(/[\d.]+\)$/, "0.25)")}`,
      }}
    >
      <span className="relative flex">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}
          style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
        />
        <span
          className={`relative inline-flex rounded-full ${dotSize} ${color}`}
        />
      </span>
      {label}
    </span>
  );
}
