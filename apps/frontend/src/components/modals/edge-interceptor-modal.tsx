"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { useEffect } from "react";

interface EdgeInterceptorModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onProceed: () => void;
  isLoading?: boolean;
  indicators?: string[];
}

export function EdgeInterceptorModal({
  isOpen,
  onCancel,
  onProceed,
  isLoading = false,
  indicators = [],
}: EdgeInterceptorModalProps) {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) onCancel();
            }}
          >
            <div className="relative w-full max-w-md panel-surface border-4 border-accent shadow-[12px_12px_0px_#1B4332] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-accent to-accent/90 p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="animate-pulse">
                      <ShieldAlert className="w-8 h-8 text-[#081C15]" />
                    </div>
                    <h2 className="font-heading text-2xl font-black uppercase text-[#081C15]">
                      Edge Alert
                    </h2>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6 text-[#081C15]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-6 flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-mono font-bold uppercase text-sm mb-2 text-primary">
                      High-Risk Incident Detected
                    </h3>
                    <p className="surface-muted text-base font-medium leading-relaxed">
                      Our AI has flagged this submission as potentially dangerous to you or others. 
                      This might involve illegal logging, dangerous criminals, or high-risk environmental crimes.
                    </p>
                    {indicators.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {indicators.map((label, i) => (
                          <span
                            key={i}
                            className="inline-block px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest border border-accent bg-accent/10 text-accent rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-accent/10 border-l-4 border-accent p-4 mb-6 rounded">
                  <p className="font-mono text-sm font-bold text-accent uppercase">
                    Recommendation: Use Ghost Mode
                  </p>
                    <p className="text-xs surface-muted mt-2">
                    This removes your identity, location, and device info from the report. Only the facts matter.
                  </p>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-2 border-primary accent-secondary cursor-pointer"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-mono surface-muted group-hover:text-foreground">
                      Submit in Ghost Mode (recommended)
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t-2 border-primary/20 bg-background">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border-2 border-primary text-primary font-bold uppercase rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[2px]"
                >
                  Cancel
                </button>
                <button
                  onClick={onProceed}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-accent text-[#081C15] border-2 border-accent font-bold uppercase rounded-lg hover:brightness-110 transition-all shadow-[4px_4px_0px_#1B4332] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[2px] active:shadow-none"
                >
                  {isLoading ? "Submitting..." : "Proceed Anonymously"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
