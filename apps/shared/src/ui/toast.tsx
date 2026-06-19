"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "../utils";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const DISMISS_DURATIONS: Record<ToastType, number | null> = {
  success: 3500,
  info: 5000,
  warning: 5000,
  error: 8000,
  loading: null, // persistent until dismissed or replaced
};

let toastId = 0;
const listeners: Array<(toast: ToastItem) => void> = [];

export function showToast(message: string, type: ToastType = "info") {
  const toast: ToastItem = { id: String(++toastId), message, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast]);

      const duration = DISMISS_DURATIONS[toast.type];
      if (duration !== null) {
        const timer = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          timersRef.current.delete(toast.id);
        }, duration);
        timersRef.current.set(toast.id, timer);
      }
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (!toasts.length) return null;

  const typeStyles: Record<ToastType, string> = {
    success:
      "bg-[#eef7f0] border-[#cce8d2] text-[#4a7c59] shadow-sm",
    error: 
      "bg-[#fff5f5] border-[#feb2b2] text-[#c53030] shadow-sm",
    warning:
      "bg-[#fffaf0] border-[#fbd38d] text-[#dd6b20] shadow-sm",
    loading:
      "bg-white border-[#e2e8f0] text-[#1e293b] shadow-sm",
    info: 
      "bg-[#eef7f0] border-[#cce8d2] text-[#4a7c59] shadow-sm",
  };

  const typeIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />,
    warning: (
      <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
    ),
    loading: (
      <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" />
    ),
    info: <Info className="w-5 h-5 shrink-0" aria-hidden="true" />,
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-auto"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t, idx) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-sm font-medium shadow-lg backdrop-blur-md",
            "animate-scale-in",
            typeStyles[t.type]
          )}
          role="alert"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {typeIcons[t.type]}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="p-0.5 hover:opacity-70 transition-opacity shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}


