"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Search, Loader2 } from "lucide-react";

export interface ModalOption {
  value: string;
  label: string;
  description?: string;
}

interface BulkActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional supporting line under the title */
  subtitle?: string;
  options: ModalOption[];
  onSelect: (value: string) => void;
  /** Render a custom row (e.g. status pill + color) */
  renderRow?: (opt: ModalOption) => ReactNode;
  loading?: boolean;
  /** Icon shown next to the title */
  icon?: ReactNode;
  /** Placeholder for the search box */
  searchPlaceholder?: string;
}

export function BulkActionModal({
  open,
  onClose,
  title,
  subtitle,
  options,
  onSelect,
  renderRow,
  loading,
  icon,
  searchPlaceholder = "Search...",
}: BulkActionModalProps) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus the search box when the modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      // Slight delay so the input is mounted
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = query
    ? options.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          (o.description?.toLowerCase().includes(q) ?? false)
        );
      })
    : options;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50">
        <div className="bg-white border border-ink/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-ink/5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                {icon}
                <h2 className="font-heading font-bold text-lg text-ink">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {subtitle && (
              <p className="text-sm text-ink/50">{subtitle}</p>
            )}
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-ink/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                ref={searchRef}
                type="text"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-ink/[0.02] border border-ink/10 rounded-xl text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-[340px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-ink/30" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-ink/40">No matches for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSelect(opt.value)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-ink/[0.03] transition-colors flex items-center gap-3 group"
                >
                  {renderRow ? (
                    renderRow(opt)
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                          {opt.label}
                        </p>
                        {opt.description && (
                          <p className="text-xs text-ink/50 mt-0.5">{opt.description}</p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-ink/30 uppercase tracking-wider">
                        {opt.value}
                      </span>
                    </>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-ink/5 flex items-center justify-between">
            <span className="font-mono text-xs text-ink/40">
              {filtered.length} option{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
