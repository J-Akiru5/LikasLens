"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, WarningCircle, Info, Spinner } from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info" | "loading";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Array<(toast: ToastItem) => void> = [];

export function showToast(message: string, type: ToastType = "info") {
  const toast: ToastItem = { id: String(++toastId), message, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.type !== "error" && toast.type !== "loading") {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 5000);
      }
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!toasts.length) return null;

  const typeStyles: Record<ToastType, string> = {
    success: "border-green bg-green/10 text-green",
    error: "border-accent bg-accent/10 text-accent",
    loading: "border-ink/20 bg-panel",
    info: "border-accent bg-accent/10 text-accent",
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-medium shadow-lg backdrop-blur-md ${typeStyles[t.type]}`}
        >
          {t.type === "success" && <CheckCircle weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {t.type === "error" && <WarningCircle weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {t.type === "loading" && <Spinner className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />}
          {t.type === "info" && <Info weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
