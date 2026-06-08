"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldWarning, X } from "@phosphor-icons/react";
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
          >
            <div className="relative w-full max-w-md bg-page border border-ink/10 shadow-lg rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-ink/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldWarning className="w-6 h-6 text-ink/40" weight="fill" />
                    <h2 className="font-semibold tracking-tight text-lg text-ink">Edge Alert</h2>
                  </div>
                  <button onClick={onCancel} className="p-1 text-ink/40 hover:text-ink transition-colors" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold tracking-tight text-base text-ink mb-2">High-Risk Incident Detected</h3>
                  <p className="font-mono text-sm text-ink/60 leading-relaxed">
                    Our AI has flagged this submission as potentially dangerous. This might involve illegal logging, dangerous criminals, or high-risk environmental crimes.
                  </p>
                  {indicators.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {indicators.map((label, i) => (
                        <span key={i} className="font-mono text-xs text-ink/50 bg-ink/[0.04] px-2.5 py-1 rounded">{label}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-l-2 border-ink/10 pl-4 py-2">
                  <p className="font-mono text-sm text-ink/80 font-medium">Recommendation: Use Ghost Mode</p>
                  <p className="font-mono text-xs text-ink/50 mt-1">This removes your identity, location, and device info from the report. Only the facts matter.</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2d6a4f]" disabled={isLoading} />
                  <span className="font-mono text-sm text-ink/60">Submit in Ghost Mode (recommended)</span>
                </label>
              </div>

              <div className="flex gap-3 p-6 border-t border-ink/10">
                <button onClick={onCancel} disabled={isLoading} className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 hover:text-ink transition-colors disabled:opacity-50 rounded-lg">
                  Cancel
                </button>
                <button onClick={onProceed} disabled={isLoading} className="flex-1 py-3 bg-[#2d6a4f] text-[#fcfaf7] text-sm font-medium hover:bg-[#23543e] transition-colors disabled:opacity-50 rounded-lg">
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
