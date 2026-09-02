"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  ChevronDown,
  Building2,
  UserCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@likaslens/shared";

interface BulkActionOption {
  label: string;
  value: string;
}

interface BulkAction {
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
  options?: BulkActionOption[];
  onOptionSelect?: (value: string) => void;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  // Simplified props (used by tickets page)
  onStatusClick?: () => void;
  onAssignClick?: () => void;
  onAssignOfficerClick?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  // Legacy props (used by NGOs, users pages)
  actions?: BulkAction[];
}

function ActionDropdown({ action }: { action: BulkAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={action.disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-panel hover:bg-ink/[0.04] text-ink border border-border hover:border-ink/20 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {action.icon}
        <span>{action.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>
      {open && action.options && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[200px] bg-panel border border-border shadow-xl rounded-xl overflow-hidden z-50 p-1 divide-y divide-border">
          {action.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                action.onOptionSelect?.(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 text-xs text-ink hover:bg-ink/[0.04] transition-colors rounded-lg font-sans font-medium"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onStatusClick,
  onAssignClick,
  onAssignOfficerClick,
  onDelete,
  disabled,
  actions,
}: BulkActionsBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCount > 0 && barRef.current) {
      barRef.current.focus();
    }
  }, [selectedCount]);

  if (selectedCount === 0) return null;

  return (
    <div
      ref={barRef}
      tabIndex={-1}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200 focus:outline-none"
    >
      <div className="bg-panel/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 ring-1 ring-ink/[0.05]">
        {/* Selected Counter Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full text-xs font-mono font-bold bg-accent text-white shadow-2xs">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold text-ink font-sans">
            selected
          </span>
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Action Buttons (Real, Clickable Buttons with Clear Affordance) */}
        <div className="flex items-center gap-2 flex-wrap">
          {onAssignClick && (
            <button
              type="button"
              onClick={onAssignClick}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs hover:shadow transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Assign LGU</span>
            </button>
          )}

          {onAssignOfficerClick && (
            <button
              type="button"
              onClick={onAssignOfficerClick}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-panel hover:bg-ink/[0.04] text-ink border border-border hover:border-ink/20 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              <span>Assign Officer</span>
            </button>
          )}

          {onStatusClick && (
            <button
              type="button"
              onClick={onStatusClick}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-panel hover:bg-ink/[0.04] text-ink border border-border hover:border-ink/20 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted" />
              <span>Change Status</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Legacy Actions (for NGOs, users, etc.) */}
          {actions?.map((action, i) => {
            if (action.options) {
              return <ActionDropdown key={i} action={action} />;
            }
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer",
                  action.variant === "danger"
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20"
                    : "bg-panel hover:bg-ink/[0.04] text-ink border border-border hover:border-ink/20 shadow-2xs"
                )}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Clear / Deselect Button */}
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-ink/[0.05] transition-colors shrink-0 cursor-pointer"
          title="Clear selection"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Deselect</span>
        </button>
      </div>
    </div>
  );
}
