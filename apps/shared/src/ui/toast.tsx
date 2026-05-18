"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

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

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 border-2 font-mono text-sm font-bold rounded-lg shadow-[4px_4px_0px_#1b4332] backdrop-blur-md ${
            t.type === "success"
              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
              : t.type === "error"
              ? "border-amber-400 bg-amber-50 text-amber-800"
              : t.type === "loading"
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary bg-background/90 text-primary"
          }`}
        >
          {t.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {t.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {t.type === "loading" && <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />}
          {t.type === "info" && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
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
