"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Payload item stored in the offline queue.
 * Includes the report body plus a timestamp for sync ordering.
 */
interface QueuedItem {
  id: string;
  payload: Record<string, unknown>;
  queuedAt: string;
}

interface UseOfflineQueueOptions {
  /** Laravel API base URL (defaults to NEXT_PUBLIC_API_URL or empty). */
  endpoint?: string;
  /** IndexedDB database name. */
  dbName?: string;
  /** IndexedDB object store name. */
  storeName?: string;
}

interface UseOfflineQueueReturn {
  /** Whether the browser currently has a network connection. */
  isOnline: boolean;
  /** Number of reports waiting to be synced. */
  queueSize: number;
  /** Whether a flush / sync operation is currently in progress. */
  isFlushing: boolean;
  /** When the last successful flush completed, or null. */
  lastFlushAt: Date | null;
  /**
   * Queue a report payload for later submission.
   * Automatically converts any Blob / File values to base64-safe strings
   * so they survive IndexedDB serialisation.
   */
  enqueue: (payload: Record<string, unknown>) => Promise<void>;
  /** Manually trigger a sync attempt (e.g. when user taps "sync now"). */
  flush: () => Promise<{ synced: number; failed: number }>;
  /** Remove all queued items without uploading. */
  clearQueue: () => Promise<void>;
}

// ── helpers ──────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function normalisePayload(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value instanceof Blob) {
      out[key] = await blobToBase64(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

// ── hook ─────────────────────────────────────────────────────────────────

export function useOfflineQueue(opts: UseOfflineQueueOptions = {}): UseOfflineQueueReturn {
  const {
    endpoint = process.env.NEXT_PUBLIC_API_URL || "",
    dbName = "likaslens-offline",
    storeName = "report-queue",
  } = opts;

  // We keep stable references to avoid stale closures in event listeners.
  const optsRef = useRef({ endpoint: endpoint + "/reports", dbName, storeName });
  optsRef.current = { endpoint: endpoint + "/reports", dbName, storeName };

  // ── state ──
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queueSize, setQueueSize] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);
  const [lastFlushAt, setLastFlushAt] = useState<Date | null>(null);
  const flushingRef = useRef(false);

  // ── IndexedDB helpers ────────────────────────────────────────────────

  const openDb = useCallback(() => {
    const { dbName, storeName } = optsRef.current;
    return new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }, []);

  const readAll = useCallback(async (): Promise<QueuedItem[]> => {
    const { storeName } = optsRef.current;
    try {
      const db = await openDb();
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      const items = await new Promise<QueuedItem[]>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return items;
    } catch {
      // IndexedDB unavailable — fall back to localStorage
      try {
        const raw = localStorage.getItem("likaslens_offline_reports");
        if (!raw) return [];
        const arr = JSON.parse(raw) as Record<string, unknown>[];
        return arr.map((p, i) => ({ id: String(i), payload: p, queuedAt: "" }));
      } catch {
        return [];
      }
    }
  }, [openDb]);

  const writeOne = useCallback(
    async (item: QueuedItem): Promise<void> => {
      const { storeName } = optsRef.current;
      try {
        const db = await openDb();
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(item);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // fallback
        try {
          const raw = localStorage.getItem("likaslens_offline_reports");
          const arr: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
          arr.push(item.payload);
          localStorage.setItem("likaslens_offline_reports", JSON.stringify(arr));
        } catch { /* storage full */ }
      }
    },
    [openDb],
  );

  const deleteMany = useCallback(
    async (ids: Set<string>): Promise<void> => {
      const { storeName } = optsRef.current;
      try {
        const db = await openDb();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        ids.forEach((id) => store.delete(id));
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        try {
          const raw = localStorage.getItem("likaslens_offline_reports");
          if (!raw) return;
          const arr: Record<string, unknown>[] = JSON.parse(raw);
          // localStorage items are keyed by index, not uuid
          // we keep items whose index wasn't in successfulIds (encoded as "0","1",...)
          const remaining = arr.filter(
            (_, i) => !ids.has(String(i)),
          );
          if (remaining.length) {
            localStorage.setItem(
              "likaslens_offline_reports",
              JSON.stringify(remaining),
            );
          } else {
            localStorage.removeItem("likaslens_offline_reports");
          }
        } catch { /* storage error */ }
      }
    },
    [openDb],
  );

  const clearAll = useCallback(async (): Promise<void> => {
    const { storeName } = optsRef.current;
    try {
      const db = await openDb();
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      try {
        localStorage.removeItem("likaslens_offline_reports");
      } catch { /* */ }
    }
  }, [openDb]);

  // ── refresh queue size ──
  const refreshSize = useCallback(async () => {
    const items = await readAll();
    setQueueSize(items.length);
  }, [readAll]);

  // Initial size check
  useEffect(() => {
    void refreshSize();
  }, [refreshSize]);

  // ── enqueue ───────────────────────────────────────────────────────────

  const enqueue = useCallback(
    async (payload: Record<string, unknown>) => {
      const normalised = await normalisePayload(payload);
      const item: QueuedItem = {
        id: crypto.randomUUID(),
        payload: normalised,
        queuedAt: new Date().toISOString(),
      };
      await writeOne(item);
      await refreshSize();
    },
    [writeOne, refreshSize],
  );

  // ── flush ─────────────────────────────────────────────────────────────

  const flush = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (flushingRef.current) return { synced: 0, failed: 0 };
    flushingRef.current = true;
    setIsFlushing(true);

    const { endpoint: url } = optsRef.current;
    const items = await readAll();
    if (!items.length) {
      flushingRef.current = false;
      setIsFlushing(false);
      return { synced: 0, failed: 0 };
    }

    const successful = new Set<string>();
    let failed = 0;

    for (const item of items) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) {
          successful.add(item.id);
        } else {
          // Don't remove items that got a server error — they may succeed later
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (successful.size > 0) {
      await deleteMany(successful);
      setLastFlushAt(new Date());
    }

    // Import showToast lazily to avoid SSR issues
    try {
      const { showToast } = await import("@likaslens/shared");
      if (successful.size > 0) {
        showToast(
          `${successful.size} queued report${successful.size > 1 ? "s" : ""} synced successfully.`,
          "success",
        );
      }
      if (failed > 0) {
        showToast(
          `${failed} report${failed > 1 ? "s" : ""} could not be synced — will retry.`,
          "error",
        );
      }
    } catch { /* toast not available */ }

    await refreshSize();
    flushingRef.current = false;
    setIsFlushing(false);
    return { synced: successful.size, failed };
  }, [readAll, deleteMany, refreshSize]);

  // ── clear ─────────────────────────────────────────────────────────────

  const clearQueue = useCallback(async () => {
    await clearAll();
    await refreshSize();
  }, [clearAll, refreshSize]);

  // ── online / offline listeners ────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void flush();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void flush();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [flush]);

  return {
    isOnline,
    queueSize,
    isFlushing,
    lastFlushAt,
    enqueue,
    flush,
    clearQueue,
  };
}
