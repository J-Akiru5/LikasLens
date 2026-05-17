"use client";

import { useEffect, useState } from "react";
import { laravelGet, laravelPatch } from "@likaslens/shared";
import type { PaginatedResponse, ApiResponse } from "@likaslens/shared";
import { Spinner } from "@likaslens/shared";
import { MessageSquare, Mail, User, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = () => {
    laravelGet<PaginatedResponse<ContactMessage>>(`/admin/contact-messages`)
      .then((res) => {
        if (res.success) setMessages(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await laravelPatch<ApiResponse<ContactMessage>>(`/admin/contact-messages/${id}/read`, {});
      if (res.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? res.data : msg))
        );
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Inquiries</h1>
        <p className="font-mono text-sm surface-muted mt-1">Manage contact messages from the public portal</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`brutal-panel panel-surface p-6 border-2 transition-all ${
                  msg.status === "unread"
                    ? "border-emerald-400 shadow-[4px_4px_0px_#047857] bg-emerald-50"
                    : "border-primary/20 shadow-[2px_2px_0px_rgba(27,67,50,0.2)] opacity-70"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-heading font-black uppercase text-lg">{msg.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <a href={`mailto:${msg.email}`} className="font-mono text-sm hover:underline hover:text-emerald-700">{msg.email}</a>
                      </div>
                      <div className="flex items-center gap-2 surface-muted">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-sm">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>

                      {msg.status === "unread" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-400 bg-emerald-100 text-emerald-700 rounded font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
                          New
                        </span>
                      )}
                    </div>

                    <div className="font-body text-base bg-background/50 p-4 rounded border-l-4 border-primary/30 whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    {msg.status === "unread" ? (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="brutal-button px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Read
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest surface-muted">
                        <CheckCircle2 className="w-4 h-4" />
                        Read {msg.read_at && new Date(msg.read_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {messages.length === 0 && (
            <p className="text-center font-mono text-sm surface-muted py-12">No inquiries found</p>
          )}
        </div>
      )}
    </div>
  );
}
