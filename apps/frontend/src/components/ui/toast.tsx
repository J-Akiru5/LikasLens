"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export type ToastTone = "success" | "error" | "info";

interface ToastProps {
  message: string;
  tone: ToastTone;
  onDismiss?: () => void;
  autoHideMs?: number;
}

const toneStyles: Record<ToastTone, string> = {
  success: "border-secondary bg-secondary/10 text-secondary",
  error: "border-accent bg-accent/10 text-accent",
  info: "border-primary bg-primary/10 text-primary",
};

export function Toast({ message, tone, onDismiss, autoHideMs = 5000 }: ToastProps) {
  useEffect(() => {
    if (!autoHideMs || !onDismiss) return;
    const timer = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`mb-6 p-4 border-2 font-mono text-sm font-bold rounded flex items-center justify-between gap-3 ${toneStyles[tone]}`}
        >
          <span>{message}</span>
          {onDismiss && (
            <button onClick={onDismiss} className="opacity-60 hover:opacity-100 shrink-0" aria-label="Dismiss">
              ✕
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
