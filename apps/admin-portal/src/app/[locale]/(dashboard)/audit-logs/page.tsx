"use client";
import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { ScrollText, Search } from "lucide-react";

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
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Audit Logs</h1>
        <p className="font-mono text-sm surface-muted mt-1">Track all administrative actions</p>
      </div>

      <div className="flex gap-4">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="brutal-panel theme-input rounded px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_#1b4332]">
          <option value="">All actions</option>
          <option value="role_change">Role changes</option>
          <option value="user_deleted">User deletions</option>
          <option value="report_resolved">Report resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="brutal-panel panel-surface p-4 border-2 border-primary/20 hover:border-primary transition-colors flex items-start gap-3">
              <ScrollText className="mt-0.5 h-5 w-5 surface-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded px-2 py-0.5 text-xs font-bold uppercase font-mono tracking-widest border-2 border-primary/30 bg-primary/10">
                    {log.action}
                  </span>
                  <span className="font-mono text-xs surface-muted">{log.entity_type}</span>
                </div>
                <p className="font-mono text-sm">
                  {log.actor?.name ?? "System"} &middot; {new Date(log.created_at).toLocaleString()}
                </p>
                {log.ip_address && (
                  <p className="font-mono text-xs surface-muted mt-1">IP: {log.ip_address}</p>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center font-mono text-sm surface-muted py-12">No audit logs found</p>
          )}
        </div>
      )}
    </div>
  );
}
