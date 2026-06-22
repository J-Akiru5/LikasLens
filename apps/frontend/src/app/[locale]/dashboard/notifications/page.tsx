"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@likaslens/shared";
import { cn } from "@likaslens/shared";
import { formatDate } from "@likaslens/shared";
import { Bell, AlertCircle, CheckCircle, Info, CheckCheck, Loader2 } from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { createClient } from "@/utils/supabase/client";

function getNotifIcon(type: string) {
  if (type.includes("Escalation") || type.includes("breach"))
    return <AlertCircle className="w-5 h-5 text-red" />;
  if (type.includes("StatusUpdated"))
    return <CheckCircle className="w-5 h-5 text-green" />;
  return <Info className="w-5 h-5 text-green" />;
}

function getNotifTitle(type: string): string {
  if (type.includes("SlaEscalation")) return "SLA Escalation";
  if (type.includes("TicketStatus")) return "Ticket Update";
  return "Notification";
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 rounded-xl border border-ink/10 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-ink/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-ink/10 rounded" />
            <div className="h-3 w-64 bg-ink/10 rounded" />
            <div className="h-3 w-20 bg-ink/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-4">
        <Bell className="w-7 h-7 text-ink/30" />
      </div>
      <h3 className="font-semibold text-lg text-ink mb-1">No notifications yet</h3>
      <p className="text-sm text-ink/50 max-w-xs">
        When there&apos;s activity on your reports or incidents, you&apos;ll see it here.
      </p>
    </div>
  );
}

export default function NotificationsPage() {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }: { data: { session: { access_token?: string } | null } }) => {
      setAuthToken(data.session?.access_token);
    });
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

  const hasMore = meta && meta.current_page < meta.last_page;

  return (
    <DashboardLayoutWrapper
      pageTitle="Notifications"
      pageSubtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-ink/60 hover:text-ink border border-ink/10 rounded-lg hover:bg-ink/[0.02] transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        {loading && notifications.length === 0 ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read_at && markAsRead(n.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                  !n.read_at
                    ? "border-accent/20 bg-accent/[0.03] hover:bg-accent/[0.06]"
                    : "border-ink/10 hover:bg-ink/[0.02]"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    !n.read_at ? "bg-accent/10" : "bg-ink/5"
                  )}
                >
                  {getNotifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm",
                        !n.read_at ? "font-semibold text-ink" : "text-ink/70"
                      )}
                    >
                      {getNotifTitle(n.type)}
                    </span>
                    {!n.read_at && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-ink/50 mt-0.5 line-clamp-2">
                    {n.data.message || "You have a new notification"}
                  </p>
                  <span className="text-xs text-ink/30 font-mono mt-1 block">
                    {formatDate(n.created_at, "relative")}
                  </span>
                </div>
              </button>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-mono text-ink/60 hover:text-ink border border-ink/10 rounded-lg hover:bg-ink/[0.02] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
