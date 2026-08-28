"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Ticket, Scale, Building2, Users, type LucideIcon } from "lucide-react";
import { cn } from "../utils";
import { laravelGet } from "../api/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  type: "ticket" | "law" | "ngo" | "user";
}

interface ResultGroup {
  type: SearchResult["type"];
  icon: LucideIcon;
  label: string;
  results: SearchResult[];
}

type SearchEntity = SearchResult["type"];

const ENTITY_CONFIG: Record<SearchEntity, {
  icon: LucideIcon;
  label: string;
  endpoint: string;
  hrefPrefix: string;
  extractResults: (data: unknown) => { id: string; label: string; subtitle: string }[];
}> = {
  ticket: {
    icon: Ticket,
    label: "Tickets",
    endpoint: "/tickets",
    hrefPrefix: "/tickets",
    extractResults: (data: any) => {
      const tickets = data?.data ?? [];
      return Array.isArray(tickets)
        ? tickets.map((t: any) => ({
            id: t.id,
            label: t.title || `Ticket #${t.id?.slice(0, 8)}`,
            subtitle: `${t.status || "unknown"} · ${t.violation_type || ""}`,
          }))
        : [];
    },
  },
  law: {
    icon: Scale,
    label: "Laws",
    endpoint: "/admin/laws",
    hrefPrefix: "/laws",
    extractResults: (data: any) => {
      const laws = data?.data ?? [];
      return Array.isArray(laws)
        ? laws.map((l: any) => ({
            id: l.id,
            label: l.title || l.name || `Law #${l.id?.slice(0, 8)}`,
            subtitle: l.code || l.jurisdiction || "",
          }))
        : [];
    },
  },
  ngo: {
    icon: Building2,
    label: "NGOs",
    endpoint: "/admin/ngos",
    hrefPrefix: "/ngos",
    extractResults: (data: any) => {
      const ngos = data?.data ?? [];
      return Array.isArray(ngos)
        ? ngos.map((n: any) => ({
            id: n.id,
            label: n.name,
            subtitle: n.focus || n.country || "",
          }))
        : [];
    },
  },
  user: {
    icon: Users,
    label: "Users",
    endpoint: "/admin/users",
    hrefPrefix: "/users",
    extractResults: (data: any) => {
      const users = data?.data ?? [];
      return Array.isArray(users)
        ? users.map((u: any) => ({
            id: u.id,
            label: u.name || u.email || `User #${u.id?.slice(0, 8)}`,
            subtitle: u.email || u.role || "",
          }))
        : [];
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  /** Open state — controlled mode */
  open?: boolean;
  /** Called when the modal wants to close */
  onOpenChange?: (open: boolean) => void;
  /** Entities to search across. Default: all */
  entities?: SearchEntity[];
}

/**
 * ⌘K Global Search — opens a modal overlay that searches across admin entities.
 *
 * Automatically registers the ⌘K / Ctrl+K keyboard shortcut.
 * Debounces input at 300ms and queries each entity's list endpoint with ?search=.
 *
 * @example
 *   // In an admin layout:
 *   <GlobalSearch />
 *
 *   // Controlled:
 *   <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
 */
export function GlobalSearch({
  open: controlledOpen,
  onOpenChange,
  entities: entityTypesProp,
}: GlobalSearchProps) {
  const router = useRouter();
  const entityTypes = useMemo(() => entityTypesProp ?? ["ticket", "law", "ngo", "user"], [entityTypesProp]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultGroup[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Client-only: detect platform for keyboard shortcut hint
  useEffect(() => {      setIsMac(navigator.platform?.includes("Mac") ?? false);
  }, []);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = useCallback(
    (v: boolean) => {
      if (onOpenChange) onOpenChange(v);
      else setInternalOpen(v);
      if (!v) {
        setQuery("");
        setResults([]);
        setSelectedIndex(-1);
      }
    },
    [onOpenChange]
  );

  // ── Keyboard shortcut ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      // ⌘K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);

  // ── Auto-focus input when opened ───────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow the modal animation to start
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Search debounce ────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const q = query.trim();
      if (!q) return;

      const entities = entityTypes;
      const promises = entities.map(async (type) => {
        const config = ENTITY_CONFIG[type];
        try {
          const data = await laravelGet<any>(
            `${config.endpoint}?per_page=5&search=${encodeURIComponent(q)}`
          );
          return { type, items: config.extractResults(data) };
        } catch {
          return { type, items: [] };
        }
      });

      const settled = await Promise.all(promises);
      const groups: ResultGroup[] = settled
        .filter((g) => g.items.length > 0)
        .map((g) => ({
          type: g.type,
          icon: ENTITY_CONFIG[g.type].icon,
          label: ENTITY_CONFIG[g.type].label,
          results: g.items.map((item: any) => ({
            ...item,
            type: g.type,
            href: `${ENTITY_CONFIG[g.type].hrefPrefix}/${item.id}`,
          })),
        }));

      setResults(groups);
      setSearching(false);
      setSelectedIndex(-1);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, entityTypes]);

  // ── Keyboard navigation within results ─────────────────────────────
  const flatResults = results.flatMap((g) => g.results);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < flatResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : flatResults.length - 1
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const result = flatResults[selectedIndex];
      if (result) {
        setIsOpen(false);
        router.push(result.href);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const totalResults = flatResults.length;

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[80] animate-[search-fade-in_150ms_ease-out_both]"
        style={{ background: "rgba(0, 0, 0, 0.4)" }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── Modal ─────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[81] flex items-start justify-center pt-[12vh] px-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        <div
          className={cn(
            "w-full max-w-[620px] pointer-events-auto animate-[search-slide_200ms_cubic-bezier(0.16,1,0.3,1)_both]",
            "rounded-2xl border shadow-2xl overflow-hidden"
          )}
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          }}
        >
          {/* ── Search input ───────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 h-14 border-b" style={{ borderColor: "var(--border)" }}>
            <Search className="w-5 h-5 shrink-0" style={{ color: "var(--muted)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tickets, laws, NGOs, users..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-sm"
              style={{ color: "var(--ink)" }}
              autoComplete="off"
              spellCheck={false}
            />
            {searching && (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: "var(--muted)" }} />
            )}
            <kbd
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border shrink-0"
              style={{
                color: "var(--muted)",
                background: "color-mix(in oklab, var(--ink) 4%, transparent)",
                borderColor: "var(--border)",
              }}
            >
              ESC
            </kbd>
          </div>

          {/* ── Results ────────────────────────────────────────────── */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain py-2">
            {query.trim() && searching && results.length === 0 && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
              </div>
            )}

            {query.trim() && !searching && totalResults === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 mb-3" style={{ color: "var(--muted-subtle)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  Try a different search term or browse the sidebar
                </p>
              </div>
            )}

            {!query.trim() && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 mb-3" style={{ color: "var(--muted-subtle)" }} />
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Type to search across all entities
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <kbd
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border"
                    style={{
                      color: "var(--muted)",
                      background: "color-mix(in oklab, var(--ink) 4%, transparent)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {isMac ? "⌘" : "Ctrl"}K
                  </kbd>
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                    to open anytime
                  </span>
                </div>
              </div>
            )}

            {results.map((group, gi) => {
              let resultOffset = 0;
              for (let i = 0; i < gi; i++) {
                resultOffset += results[i].results.length;
              }
              const Icon = group.icon;

              return (
                <div key={group.type}>
                  {/* Group header */}
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted)" }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {group.label}
                    <span className="font-mono text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--muted-subtle)" }}>
                      {group.results.length}
                    </span>
                  </div>

                  {/* Result items */}
                  {group.results.map((result, ri) => {
                    const idx = resultOffset + ri;
                    const isSelected = selectedIndex === idx;

                    return (
                      <button
                        key={result.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(result.href);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors duration-75"
                        style={{
                          background: isSelected
                            ? "color-mix(in oklab, var(--accent) 8%, transparent)"
                            : "transparent",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: isSelected
                              ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                              : "color-mix(in oklab, var(--ink) 4%, transparent)",
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{
                              color: isSelected ? "var(--accent)" : "var(--muted)",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--ink)" }}
                          >
                            {result.label}
                          </p>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: "var(--muted)" }}
                          >
                            {result.subtitle}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-mono shrink-0"
                          style={{ color: "var(--muted-subtle)" }}
                        >
                          Go
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Inline keyframes ──────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
@keyframes search-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes search-slide {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  [class*="search-"] { animation: none !important; }
}
      `}} />
    </>
  );
}
