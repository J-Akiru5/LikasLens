"use client";

import { useEffect } from "react";
import { AnimatePresence, m } from "framer-motion";

/**
 * BottomSheet — native-feeling spring sheet, replacing absolute popovers.
 *
 * - Rises with spring physics from the bottom.
 * - Backdrop dims + blurs the page.
 * - Tap backdrop or drag the grabber down to dismiss.
 * - Locks body scroll while open.
 * - Safe-area-aware (home indicator padding baked in via .ios-sheet).
 *
 * Works on Android and iOS alike; uses no platform-specific APIs.
 */
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  // Lock background scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            className="ios-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <m.div
            className="ios-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="ios-sheet-grabber" aria-hidden="true" />
            {title && (
              <div style={{ padding: "6px 20px 4px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              </div>
            )}
            <div style={{ padding: title ? "8px 20px 24px" : "8px 20px 24px" }}>
              {children}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
