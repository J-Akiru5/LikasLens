"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
  time: number;
}

export interface UseSSEOptions {
  /** SSE endpoint URL (default: /api/stream) */
  url?: string;
  /** Whether to auto-connect on mount (default: true) */
  enabled?: boolean;
  /** Max events to keep in buffer (default: 100) */
  maxEvents?: number;
}

export interface UseSSEReturn {
  events: SSEEvent[];
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    url = "/api/stream",
    enabled = true,
    maxEvents = 100,
  } = options;

  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("connected", (e) => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
        setEvents((prev) => [
          {
            type: "connected",
            data: JSON.parse(e.data),
            time: Date.now(),
          },
          ...prev.slice(0, maxEvents - 1),
        ]);
      });

      es.addEventListener("ticket", (e) => {
        if (!mountedRef.current) return;
        const data = JSON.parse(e.data);
        setEvents((prev) => [
          {
            type: "ticket",
            data,
            time: Date.now(),
          },
          ...prev.slice(0, maxEvents - 1),
        ]);
      });

      es.addEventListener("batch", (e) => {
        if (!mountedRef.current) return;
        const data = JSON.parse(e.data);
        setEvents((prev) => [
          {
            type: "batch",
            data,
            time: Date.now(),
          },
          ...prev.slice(0, maxEvents - 1),
        ]);
      });

      es.addEventListener("error", (e) => {
        if (!mountedRef.current) return;
        if (e instanceof MessageEvent) {
          const data = JSON.parse(e.data);
          setError(data.message ?? "Stream error");
        } else {
          // Native EventSource error (connection lost)
          setIsConnected(false);
          setError("Connection lost. Reconnecting...");
        }
      });

      es.onerror = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [url, maxEvents]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-connect
  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return { events, isConnected, error, connect, disconnect };
}
