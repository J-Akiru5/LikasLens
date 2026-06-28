/**
 * Offline queue — stores report payloads in IndexedDB with a localStorage
 * fallback.  Lives in `@likaslens/shared` so both the mobile PWA and the
 * frontend web app use the same queue.
 *
 * All functions are idempotent and safe to call from any page without
 * extra setup — the IndexedDB schema is created on first open.
 */

const DB_NAME = "likaslens-offline";
const STORE_NAME = "report-queue";
const LS_FALLBACK_KEY = "likaslens_offline_reports";

/* ──────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

export interface QueuedReport {
  id: string;
  payload: Record<string, unknown>;
  /** ISO-8601 string marking when the item was first queued. */
  queuedAt: string;
  /** Number of sync attempts already made (reset when page re-mounts). */
  syncAttempts?: number;
  /** Set after a failed sync attempt so the UI can show the error. */
  lastError?: string;
}

export interface SyncProgress {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

/* ──────────────────────────────────────────────────────────────
 * IndexedDB helpers
 * ──────────────────────────────────────────────────────────── */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* ──────────────────────────────────────────────────────────────
 * Public API
 * ──────────────────────────────────────────────────────────── */

/** Return every queued report from IndexedDB (fallback → localStorage). */
export async function getAllQueued(): Promise<QueuedReport[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    const items = await new Promise<QueuedReport[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as QueuedReport[]);
      req.onerror = () => reject(req.error);
    });
    return items;
  } catch {
    // localStorage fallback
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as Record<string, unknown>[];
      return arr.map((payload, idx) => ({
        id: String(idx),
        payload,
        queuedAt: (payload.queuedAt as string) ?? new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }
}

/** Return the number of queued reports. */
export async function getQueueCount(): Promise<number> {
  const queue = await getAllQueued();
  return queue.length;
}

/**
 * Persist a single report payload into the offline queue.
 * Falls back to localStorage when IndexedDB is unavailable.
 */
export async function queueReport(
  payload: Record<string, unknown>,
): Promise<void> {
  const entry: QueuedReport = {
    id: crypto.randomUUID(),
    payload: { ...payload, queuedAt: new Date().toISOString() },
    queuedAt: new Date().toISOString(),
  };

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // localStorage fallback
    const existing = localStorage.getItem(LS_FALLBACK_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(entry.payload);
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(queue));
  }
}

/**
 * Sync a *batch* of up to `batchSize` queued reports to the server.
 *
 * Reports that succeed are removed from the queue.  Reports that fail are kept
 * with their `lastError` updated.
 *
 * Returns a `SyncProgress` summary so the caller can render a toast / UI.
 */
export async function syncBatch(
  postFn: (payload: Record<string, unknown>) => Promise<unknown>,
  batchSize = 5,
): Promise<SyncProgress> {
  const progress: SyncProgress = { total: 0, succeeded: 0, failed: 0, skipped: 0 };

  // 1. Collect up to batchSize items
  const all = await getAllQueued();
  const batch = all.slice(0, batchSize);
  progress.total = batch.length;

  if (batch.length === 0) return progress;

  // 2. Try each one
  const successfulIds: string[] = [];
  const toUpdate: QueuedReport[] = [];

  for (const item of batch) {
    try {
      await postFn(item.payload);
      successfulIds.push(item.id);
      progress.succeeded++;
    } catch (err) {
      progress.failed++;
      const msg = err instanceof Error ? err.message : "Sync failed";
      toUpdate.push({ ...item, lastError: msg });
    }
  }

  // 3. Persist changes — delete successes, update failures with error
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const id of successfulIds) {
      store.delete(id);
    }
    for (const item of toUpdate) {
      store.put(item);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // localStorage fallback — rewrite the full queue
    const remaining = all.filter((item) => !successfulIds.includes(item.id));
    // Merge back failed items with updated errors
    const merged = remaining.map(
      (r) => toUpdate.find((u) => u.id === r.id) ?? r,
    );
    localStorage.setItem(
      LS_FALLBACK_KEY,
      JSON.stringify(merged.map((m) => m.payload)),
    );
  }

  return progress;
}

/**
 * Delete every item from the offline queue.
 */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.removeItem(LS_FALLBACK_KEY);
  }
}

/**
 * Delete a single queued report by id.
 */
export async function removeQueued(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // For localStorage fallback we'd need all items — simpler to just reload
    const all = await getAllQueued();
    const kept = all.filter((item) => item.id !== id);
    localStorage.setItem(
      LS_FALLBACK_KEY,
      JSON.stringify(kept.map((k) => k.payload)),
    );
  }
}
