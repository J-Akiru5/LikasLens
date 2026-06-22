"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  loading: null,
};

type ToastHandler = (toast: ToastItem) => void;

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;
const listeners: Set<ToastHandler> = typeof window !== "undefined" ? new Set() : new Set();

function emitToast(toast: ToastItem) {
  if (typeof window !== "undefined") {
    listeners.forEach((fn) => fn(toast));
  }
}

export function showToast(message: string, type: ToastType = "info") {
  const toast: ToastItem = { id: String(++toastId), message, type };
  emitToast(toast);
}

interface ToastProviderProps {
  children?: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handler: ToastHandler = (toast: ToastItem) => {
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

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
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

  const contextValue: ToastContextValue = {
    showToast: useCallback((message: string, type: ToastType = "info") => {
      showToast(message, type);
    }, []),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainerUI toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast };
  }
  return context;
}

interface ToastContainerProps {
  toasts?: ToastItem[];
  onDismiss?: (id: string) => void;
}

export function ToastContainer(props: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isControlled = props.toasts !== undefined;

  useEffect(() => {
    if (isControlled) return;

    const handler: ToastHandler = (toast: ToastItem) => {
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

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [isControlled]);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
    props.onDismiss?.(id);
  }, [props.onDismiss]);

  const displayToasts = isControlled ? props.toasts ?? [] : toasts;

  if (!displayToasts.length) return null;

  return <ToastContainerUI toasts={displayToasts} onDismiss={dismiss} />;
}

function ToastContainerUI({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  const typeStyles: Record<ToastType, string> = {
    success: "bg-[#4a7c59] border-transparent text-white shadow-md",
    error: "bg-[#4a7c59] border-transparent text-white shadow-md",
    warning: "bg-[#4a7c59] border-transparent text-white shadow-md",
    loading: "bg-[#4a7c59] border-transparent text-white shadow-md",
    info: "bg-[#4a7c59] border-transparent text-white shadow-md",
  };

  const typeIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />,
    loading: <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" />,
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
            onClick={() => onDismiss(t.id)}
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
