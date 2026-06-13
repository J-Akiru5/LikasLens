"use client";
import { useEffect, useState, useCallback } from "react";
import { getAuditLogs, getAuditLogDetail } from "@likaslens/shared";
import type { AuditLogEntry } from "@likaslens/shared";
import { Dropdown, AdminTableSkeleton, Modal, EmptyState } from "@likaslens/shared";
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
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  { value: "", label: "All entities" },
  { value: "Ticket", label: "Tickets" },
  { value: "User", label: "Users" },
  { value: "Ngo", label: "NGOs" },
  { value: "Report", label: "Reports" },
  { value: "Law", label: "Laws" },
  { value: "Reward", label: "Rewards" },
];

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green/10 text-green",
  updated: "bg-accent/10 text-accent",
  deleted: "bg-red/10 text-red",
  role_change: "bg-amber/10 text-amber",
  user_deleted: "bg-red/10 text-red",
  report_resolved: "bg-green/10 text-green",
};

const TIMELINE_DOT_COLORS: Record<string, string> = {
  created: "bg-green",
  updated: "bg-accent",
  deleted: "bg-red",
  role_change: "bg-amber",
  user_deleted: "bg-red",
  report_resolved: "bg-green",
};

// ─── CSV Export Helper ──────────────────────────────────────────────────────

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
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
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

// ─── Change Summary Helper ──────────────────────────────────────────────────

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

// ─── Diff Modal ─────────────────────────────────────────────────────────────

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
            <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-1">
              Action
            </p>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${ACTION_COLORS[log.action] ?? "bg-ink/[0.04] text-ink/60"}`}
            >
              {log.action}
            </span>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-1">
              Entity
            </p>
            <p className="font-mono text-sm text-ink">
              {log.entity_type} &middot; {log.entity_id.slice(0, 8)}
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-1">
              Actor
            </p>
            <p className="font-mono text-sm text-ink">
              {log.actor?.name ?? "System"}
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/40 mb-1">
              Timestamp
            </p>
            <p className="font-mono text-sm text-ink">
              {new Date(log.created_at).toLocaleString()}
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
            <p className="font-mono text-xs uppercase tracking-widest text-ink/40">
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

            {/* Field rows */}
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
                        : "—"}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-b-xl bg-green/5 border border-green/10">
                    <p className="font-mono text-xs text-ink/70 break-all">
                      {log.new_values?.[field] !== undefined
                        ? JSON.stringify(log.new_values[field])
                        : "—"}
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

// ─── Timeline View ──────────────────────────────────────────────────────────

function TimelineView({
  logs,
  onSelect,
}: {
  logs: AuditLogEntry[];
  onSelect: (log: AuditLogEntry) => void;
}) {
  if (logs.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={ScrollText}
          title="No audit logs found"
          description="Administrative actions and changes will be recorded here for compliance tracking."
        />
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-ink/10" />

      <div className="space-y-6">
        {logs.map((log) => {
          const dotColor =
            TIMELINE_DOT_COLORS[log.action] ?? "bg-ink/30";
          const hasChanges =
            log.old_values &&
            log.new_values &&
            Object.keys(log.old_values).length > 0;

          return (
            <div key={log.id} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full ${dotColor} ring-4 ring-page`}
              />

              {/* Content */}
              <button
                type="button"
                onClick={() => onSelect(log)}
                className="w-full text-left bg-panel rounded-2xl border border-ink/5 p-4 hover:border-ink/10 hover:shadow-sm transition-all duration-200 cursor-pointer group-hover:border-ink/10"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${ACTION_COLORS[log.action] ?? "bg-ink/[0.04] text-ink/60"}`}
                    >
                      {log.action}
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

                {/* Change summary preview */}
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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {
      per_page: "50",
      page: String(page),
    };
    if (actionFilter) params.action = actionFilter;
    if (entityFilter) params.entity_type = entityFilter;

    getAuditLogs(params)
      .then((res) => {
        if (res.success) {
          setLogs(res.data);
          setLastPage(res.meta?.last_page ?? 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actionFilter, entityFilter, page]);

  const handleSelectLog = useCallback(
    async (log: AuditLogEntry) => {
      // If we already have the old/new values, just show the modal
      if (log.old_values || log.new_values) {
        setSelectedLog(log);
        setDiffModalOpen(true);
        return;
      }

      // Otherwise fetch the full detail from the API
      try {
        const res = await getAuditLogDetail(log.id);
        if (res.success) {
          setSelectedLog(res.data as AuditLogEntry);
          setDiffModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch audit log detail:", err);
        // Fallback: show whatever we have
        setSelectedLog(log);
        setDiffModalOpen(true);
      }
    },
    []
  );

  const handleExportCsv = useCallback(() => {
    exportToCsv(logs);
  }, [logs]);

  const handleActionFilterChange = useCallback((val: string) => {
    setActionFilter(val);
    setPage(1);
  }, []);

  const handleEntityFilterChange = useCallback((val: string) => {
    setEntityFilter(val);
    setPage(1);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
          Audit Logs
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Track all administrative actions
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
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

        {/* Filters */}
        <Dropdown
          value={actionFilter}
          onChange={handleActionFilterChange}
          options={[
            { value: "", label: "All actions" },
            { value: "created", label: "Created" },
            { value: "updated", label: "Updated" },
            { value: "deleted", label: "Deleted" },
            { value: "role_change", label: "Role changes" },
            { value: "user_deleted", label: "User deletions" },
            { value: "report_resolved", label: "Report resolved" },
          ]}
          size="md"
          className="max-w-[200px]"
        />

        <Dropdown
          value={entityFilter}
          onChange={handleEntityFilterChange}
          options={ENTITY_TYPES}
          size="md"
          className="max-w-[200px]"
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export button */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <AdminTableSkeleton rows={8} columns={5} showSearch={false} />
      ) : viewMode === "table" ? (
        /* ─── Table View ─── */
        <div className="bg-panel rounded-3xl shadow-sm border border-ink/5 overflow-hidden">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-4 border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors"
            >
              <ScrollText className="mt-0.5 h-5 w-5 text-ink/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${ACTION_COLORS[log.action] ?? "bg-ink/[0.04] text-ink/60"}`}
                  >
                    {log.action}
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

              {/* View detail button */}
              {(log.old_values || log.new_values) && (
                <button
                  type="button"
                  onClick={() => handleSelectLog(log)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest text-ink/40 hover:text-ink/70 hover:bg-ink/[0.04] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Diff
                </button>
              )}
            </div>
          ))}
          {logs.length === 0 && (
            <EmptyState
              icon={ScrollText}
              title="No audit logs found"
              description="Administrative actions and changes will be recorded here for compliance tracking."
            />
          )}
        </div>
      ) : (
        /* ─── Timeline View ─── */
        <TimelineView logs={logs} onSelect={handleSelectLog} />
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            Page {page} of {lastPage}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="flex items-center gap-1 px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
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
