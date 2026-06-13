"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close (ESC, backdrop click, X button) */
  onClose: () => void;
  /** Optional title rendered in the header */
  title?: string;
  /** Modal body content */
  children: ReactNode;
  /** Modal width variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional classes on the modal panel */
  className?: string;
  /** Show/hide the X close button in the header */
  showCloseButton?: boolean;
  /** Allow closing by clicking the backdrop */
  closeOnBackdrop?: boolean;
  /** Allow closing via Escape key */
  closeOnEsc?: boolean;
  /** Optional header action rendered opposite the title */
  headerAction?: ReactNode;
  /** When true, modal takes full screen on mobile (< 768px) */
  fullscreenMobile?: boolean;
}

// ─── Size map ───────────────────────────────────────────────────────────────

const sizeMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100vw-2rem)]",
};

// ─── Animation variants ─────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
  },
};

// ─── Focus trap hook ────────────────────────────────────────────────────────

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function getFocusableElements() {
      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector)
      );
    }

    // Focus the first focusable element on open
    const firstFocusable = getFocusableElements()[0];
    if (firstFocusable) {
      // Delay to let the animation start
      requestAnimationFrame(() => firstFocusable.focus());
    }

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isActive, containerRef]);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  headerAction,
  fullscreenMobile = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen);

  // ESC key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }

    // Use capture phase to intercept before other handlers
    document.addEventListener("keydown", handleKey, { capture: true });
    return () =>
      document.removeEventListener("keydown", handleKey, { capture: true });
  }, [isOpen, closeOnEsc, onClose]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
    
        >
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />


          {/* Panel */}
          <motion.div
            key="modal-panel"
            ref={panelRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            role="dialog"
            aria-modal="true"
            aria-label={title || "Dialog"}
            className={cn(
              "relative z-10 w-full rounded-2xl border border-border bg-page shadow-xl shadow-black/10 overflow-hidden",
              "max-h-[85vh] flex flex-col",
              fullscreenMobile
                ? "sm:max-h-[85vh] sm:rounded-2xl rounded-b-none fixed bottom-0 left-0 right-0 sm:static max-h-[90vh]"
                : "",
              sizeMap[size],
              className
            )}
          >
            {/* Header */}
            {(title || showCloseButton || headerAction) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {title && (
                    <h2 className="text-lg font-semibold tracking-tight text-ink truncate">
                      {title}
                    </h2>
                  )}
                  {headerAction}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 -mr-1.5 rounded-lg text-muted hover:text-ink hover:bg-ink/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Confirmation modal shorthand ───────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted leading-relaxed">{message}</p>

      <div className="flex items-center gap-3 mt-8">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-ink/60 hover:text-ink hover:bg-ink/[0.03] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            variant === "danger"
              ? "bg-red text-white hover:bg-red/90 focus-visible:ring-red/40"
              : "bg-accent text-white hover:opacity-90 focus-visible:ring-accent/40"
          )}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {confirmLabel}
            </span>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}
