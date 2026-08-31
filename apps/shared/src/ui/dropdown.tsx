"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { cn } from "../utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

type DropdownItems = DropdownOption[] | DropdownGroup[];

interface DropdownBaseProps {
  /** Currently selected value(s) */
  value: string | string[];
  /** Options array or grouped options array */
  options: DropdownItems;
  /** Placeholder text when nothing selected */
  placeholder?: string;
  /** Additional classes on the trigger button */
  className?: string;
  /** Disable the dropdown entirely */
  disabled?: boolean;
  /** Show a loading spinner instead of the chevron */
  loading?: boolean;
  /** Max visible items before scrolling */
  maxVisibleItems?: number;
  /** Width of the dropdown menu; defaults to trigger width */
  menuWidth?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show a search input at top of options */
  searchable?: boolean;
  /** Called when the selection is cleared (single-select only) */
  onClear?: () => void;
}

interface SingleSelectProps extends DropdownBaseProps {
  multi?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends DropdownBaseProps {
  multi: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type DropdownProps = SingleSelectProps | MultiSelectProps;

// ─── Helpers ────────────────────────────────────────────────────────────────

function isGrouped(items: DropdownItems): items is DropdownGroup[] {
  return (
    items.length > 0 &&
    "options" in items[0] &&
    "label" in (items[0] as DropdownGroup)
  );
}

function flattenOptions(items: DropdownItems): DropdownOption[] {
  if (isGrouped(items)) {
    return items.flatMap((g) => g.options);
  }
  return items;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Dropdown(props: DropdownProps) {
  const {
    value,
    options,
    placeholder = "Select an option",
    className,
    disabled = false,
    loading = false,
    maxVisibleItems = 6,
    menuWidth,
    size = "md",
    searchable = false,
    onClear,
  } = props;

  const multi = "multi" in props && props.multi === true;

  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  // ── Memos ──────────────────────────────────────────────────────────────

  const allOptions = useMemo(() => flattenOptions(options), [options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const q = searchQuery.toLowerCase();

    if (isGrouped(options)) {
      return options
        .map((group) => ({
          ...group,
          options: group.options.filter(
            (o) =>
              o.label.toLowerCase().includes(q) ||
              o.description?.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.options.length > 0);
    }

    return (options as DropdownOption[]).filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  const filteredFlat = useMemo(
    () => flattenOptions(filteredOptions),
    [filteredOptions]
  );

  const selectedLabel = useMemo(() => {
    if (multi) {
      const selected = allOptions.filter((o) =>
        (value as string[]).includes(o.value)
      );
      if (selected.length === 0) return null;
      if (selected.length === 1) return selected[0].label;
      return `${selected.length} selected`;
    }
    return allOptions.find((o) => o.value === value)?.label ?? null;
  }, [allOptions, value, multi]);

  const isSelected = useCallback(
    (optValue: string) => {
      if (multi) return (value as string[]).includes(optValue);
      return value === optValue;
    },
    [value, multi]
  );

  // ── Placement detection ────────────────────────────────────────────────

  const computePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const itemHeight = size === "sm" ? 36 : size === "lg" ? 52 : 44;
    const menuHeight = Math.min(filteredFlat.length, maxVisibleItems) * itemHeight + 100;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }
  }, [filteredFlat.length, maxVisibleItems, size]);

  // ── Open / Close ───────────────────────────────────────────────────────

  const open = useCallback(() => {
    if (disabled) return;
    computePlacement();
    setIsOpen(true);
    setSearchQuery("");
    setFocusedIndex(-1);
    optionRefs.current = [];
  }, [disabled, computePlacement]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  // ── Selection ──────────────────────────────────────────────────────────

  const select = useCallback(
    (optValue: string) => {
      if (multi) {
        const current = value as string[];
        const next = current.includes(optValue)
          ? current.filter((v) => v !== optValue)
          : [...current, optValue];
        (props.onChange as (val: string[]) => void)(next);
      } else {
        (props.onChange as (val: string) => void)(optValue);
        close();
      }
    },
    [multi, value, props, close]
  );

  // ── Outside click ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // ── Keyboard navigation ────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredFlat.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredFlat.length - 1
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (
            focusedIndex >= 0 &&
            focusedIndex < filteredFlat.length &&
            !filteredFlat[focusedIndex].disabled
          ) {
            select(filteredFlat[focusedIndex].value);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(filteredFlat.length - 1);
          break;
        case "Tab":
          close();
          break;
      }
    },
    [isOpen, filteredFlat, focusedIndex, select, open, close]
  );

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedIndex]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);



  // ── Size classes ───────────────────────────────────────────────────────

  const sizeStyles = {
    sm: "h-9 text-xs px-3",
    md: "h-11 text-sm px-4",
    lg: "h-12 text-base px-5",
  };

  const iconSize = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const itemHeight = size === "sm" ? 36 : size === "lg" ? 52 : 44;

  // ── Render option ──────────────────────────────────────────────────────

  const renderOption = (
    option: DropdownOption,
    index: number,
    isInGroup?: boolean
  ) => {
    const selected = isSelected(option.value);
    const focused = focusedIndex === index;
    const optId = `${baseId}-opt-${index}`;

    return (
      <button
        key={option.value}
        ref={(el) => {
          optionRefs.current[index] = el;
        }}
        id={optId}
        type="button"
        role="option"
        aria-selected={selected}
        aria-disabled={option.disabled}
        disabled={option.disabled}
        onClick={() => !option.disabled && select(option.value)}
        onMouseEnter={() => setFocusedIndex(index)}
        className={cn(
          "w-full text-left flex items-center gap-3 transition-all duration-150",
          "focus:outline-none focus:bg-ink/[0.03]",
          !isInGroup && "px-4",
          isInGroup && "px-6",
          size === "sm" && "py-2 text-xs",
          size === "md" && "py-2.5 text-sm",
          size === "lg" && "py-3 text-base",
          option.disabled
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer",
          selected
            ? "bg-ink/[0.03] text-ink font-medium"
            : "text-ink/80",
          focused && !option.disabled && !selected && "bg-ink/[0.03]"
        )}
      >
        {/* Checkmark column */}
        <span className="w-5 flex-shrink-0 flex items-center justify-center">
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check
                className={cn(
                  "text-green",
                  size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
                )}
                strokeWidth={2.5}
              />
            </motion.span>
          )}
        </span>

        {/* Icon */}
        {option.icon && (
          <span
            className={cn(
              "flex-shrink-0 text-ink/50",
              selected && "text-ink"
            )}
          >
            {option.icon}
          </span>
        )}

        {/* Label + Description */}
        <span className="flex-1 min-w-0">
          <span className="block truncate">{option.label}</span>
          {option.description && (
            <span className="block text-[11px] text-ink/40 truncate mt-0.5 font-normal">
              {option.description}
            </span>
          )}
        </span>
      </button>
    );
  };

