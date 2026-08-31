"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "../supabase/client";
import type { AppNotification, NotificationMeta } from "../types/notification";

interface UseNotificationsOptions {
  pollInterval?: number;
  autoFetch?: boolean;
  token?: string;
}

interface UseNotificationsReturn {
  notifications: AppNotification[];
  meta: NotificationMeta | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function db() {
  return getSupabaseClient();
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { pollInterval = 30000, autoFetch = true } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState<NotificationMeta | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { count } = await db()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (mountedRef.current) {
        setUnreadCount(count || 0);
      }
    } catch {
      // Silently fail — non-critical
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = 1;
      const perPage = 20;
      const [notifRes, unreadRes] = await Promise.all([
        db()
          .from("notifications")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(0, perPage - 1),
        db()
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null),
      ]);

      if (mountedRef.current) {
        setNotifications((notifRes.data as unknown as AppNotification[]) || []);
        setMeta({
          current_page: page,
          last_page: Math.max(1, Math.ceil((notifRes.count || 0) / perPage)),
          per_page: perPage,
          total: notifRes.count || 0,
          unread_count: unreadRes.count || 0,
        });
        setUnreadCount(unreadRes.count || 0);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!meta || meta.current_page >= meta.last_page) return;
    setLoading(true);
    try {
      const nextPage = meta.current_page + 1;
      const perPage = meta.per_page;
      const from = (nextPage - 1) * perPage;
      const to = from + perPage - 1;

      const { data, count } = await db()
        .from("notifications")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (mountedRef.current) {
        setNotifications((prev) => [...prev, ...((data as unknown as AppNotification[]) || [])]);
        setMeta({
          current_page: nextPage,
          last_page: Math.max(1, Math.ceil((count || 0) / perPage)),
          per_page: perPage,
          total: count || 0,
          unread_count: 0,
        });
      }
    } catch {
      // Silently fail
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [meta]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await db()
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await db()
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch) {
      refresh();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [autoFetch, refresh]);

  useEffect(() => {
    if (pollInterval <= 0) return;
    pollRef.current = setInterval(() => {
      refreshUnreadCount();
    }, pollInterval);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollInterval, refreshUnreadCount]);

  return {
    notifications,
    meta,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
    loadMore,
  };
}
