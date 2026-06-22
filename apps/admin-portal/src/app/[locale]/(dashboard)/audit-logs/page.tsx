"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAuditLogs,
  getAuditLogDetail,
  getAuditLogActions,
  Button,
  Skeleton,
  EmptyState,
  Modal,
  showToast,
} from "@likaslens/shared";
import type { AuditLogEntry } from "@likaslens/shared";
import {
  ChevronLeft,
  ChevronRight,
  ScrollText,
  User,
  ArrowRight,
  Download,
  List,
  GitBranch,
  Eye,
  Globe,
  Monitor,
  Shield,
  RefreshCw,
} from "lucide-react";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All entities" },
  { value: "ticket", label: "Tickets" },
  { value: "user", label: "Users" },
  { value: "ngo_group", label: "NGOs" },
];

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green/10 text-green",
  updated: "bg-accent/10 text-accent",
  deleted: "bg-red/10 text-red",
  role_change: "bg-amber/10 text-amber",
  bulk_role_change: "bg-amber/10 text-amber",
  bulk_user_deactivated: "bg-red/10 text-red",
  bulk_ticket_status_changed: "bg-accent/10 text-accent",
  bulk_ticket_assigned: "bg-green/10 text-green",
  bulk_ngo_verified: "bg-green/10 text-green",
  bulk_ngo_deleted: "bg-red/10 text-red",
  triage_manual_classify: "bg-accent/10 text-accent",
  triage_dismiss_spam: "bg-red/10 text-red",
  triage_escalated: "bg-amber/10 text-amber",
  user_deleted: "bg-red/10 text-red",
  report_resolved: "bg-green/10 text-green",
};

const TIMELINE_DOT_COLORS: Record<string, string> = {
  created: "bg-green",
  bulk_ticket_assigned: "bg-green",
  bulk_ngo_verified: "bg-green",
  report_resolved: "bg-green",
  updated: "bg-accent",
  bulk_ticket_status_changed: "bg-accent",
  triage_manual_classify: "bg-accent",
  deleted: "bg-red",
  bulk_user_deactivated: "bg-red",
  bulk_ngo_deleted: "bg-red",
  triage_dismiss_spam: "bg-red",
  user_deleted: "bg-red",
  role_change: "bg-amber",
  bulk_role_change: "bg-amber",
  triage_escalated: "bg-amber",
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] ?? "bg-ink/[0.04] text-ink/60";
}

function getTimelineDotColor(action: string): string {
  return TIMELINE_DOT_COLORS[action] ?? "bg-ink/30";
}

function formatActionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

// ─── CSV Export Helper ─────────────────────

