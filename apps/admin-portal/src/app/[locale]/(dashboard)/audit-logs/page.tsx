"use client";
import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { PaginatedResponse } from "@likaslens/shared";
import { Spinner, Dropdown } from "@likaslens/shared";
import { ScrollText } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  actor: { id: string; name: string } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = { per_page: "50" };
    if (actionFilter) params.action = actionFilter;
    laravelGet<PaginatedResponse<AuditLogEntry>>(`/admin/audit-logs?${new URLSearchParams(params)}`)
      .then((res) => { if (res.success) setLogs(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actionFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">Audit Logs</h1>
        <p className="font-mono text-base text-muted mt-1">Track all administrative actions</p>
      </div>

      <div className="flex gap-4 max-w-xs">
        <Dropdown
          value={actionFilter}
          onChange={(val) => setActionFilter(val as string)}
          options={[
            { value: "", label: "All actions" },
            { value: "role_change", label: "Role changes" },
            { value: "user_deleted", label: "User deletions" },
            { value: "report_resolved", label: "Report resolved" },
          ]}
          size="md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-panel rounded-3xl shadow-sm border border-ink/5 overflow-hidden">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-4 border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors">
              <ScrollText className="mt-0.5 h-5 w-5 text-ink/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold bg-ink/[0.04] text-ink/60">
                    {log.action}
                  </span>
                  <span className="font-mono text-xs text-muted">{log.entity_type}</span>
                </div>
                <p className="font-mono text-sm text-ink/70">
                  {log.actor?.name ?? "System"} · {new Date(log.created_at).toLocaleString()}
                </p>
                {log.ip_address && (
                  <p className="font-mono text-xs text-muted mt-1">IP: {log.ip_address}</p>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center font-mono text-sm text-muted py-12">No audit logs found</p>
          )}
        </div>
      )}
    </div>
  );
}