  // ── Render menu content ────────────────────────────────────────────────

  const renderMenuContent = () => {
    if (filteredFlat.length === 0) {
      return (
        <div className="px-4 py-8 text-center">
          <Search
            className={cn(
              "mx-auto text-ink/20 mb-2",
              size === "sm" ? "w-5 h-5" : "w-6 h-6"
            )}
          />
          <p className="text-sm text-ink/40">No options found</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-xs text-green hover:underline font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      );
    }

    if (isGrouped(filteredOptions)) {
      let globalIndex = -1;
      return (filteredOptions as DropdownGroup[]).map((group) => {
        const groupStartIndex = globalIndex + 1;
        globalIndex += group.options.length;

        return (
          <div key={group.label}>
            <div
              className={cn(
                "px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-ink/30 font-bold",
                size === "lg" && "py-2 text-[11px]"
              )}
            >
              {group.label}
            </div>
            {group.options.map((opt) => {
              const idx = groupStartIndex + group.options.indexOf(opt);
              return renderOption(opt, idx, true);
            })}
          </div>
        );
      });
    }

    return (filteredOptions as DropdownOption[]).map((opt, idx) =>
      renderOption(opt, idx)
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${baseId}-menu`}
        aria-label={placeholder}
        aria-activedescendant={
          isOpen && focusedIndex >= 0
            ? `${baseId}-opt-${focusedIndex}`
            : undefined
        }
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "w-full flex items-center gap-2 rounded-xl border transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/40",
          sizeStyles[size],
          disabled
            ? "opacity-50 cursor-not-allowed bg-ink/[0.02] border-ink/5"
            : isOpen
              ? "border-green/40 bg-page shadow-sm"
              : "border-ink/10 bg-page hover:border-ink/20 hover:shadow-sm",
          selectedLabel ? "text-ink" : "text-ink/50"
        )}
      >
        {/* Selected value chips (multi) or label (single) */}
        <span className="flex-1 truncate text-left flex items-center gap-1.5">
          {multi && (value as string[]).length > 0 && (
            <span className="flex items-center gap-1 flex-wrap">
              {(value as string[]).slice(0, 2).map((v) => {
                const opt = allOptions.find((o) => o.value === v);
                return opt ? (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green/10 text-green text-xs font-medium"
                  >
                    {opt.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        select(v);
                      }}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
              {(value as string[]).length > 2 && (
                <span className="text-xs text-ink/40">
                  +{(value as string[]).length - 2}
                </span>
              )}
            </span>
          )}
          {!multi && selectedLabel}
          {!selectedLabel && placeholder}
        </span>

        {/* Clear button */}
        {!multi && selectedLabel && onClear && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className={cn(
              "text-ink/30 hover:text-ink/60 transition-colors rounded-full p-0.5",
              iconSize[size]
            )}
            aria-label="Clear selection"
          >
            <X className={iconSize[size]} />
          </button>
        )}

        {/* Chevron / Spinner */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn("text-ink/30 flex-shrink-0", iconSize[size])}
        >
          {loading ? (
            <svg
              className={cn("animate-spin", iconSize[size])}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
          ) : (
            <ChevronDown className={iconSize[size]} strokeWidth={2} />
          )}
        </motion.span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            id={`${baseId}-menu`}
            role="listbox"
            aria-multiselectable={multi || undefined}
            initial={{
              opacity: 0,
              y: placement === "top" ? 12 : -12,
              scaleY: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scaleY: 1,
            }}
            exit={{
              opacity: 0,
              y: placement === "top" ? 12 : -12,
              scaleY: 0.95,
            }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin:
                placement === "top" ? "bottom center" : "top center",
            }}
            className={cn(
              "absolute z-50 rounded-2xl border border-ink/10 bg-panel shadow-2xl backdrop-blur-2xl overflow-hidden",
              placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
              menuWidth || "w-full"
            )}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-3 border-b border-ink/5">
                <div className="relative">
                  <Search
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 text-ink/30",
                      size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
                    )}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(-1);
                    }}
                    placeholder="Search..."
                    className={cn(
                      "w-full rounded-xl border border-ink/10 bg-ink/[0.02] text-ink placeholder:text-ink/30",
                      "focus:outline-none focus:border-ink/20 transition-colors",
                      size === "sm" && "pl-8 pr-3 py-1.5 text-xs",
                      size === "md" && "pl-9 pr-3 py-2 text-sm",
                      size === "lg" && "pl-10 pr-4 py-2.5 text-base"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className={cn(
                        "absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors",
                        size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
                      )}
                    >
                      <X
                        className={
                          size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
                        }
                      />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options */}
            <div
              className="overflow-y-auto overscroll-contain py-1"
              style={{
                maxHeight: `${
                  Math.min(filteredFlat.length, maxVisibleItems) * itemHeight +
                  (filteredFlat.length > maxVisibleItems ? 8 : 0)
                }px`,
              }}
            >
              {renderMenuContent()}
            </div>

            {/* Footer for multi-select count */}
            {multi && (value as string[]).length > 0 && (
              <div className="px-4 py-2 border-t border-ink/5 flex items-center justify-between">
                <span className="text-xs text-ink/40">
                  {(value as string[]).length} selected
                </span>
                <button
                  type="button"
                  onClick={() =>
                    (props.onChange as (val: string[]) => void)([])
                  }
                  className="text-xs text-green hover:underline font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
