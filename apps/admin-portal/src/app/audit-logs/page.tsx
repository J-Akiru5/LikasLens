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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500">Track all administrative actions</p>
      </div>

      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All actions</option>
          <option value="role_change">Role changes</option>
          <option value="user_deleted">User deletions</option>
          <option value="report_resolved">Report resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <ScrollText className="mt-0.5 h-4 w-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-400">{log.entity_type}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {log.actor?.name ?? "System"} &middot; {new Date(log.created_at).toLocaleString()}
                </p>
                {log.ip_address && (
                  <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-12">No audit logs found</p>
          )}
        </div>
      )}
    </div>
  );
}
