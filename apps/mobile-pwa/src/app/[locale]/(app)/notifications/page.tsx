"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, AlertTriangle, Info, ChevronRight, CircleCheck } from "lucide-react";
import { cn, useNotifications, EmptyState, formatDate } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";

function timeAgo(dateStr: string): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (isNaN(seconds) || seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "recently";
  }
}

function getNotifConfig(type: string) {
  if (type.toLowerCase().includes("sla") || type.toLowerCase().includes("escalation") || type.toLowerCase().includes("breach")) {
    return { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "SLA Escalation" };
  }
  if (type.toLowerCase().includes("ticket") || type.toLowerCase().includes("status") || type.toLowerCase().includes("resolved")) {
    return { icon: CircleCheck, color: "text-blue-500", bg: "bg-blue-500/10", label: "Ticket Update" };
  }
  return { icon: Info, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "System Alert" };
}

export default function NotificationsPage() {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        setAuthToken(data?.session?.access_token);
      }).catch(() => {});
    } catch {}
  }, []);

  const {
    notifications,
    meta,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotifications({ token: authToken });

  const hasMore = meta ? meta.current_page < meta.last_page : false;

  return (
    <div className="min-h-full pb-20 bg-page">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-page/85 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center justify-between h-16 px-4">
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Notifications</h1>
            {unreadCount > 0 ? (
              <p className="text-[11px] text-emerald-600 font-mono font-bold">{unreadCount} unread alerts</p>
            ) : (
              <p className="text-[11px] text-ink/40 font-mono">All alerts caught up</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-95 text-emerald-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="p-4 mt-2">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            <span className="text-xs font-mono text-ink/40">Syncing notification stream...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-ink/[0.03] border border-ink/10 flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-ink/30" />
            </div>
            <h3 className="font-bold text-base text-ink mb-1">No notifications yet</h3>
            <p className="text-xs text-ink/50 max-w-xs leading-relaxed">
              When there is activity on your verified reports or inter-agency SLA dispatches, you will see real-time updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => {
              const isRead = !!notif.read_at;
              const config = getNotifConfig(notif.type);
              const Icon = config.icon;
              const title = notif.data?.title || notif.type.replace(/_/g, " ");
              const message = notif.data?.message || "Environmental civic dossier status update received.";

              return (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!isRead) markAsRead(notif.id);
                  }}
                  className={cn(
                    "w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.99] space-y-2 cursor-pointer",
                    isRead
                      ? "bg-panel border-ink/[0.08] dark:border-white/10"
                      : "bg-panel border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm truncate", !isRead ? "font-black text-ink" : "font-semibold text-ink/80")}>
                          {title}
                        </p>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-200" />
                        )}
                      </div>
                      <p className="text-xs text-ink/60 line-clamp-2 mt-0.5 leading-relaxed">{message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-mono text-ink/40">{timeAgo(notif.created_at)}</span>
                        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 mt-3 rounded-2xl bg-panel border border-ink/10 hover:border-ink/20 text-xs font-bold text-ink/70 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
                <span>Load More Alerts</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
