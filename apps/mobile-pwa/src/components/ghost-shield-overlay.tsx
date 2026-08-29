"use client";

import { Shield } from "lucide-react";
import { cn } from "@likaslens/shared";

interface GhostShieldOverlayProps {
  active: boolean;
  className?: string;
}

export function GhostShieldOverlay({ active, className }: GhostShieldOverlayProps) {
  if (!active) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center",
        className
      )}
    >
      {/* Amber tint overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(245, 158, 11, 0.08)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Shield watermark - large translucent */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            border: "1px solid rgba(245, 158, 11, 0.15)",
            animation: "shieldPulse 3s ease-in-out infinite",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        />
        {/* Shield icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "2px solid rgba(245, 158, 11, 0.3)",
            boxShadow: "0 0 40px rgba(245, 158, 11, 0.15)",
          }}
        >
          <Shield
            className="w-10 h-10"
            style={{ color: "rgba(245, 158, 11, 0.7)" }}
          />
        </div>
      </div>

      {/* "Identity Protected" label */}
      <div
        className="mt-6 px-4 py-2 rounded-full"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#f59e0b",
            margin: 0,
          }}
        >
          Identity Protected
        </p>
      </div>

      {/* CSS animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shieldPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
      `}} />
    </div>
  );
}
