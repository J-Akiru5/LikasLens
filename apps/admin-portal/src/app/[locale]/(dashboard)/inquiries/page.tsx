// apps/admin-portal/src/app/[locale]/(dashboard)/inquiries/page.tsx
// Phase 6 sub-page sweep: Mark Read button -> Button
"use client";

import { useEffect, useState } from "react";
import { getAdminContactMessages, markContactMessageRead } from "@likaslens/shared";
import type { PaginatedResponse, ApiResponse } from "@likaslens/shared";
import { showToast, AdminTableSkeleton, EmptyState, Button } from "@likaslens/shared";
import { ChevronLeft, ChevronRight, Mail, User, Clock, CheckCircle2 } from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read";
  read_at: string | null;
  created_at: string;
}

export default function InquiriesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [markingReadId, setMarkingReadId] = useState<number | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [page]);

  const fetchMessages = () => {
    getAdminContactMessages({ per_page: "50", page: page.toString() })
      .then((res) => {
        if (res.success) {
          setMessages(res.data.map((m) => ({ ...m, status: m.status as "unread" | "read" })));
          setLastPage(res.meta?.last_page ?? 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const markAsRead = async (id: number) => {
    setMarkingReadId(id);
    try {
      const res = await markContactMessageRead(id);
      if (res.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, status: "read" as const, read_at: new Date().toISOString() } : msg)),
        );
        showToast("Message marked as read", "success");
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
      showToast("Failed to mark message as read", "error");
    } finally {
      setMarkingReadId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
          Inquiries
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Manage contact messages from the public portal
        </p>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={4} showSearch={false} />
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border transition-all ${
                msg.status === "unread"
                  ? "border-green/20 bg-green/[0.02]"
                  : "border-ink/5 opacity-70"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-ink/70" />
                      <span className="font-medium text-lg text-ink">
                        {msg.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-ink/70" />
                      <a
                        href={`mailto:${msg.email}`}
                        className="font-mono text-sm text-ink/60 hover:text-green transition-colors"
                      >
                        {msg.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-ink/70">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-sm">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>

                    {msg.status === "unread" && (
                      <span className="label-pill label-pill-light inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green/10 text-green font-mono text-[10px] font-bold uppercase tracking-widest">
                        New
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-ink/70 bg-page/50 p-4 rounded-xl border-l-2 border-ink/10 whitespace-pre-wrap">
                    {msg.message}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {msg.status === "unread" ? (
                    <Button
                      variant="secondary"
                      onClick={() => markAsRead(msg.id)}
                      disabled={markingReadId === msg.id}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {markingReadId === msg.id ? "Marking..." : "Mark Read"}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-2 font-mono text-xs text-ink/70">
                      <CheckCircle2 className="w-4 h-4" />
                      Read{" "}
                      {msg.read_at &&
                        new Date(msg.read_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <EmptyState
              icon={Mail}
              title="No inquiries found"
              description="Contact messages submitted through the public portal will appear here."
            />
          )}
        </div>
      )}

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
    </div>
  );
}
