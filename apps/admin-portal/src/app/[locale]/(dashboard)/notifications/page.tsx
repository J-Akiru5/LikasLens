"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@likaslens/shared";
import { createClient } from "@/lib/supabase";
import { cn } from "@likaslens/shared";
import { formatDate } from "@likaslens/shared";
import { Bell, AlertCircle, CheckCircle, Info, CheckCheck, Loader2, Send, X } from "lucide-react";

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
        System alerts and ticket updates will appear here.
      </p>
    </div>
  );
}

const AUDIENCES: { value: string; label: string }[] = [
  { value: "everyone", label: "All users" },
  { value: "super_admin", label: "Super Admins" },
  { value: "admin", label: "Admins" },
  { value: "analyst", label: "Analysts" },
  { value: "lgu_officer", label: "LGU staff & officers" },
  { value: "lgu", label: "LGU staff & officers (legacy)" },
  { value: "citizen", label: "Citizens" },
];

export default function AdminNotificationsPage() {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setAuthToken(data.session?.access_token));
  }, []);

  const {
    notifications,
    meta,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
  } = useNotifications({ pollInterval: 30000, token: authToken });

  const hasMore = meta && meta.current_page < meta.last_page;

  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("everyone");
  const [targetUser, setTargetUser] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setSendError("Title and message are required.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/v1/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          for_role: audience === "everyone" ? null : audience,
          user_id: targetUser.trim() ? targetUser.trim() : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSendError(body?.error || "Failed to send notification");
        return;
      }
      setComposerOpen(false);
      setTitle("");
      setMessage("");
      setAudience("everyone");
      setTargetUser("");
      await refresh();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold tracking-tight text-2xl text-ink">Notifications</h1>
          <p className="text-sm text-ink/50 font-mono mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setComposerOpen((v) => !v);
              setSendError(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-white bg-green hover:bg-green/90 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            Send notification
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-ink/60 hover:text-ink border border-ink/10 rounded-lg hover:bg-ink/[0.02] transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {composerOpen && (
        <div className="rounded-2xl border border-green/20 bg-green/[0.03] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-ink">Send a notification</h2>
            <button
              onClick={() => setComposerOpen(false)}
              aria-label="Close composer"
              className="p-1.5 rounded-lg text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-mono uppercase tracking-wider text-ink/50">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Scheduled maintenance tonight"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-ink/10 bg-page focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono uppercase tracking-wider text-ink/50">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-ink/10 bg-page focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-ink/50">
              Message
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What do users need to know?"
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-ink/10 bg-page focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-ink/50">
              Specific user (optional, overrides audience)
            </span>
            <input
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="user id from the Users page"
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-ink/10 bg-page focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          {sendError && <p className="text-sm text-red">{sendError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setComposerOpen(false)}
              className="px-4 py-2 text-sm font-mono text-ink/60 hover:text-ink border border-ink/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-white bg-green hover:bg-green/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
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
  );
}
