"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/client";
import type { AppNotification, NotificationMeta, UnreadCountResponse } from "../types/notification";

interface UseNotificationsOptions {
  /** Polling interval in milliseconds. Default: 30000 (30s). Set to 0 to disable. */
  pollInterval?: number;
  /** Whether to fetch on mount. Default: true */
  autoFetch?: boolean;
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
      const res = await fetchUnreadCount<{ success: boolean; data: UnreadCountResponse }>();
      if (mountedRef.current && res?.data?.unread_count !== undefined) {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      // Silently fail — non-critical
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes] = await Promise.all([
        fetchNotifications<{ success: boolean; data: AppNotification[]; meta: NotificationMeta }>(1, 20),
        refreshUnreadCount(),
      ]);
      if (mountedRef.current) {
        setNotifications(notifRes?.data || []);
        setMeta(notifRes?.meta || null);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [refreshUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!meta || meta.current_page >= meta.last_page) return;
    setLoading(true);
    try {
      const res = await fetchNotifications<{ success: boolean; data: AppNotification[]; meta: NotificationMeta }>(
        meta.current_page + 1,
        meta.per_page
      );
      if (mountedRef.current) {
        setNotifications((prev) => [...prev, ...(res?.data || [])]);
        setMeta(res?.meta || null);
      }
    } catch {
      // Silently fail
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [meta]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markNotificationAsRead(id);
        if (mountedRef.current) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        // Silently fail
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch) {
      refresh();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [autoFetch, refresh]);

  // Polling
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
