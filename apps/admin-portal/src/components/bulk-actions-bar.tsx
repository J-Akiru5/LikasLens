"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ChevronDown } from "lucide-react";

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
  // New simplified props (used by tickets page)
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
      >
        {action.icon}
        {action.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && action.options && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[180px] bg-white border border-ink/10 shadow-xl rounded-xl overflow-hidden z-50">
          {action.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                action.onOptionSelect?.(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-ink/70 hover:text-ink hover:bg-ink/[0.04] transition-colors font-mono"
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-white border border-ink/10 rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-ink">
          {selectedCount} selected
        </span>

        <div className="w-px h-5 bg-ink/10" />

        {/* New simplified flow (tickets) */}
        {onAssignClick && (
          <button
            onClick={onAssignClick}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
          >
            Assign
          </button>
        )}
        {onAssignOfficerClick && (
          <button
            onClick={onAssignOfficerClick}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-green/10 text-green hover:bg-green/20 transition-colors disabled:opacity-40"
          >
            Assign officer
          </button>
        )}
        {onStatusClick && (
          <button
            onClick={onStatusClick}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-ink/[0.04] text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors disabled:opacity-40"
          >
            Status
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold bg-red/10 text-red hover:bg-red/20 transition-colors disabled:opacity-40"
          >
            Delete
          </button>
        )}

        {/* Legacy flow (NGOs, users) */}
        {actions?.map((action, i) => {
          if (action.options) {
            return <ActionDropdown key={i} action={action} />;
          }
          return (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-colors disabled:opacity-40 ${
                action.variant === "danger"
                  ? "bg-red/10 text-red hover:bg-red/20"
                  : "bg-ink/[0.04] text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          );
        })}

        <div className="w-px h-5 bg-ink/10" />

        <button
          onClick={onClear}
          className="p-1.5 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