function exportToCsv(logs: AuditLogEntry[]) {
  const headers = [
    "ID",
    "Timestamp",
    "Actor",
    "Action",
    "Entity Type",
    "Entity ID",
    "IP Address",
    "Changes",
  ];

  const rows = logs.map((log) => [
    log.id,
    new Date(log.created_at).toLocaleString(),
    log.actor?.name ?? "System",
    log.action,
    log.entity_type,
    log.entity_id,
    log.ip_address ?? "",
    log.old_values && log.new_values
      ? summarizeChanges(log.old_values, log.new_values)
      : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function summarizeChanges(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): string {
  const allKeys = new Set([
    ...Object.keys(oldValues),
    ...Object.keys(newValues),
  ]);
  const changes: string[] = [];

  for (const key of allKeys) {
    const oldVal = oldValues[key];
    const newVal = newValues[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push(
        `${key}: ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}`
      );
    }
  }

  return changes.join("; ");
}

// ─── Audit Log Skeleton ────────────────────

function AuditLogSkeleton() {
  return (
    <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden animate-fade-in">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 border-b border-ink/5 last:border-0"
        >
          <Skeleton className="w-5 h-5 rounded shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Diff Modal ────────────────────────────

function DiffModal({
  isOpen,
  onClose,
  log,
}: {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogEntry | null;
}) {
  if (!log) return null;

  const allKeys = log.old_values
    ? new Set([
        ...Object.keys(log.old_values),
        ...(log.new_values ? Object.keys(log.new_values) : []),
      ])
    : log.new_values
      ? new Set(Object.keys(log.new_values))
      : new Set<string>();

  const changedFields = Array.from(allKeys).filter((key) => {
    const ov = log.old_values?.[key];
    const nv = log.new_values?.[key];
    return JSON.stringify(ov) !== JSON.stringify(nv);
  });

  const hasChanges = changedFields.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Log #${log.id.slice(0, 8)}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block mb-1">
              Action
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getActionColor(log.action)}`}
            >
              {formatActionLabel(log.action)}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block mb-1">
              Entity
            </span>
            <p className="font-mono text-sm text-ink">
              {log.entity_type} &middot; {log.entity_id.slice(0, 8)}
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block mb-1">
              Actor
            </span>
            <p className="font-mono text-sm text-ink">
              {log.actor?.name ?? "System"}
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block mb-1">
              Timestamp
            </span>
            <p className="font-mono text-sm text-ink">
              {new Date(log.created_at).toLocaleString()}
            </p>
          </div>
          {log.ip_address && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block mb-1">
                IP Address
              </span>
              <p className="font-mono text-sm text-ink flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-ink/40" />
                {log.ip_address}
              </p>
            </div>
          )}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block mb-1">
              User Agent
            </span>
            <p className="font-mono text-xs text-ink/60 flex items-center gap-1.5 truncate">
              <Monitor className="w-3.5 h-3.5 text-ink/40 shrink-0" />
              {log.user_agent ?? "N/A"}
            </p>
          </div>
        </div>

        {/* Diff view */}
        {!hasChanges ? (
          <div className="py-4">
            <EmptyState
              icon={Eye}
              title="No changes recorded"
              description="No field differences were found for this audit entry."
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 font-bold">
              Changes ({changedFields.length} field
              {changedFields.length !== 1 ? "s" : ""})
            </p>

            {/* Header row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2 rounded-t-xl bg-red/5 border border-red/10 border-b-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-red/70 font-bold">
                  Old Value
                </p>
              </div>
              <div className="px-3 py-2 rounded-t-xl bg-green/5 border border-green/10 border-b-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-green/70 font-bold">
                  New Value
                </p>
              </div>
            </div>

            {changedFields.map((field) => (
              <div key={field} className="space-y-1">
                <p className="font-mono text-xs font-bold text-ink/60">
                  {field}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3 py-2 rounded-b-xl bg-red/5 border border-red/10">
                    <p className="font-mono text-xs text-ink/70 break-all">
                      {log.old_values?.[field] !== undefined
                        ? JSON.stringify(log.old_values[field])
                        : "\u2014"}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-b-xl bg-green/5 border border-green/10">
                    <p className="font-mono text-xs text-ink/70 break-all">
                      {log.new_values?.[field] !== undefined
                        ? JSON.stringify(log.new_values[field])
                        : "\u2014"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Timeline View ─────────────────────────

function TimelineView({
  logs,
  onSelect,
}: {
  logs: AuditLogEntry[];
  onSelect: (log: AuditLogEntry) => void;
}) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit logs found"
        description="Administrative actions and changes will be recorded here for compliance tracking."
      />
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-ink/10" />

      <div className="space-y-6">
        {logs.map((log) => {
          const dotColor = getTimelineDotColor(log.action);
          const hasChanges =
            log.old_values &&
            log.new_values &&
            Object.keys(log.old_values).length > 0;

          return (
            <div key={log.id} className="relative group">
              <div
                className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full ${dotColor} ring-4 ring-page`}
              />

              <button
                type="button"
                onClick={() => onSelect(log)}
                className="w-full text-left bg-panel rounded-2xl border border-ink/5 p-4 hover:border-ink/10 hover:shadow-sm transition-all duration-200 cursor-pointer group-hover:border-ink/10"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getActionColor(log.action)}`}
                    >
                      {formatActionLabel(log.action)}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {log.entity_type}
                    </span>
                    <span className="font-mono text-xs text-ink/30">
                      #{log.entity_id.slice(0, 8)}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-ink/70">
                  <User className="w-3.5 h-3.5 text-ink/40" />
                  <span className="font-mono text-xs">
                    {log.actor?.name ?? "System"}
                  </span>
                </div>

                {hasChanges && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-ink/40">
                      <span className="px-1.5 py-0.5 rounded bg-red/5 text-red/70">
                        {Object.keys(log.old_values!).length} old
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="px-1.5 py-0.5 rounded bg-green/5 text-green/70">
                        {Object.keys(log.new_values!).length} new
                      </span>
                    </div>
                  </div>
                )}

                {log.ip_address && (
                  <p className="font-mono text-xs text-muted mt-2">
                    IP: {log.ip_address}
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  // Dynamic action options from backend
  const [actionOptions, setActionOptions] = useState<string[]>([]);

  const hasActiveFilters =
    actionFilter !== "" ||
    entityFilter !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  // Load action types for filter dropdown on mount
  useEffect(() => {
    getAuditLogActions()
      .then((res) => {
        if (res.success) setActionOptions(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        per_page: "50",
        page: String(page),
      };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await getAuditLogs(params);
      if (res.success) {
        setLogs(res.data);
        setLastPage(res.meta?.last_page ?? 1);
        setTotal(res.meta?.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError("Failed to load audit log data");
      showToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = useCallback(() => {
    setActionFilter("");
    setEntityFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  const handleSelectLog = useCallback(
    async (log: AuditLogEntry) => {
      if (log.old_values || log.new_values) {
        setSelectedLog(log);
        setDiffModalOpen(true);
        return;
      }

      try {
        const res = await getAuditLogDetail(log.id);
        if (res.success) {
          setSelectedLog(res.data as AuditLogEntry);
          setDiffModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch audit log detail:", err);
        setSelectedLog(log);
        setDiffModalOpen(true);
      }
    },
    []
  );

  const handleExportCsv = useCallback(() => {
    if (logs.length === 0) return;
    exportToCsv(logs);
    showToast("CSV exported successfully", "success");
  }, [logs]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
          Audit Logs
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          {loading
            ? "Loading..."
            : total > 0
              ? `${total} audit log${total === 1 ? "" : "s"} recorded`
              : "No audit logs found"}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-ink/[0.03] rounded-xl p-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all ${
              viewMode === "table"
                ? "bg-panel shadow-sm text-ink font-bold"
                : "text-ink/50 hover:text-ink/70"
            }`}
          >
            <List className="w-4 h-4" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all ${
              viewMode === "timeline"
                ? "bg-panel shadow-sm text-ink font-bold"
                : "text-ink/50 hover:text-ink/70"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Timeline
          </button>
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer"
        >
          <option value="">All actions</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {formatActionLabel(action)}
            </option>
          ))}
        </select>

        {/* Entity filter */}
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer"
        >
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Date from */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
            From
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
            To
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={clearFilters}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </Button>
        )}

        <div className="flex-1" />

        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={handleExportCsv}
          disabled={logs.length === 0}
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <AuditLogSkeleton />
      ) : error && logs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Failed to load audit logs"
          description={error}
          colorTheme="red"
          action={{ label: "Retry", onClick: fetchLogs }}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit logs found"
          description={
            hasActiveFilters
              ? "No results match your current filters. Try adjusting or clearing them."
              : "Administrative actions and changes will be recorded here for compliance tracking."
          }
          action={
            hasActiveFilters
              ? { label: "Clear filters", onClick: clearFilters }
              : undefined
          }
        />
      ) : viewMode === "table" ? (
        /* ─── Table View ─── */
        <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-4 border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors"
            >
              <ScrollText className="mt-0.5 h-5 w-5 text-ink/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getActionColor(log.action)}`}
                  >
                    {formatActionLabel(log.action)}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {log.entity_type}
                  </span>
                  <span className="font-mono text-xs text-ink/30">
                    #{log.entity_id.slice(0, 8)}
                  </span>
                </div>
                <p className="font-mono text-sm text-ink/70">
                  {log.actor?.name ?? "System"} &middot;{" "}
                  {new Date(log.created_at).toLocaleString()}
                </p>
                {log.ip_address && (
                  <p className="font-mono text-xs text-muted mt-1">
                    IP: {log.ip_address}
                  </p>
                )}
              </div>

              {(log.old_values || log.new_values) && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => handleSelectLog(log)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Diff
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ─── Timeline View ─── */
        <TimelineView logs={logs} onSelect={handleSelectLog} />
      )}

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            Page {page} of {lastPage}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      <DiffModal
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}
