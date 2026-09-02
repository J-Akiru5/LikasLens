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

// RPC-based inbox (per-user read receipts + role targeting). Only used when a
// real session token is available; the legacy public-read path stays as the
// unauthenticated fallback.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

interface RpcInboxResult {
  notifications: Array<
    AppNotification & { user_id?: string | null; for_role?: string | null }
  >;
  unread_count: number;
  total: number;
  page: number;
  per_page: number;
}

async function rpcFetch<T>(
  name: string,
  args: Record<string, unknown>,
  token?: string
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`notifications rpc ${name} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

// Cookie-session fallback: same inbox via each app's own route (session lives
// in the auth cookie, not in the browser's reachable storage).
async function apiRouteFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`notifications api route ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

// PostgREST returns jsonb columns as JSON *strings*; normalize to objects and
// ensure created_at carries a timezone so relative times render correctly.
function normalizeNotification(n: object): AppNotification {
  const raw: Record<string, unknown> = { ...n };
  if (typeof raw.data === "string") {
    try {
      raw.data = JSON.parse(raw.data);
    } catch {
      raw.data = {};
    }
  }
  raw.data = raw.data && typeof raw.data === "object" ? raw.data : {};
  if (typeof raw.created_at === "string") {
    const c = raw.created_at as string;
    if (!/Z$|[+-]\d{2}:\d{2}$/.test(c)) {
      raw.created_at = `${c}Z`;
    }
  }
  return raw as unknown as AppNotification;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { pollInterval = 30000, autoFetch = true, token } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState<NotificationMeta | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const getEffectiveToken = async (): Promise<string | undefined> => {
    if (tokenRef.current) return tokenRef.current;
    try {
      const { data } = await db().auth.getSession();
      return data.session?.access_token;
    } catch {
      return undefined;
    }
  };

  const refreshUnreadCount = useCallback(async () => {
    try {
      const tok = await getEffectiveToken();
      if (tok) {
        try {
          const result = await rpcFetch<RpcInboxResult>("get_my_notifications", { p_page: 1 }, tok);
          if (mountedRef.current && result && typeof result.unread_count === "number") {
            setUnreadCount(result.unread_count);
            return;
          }
        } catch {
          // Fall through to cookie api route
        }
      }

      // Try cookie-session route
      try {
        const result = await apiRouteFetch<RpcInboxResult>("/api/v1/notifications?page=1");
        if (mountedRef.current && result && typeof result.unread_count === "number") {
          setUnreadCount(result.unread_count);
          return;
        }
      } catch {
        // Fall through to authenticated citizen check
      }

      // Supabase direct check: ONLY for the authenticated citizen
      const { data: { user } } = await db().auth.getUser();
      if (!user) {
        if (mountedRef.current) setUnreadCount(0);
        return;
      }

      const { count } = await db()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .or(`user_id.eq.${user.id},and(for_role.eq.citizen,user_id.is.null)`)
        .is("read_at", null);

      if (mountedRef.current) {
        setUnreadCount(count || 0);
      }
    } catch {
      if (mountedRef.current) setUnreadCount(0);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const tok = await getEffectiveToken();

    // Authenticated path: role-aware inbox with per-user read receipts.
    // 1) direct RPC with a session token, or 2) cookie-session API route,
    // or 3) citizen-scoped direct query.
    let result: RpcInboxResult | null = null;
    let routeError: string | null = null;
    if (tok) {
      try {
        result = await rpcFetch<RpcInboxResult>("get_my_notifications", { p_page: 1 }, tok);
      } catch (err: unknown) {
        routeError = err instanceof Error ? err.message : "Failed to load notifications";
      }
    }
    if (!result) {
      try {
        result = await apiRouteFetch<RpcInboxResult>("/api/v1/notifications?page=1");
      } catch (err: unknown) {
        routeError = err instanceof Error ? err.message : "Failed to load notifications";
      }
    }

    if (result) {
      if (mountedRef.current) {
        setNotifications((result.notifications || []).map(normalizeNotification));
        setMeta({
          current_page: result.page || 1,
          last_page: Math.max(1, Math.ceil((result.total || 0) / (result.per_page || 20))),
          per_page: result.per_page || 20,
          total: result.total || 0,
          unread_count: result.unread_count || 0,
        });
        setUnreadCount(result.unread_count || 0);
      }
      if (mountedRef.current) setLoading(false);
      return;
    }
    if (routeError && mountedRef.current) {
      setError(routeError);
    }

    // Direct Supabase check: strictly scoped to the logged-in citizen
    try {
      const { data: { user } } = await db().auth.getUser();
      if (!user) {
        if (mountedRef.current) {
          setNotifications([]);
          setUnreadCount(0);
          setMeta(null);
        }
        return;
      }

      const page = 1;
      const perPage = 20;
      const [notifRes, unreadRes] = await Promise.all([
        db()
          .from("notifications")
          .select("*", { count: "exact" })
          .or(`user_id.eq.${user.id},and(for_role.eq.citizen,user_id.is.null)`)
          .order("created_at", { ascending: false })
          .range(0, perPage - 1),
        db()
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .or(`user_id.eq.${user.id},and(for_role.eq.citizen,user_id.is.null)`)
          .is("read_at", null),
      ]);

      if (mountedRef.current) {
        setNotifications(((notifRes.data as unknown as AppNotification[]) || []).map(normalizeNotification));
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
    const tok = await getEffectiveToken();

    let result: RpcInboxResult | null = null;
    if (tok) {
      try {
        result = await rpcFetch<RpcInboxResult>(
          "get_my_notifications",
          { p_page: meta.current_page + 1 },
          tok
        );
      } catch {
        // try the cookie route
      }
    }
    if (!result) {
      try {
        result = await apiRouteFetch<RpcInboxResult>(
          `/api/v1/notifications?page=${meta.current_page + 1}`
        );
      } catch {
        // fall through to citizen-scoped pagination
      }
    }

    if (result) {
      if (mountedRef.current) {
        setNotifications((prev) => [
          ...prev,
          ...(result.notifications || []).map(normalizeNotification),
        ]);
        setMeta({
          current_page: result.page || meta.current_page + 1,
          last_page: Math.max(1, Math.ceil((result.total || 0) / (result.per_page || 20))),
          per_page: result.per_page || 20,
          total: result.total || 0,
          unread_count: result.unread_count || 0,
        });
      }
      if (mountedRef.current) setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await db().auth.getUser();
      if (!user) {
        if (mountedRef.current) setLoading(false);
        return;
      }

      const nextPage = meta.current_page + 1;
      const perPage = meta.per_page;
      const from = (nextPage - 1) * perPage;
      const to = from + perPage - 1;

      const { data, count } = await db()
        .from("notifications")
        .select("*", { count: "exact" })
        .or(`user_id.eq.${user.id},and(for_role.eq.citizen,user_id.is.null)`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (mountedRef.current) {
        setNotifications((prev) => [
          ...prev,
          ...((data as unknown as AppNotification[]) || []).map(normalizeNotification),
        ]);
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

  const markAsRead = useCallback(
    async (id: string) => {
      const tok = await getEffectiveToken();
      try {
        if (tok) {
          await rpcFetch("mark_notification_read", { p_id: id }, tok);
        } else {
          try {
            await apiRouteFetch("/api/v1/notifications/read", {
              method: "POST",
              body: JSON.stringify({ id }),
            });
          } catch {
            await db().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
          }
        }
      } catch {
        // Optimistic UI below keeps the bell usable even if the write fails
      }
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    const tok = await getEffectiveToken();
    try {
      if (tok) {
        await rpcFetch("mark_all_notifications_read", {}, tok);
      } else {
        try {
          await apiRouteFetch("/api/v1/notifications/read", {
            method: "POST",
            body: JSON.stringify({ all: true }),
          });
        } catch {
          await db().from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
        }
      }
    } catch {
      // Optimistic UI below keeps the bell usable even if the write fails
    }
    if (mountedRef.current) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
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
  }, [autoFetch, refresh, token]);

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