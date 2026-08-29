/**
 * Integration tests for the offline queue utility.
 *
 * These tests use `fake-indexeddb/auto` to provide a REAL in-memory IndexedDB
 * implementation (not mocks).  This validates that the actual IndexedDB API
 * interactions — schema creation, transaction lifecycle, object store CRUD,
 * database versioning — all work correctly end-to-end.
 *
 * The unit tests in `offline-queue.test.ts` cover edge cases with mocked
 * IndexedDB (failure paths, localStorage fallback, etc.).  This file covers
 * the happy path through real IndexedDB.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import {
  queueReport,
  getAllQueued,
  clearQueue,
  getQueueCount,
  removeQueued,
  syncBatch,
  type QueuedReport,
} from "../offline-queue";

/* ──────────────────────────────────────────────────────────────
 * Setup / teardown
 * ──────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.spyOn(crypto, "randomUUID").mockImplementation(
    (() => {
      let n = 0;
      return () => `int-${String(++n).padStart(6, "0")}` as ReturnType<typeof crypto.randomUUID>;
    })(),
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
  localStorage.clear();
  // Clear the object store between tests rather than deleting the whole
  // database — deleteDatabase can hang when fake-indexeddb has pending tx.
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("likaslens-offline", 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains("report-queue")) {
          d.createObjectStore("report-queue", { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction("report-queue", "readwrite");
    tx.objectStore("report-queue").clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // DB may not exist yet — fine
  }
});

/* ──────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────── */

function makePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    base64Image: "data:image/jpeg;base64,/9j/test",
    latitude: 14.5833,
    longitude: 120.9833,
    report_type: "waste_dumping",
    description: "Test report",
    ...overrides,
  };
}

/* ──────────────────────────────────────────────────────────────
 * Integration tests
 * ──────────────────────────────────────────────────────────── */

describe("offline queue — IndexedDB integration", () => {
  it("creates the object store schema on first open", async () => {
    // Before any operation the DB doesn't exist.
    // `queueReport` will trigger `indexedDB.open(…, 1)` which fires
    // `onupgradeneeded` and creates the store.  The test passes if no
    // error is thrown.
    await queueReport(makePayload({ description: "Schema creation" }));
    const all = await getAllQueued();
    expect(all).toHaveLength(1);
  });

  /* ── CRUD lifecycle ───────────────────────────────────────── */

  it("queues a report and retrieves it with a UUID and queuedAt", async () => {
    await queueReport(makePayload({ report_type: "water_pollution" }));

    const all = await getAllQueued();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("int-000001");
    expect(all[0].payload.report_type).toBe("water_pollution");
    expect(all[0].queuedAt).toBeDefined();
    expect(() => new Date(all[0].queuedAt)).not.toThrow();
  });

  it("persists multiple reports and returns them all", async () => {
    await queueReport(makePayload({ description: "A" }));
    await queueReport(makePayload({ description: "B" }));
    await queueReport(makePayload({ description: "C" }));

    const all = await getAllQueued();
    expect(all).toHaveLength(3);
    // IndexedDB returns items in insertion order
    expect(all.map((r) => r.payload.description)).toEqual(["A", "B", "C"]);
  });

  it("persists data across separate getAllQueued calls", async () => {
    await queueReport(makePayload({ report_type: "illegal_logging" }));
    expect(await getQueueCount()).toBe(1);

    // Read again — should still be there
    const first = await getAllQueued();
    expect(first).toHaveLength(1);

    // Add another and verify both persist
    await queueReport(makePayload({ report_type: "air_pollution" }));
    const second = await getAllQueued();
    expect(second).toHaveLength(2);
  });

  /* ── getQueueCount ────────────────────────────────────────── */

  it("getQueueCount returns 0 on an empty database", async () => {
    expect(await getQueueCount()).toBe(0);
  });

  it("getQueueCount returns correct count after queue and clear", async () => {
    expect(await getQueueCount()).toBe(0);
    await queueReport(makePayload());
    expect(await getQueueCount()).toBe(1);
    await queueReport(makePayload());
    expect(await getQueueCount()).toBe(2);
    await clearQueue();
    expect(await getQueueCount()).toBe(0);
  });

  /* ── clearQueue ───────────────────────────────────────────── */

  it("clearQueue empties the store but does not delete the database", async () => {
    await queueReport(makePayload());
    await queueReport(makePayload());
    await queueReport(makePayload());
    expect(await getQueueCount()).toBe(3);

    await clearQueue();
    expect(await getQueueCount()).toBe(0);

    // The database and object store should still exist (clear, not delete)
    // Adding a new report should work without schema re-creation
    await queueReport(makePayload({ description: "After clear" }));
    expect(await getQueueCount()).toBe(1);
    const items = await getAllQueued();
    expect(items[0].payload.description).toBe("After clear");
  });

  /* ── removeQueued ─────────────────────────────────────────── */

  it("removeQueued deletes a single item by id", async () => {
    await queueReport(makePayload({ description: "Keep" }));
    await queueReport(makePayload({ description: "Delete me" }));
    await queueReport(makePayload({ description: "Also keep" }));

    const all = await getAllQueued();
    const target = all.find((r) => r.payload.description === "Delete me")!;
    await removeQueued(target.id);

    const remaining = await getAllQueued();
    expect(remaining).toHaveLength(2);
    expect(remaining.map((r) => r.payload.description)).toEqual([
      "Keep",
      "Also keep",
    ]);
  });

  it("removeQueued is a no-op when the id does not exist", async () => {
    await queueReport(makePayload());
    await removeQueued("non-existent-in-real-db");
    expect(await getQueueCount()).toBe(1);
  });

  /* ── syncBatch ────────────────────────────────────────────── */

  it("syncBatch returns zero progress when queue is empty", async () => {
    const postFn = vi.fn();
    const progress = await syncBatch(postFn, 5);
    expect(progress).toEqual({ total: 0, succeeded: 0, failed: 0, skipped: 0 });
    expect(postFn).not.toHaveBeenCalled();
  });

  it("syncBatch processes all items and removes them on success", async () => {
    await queueReport(makePayload({ description: "A" }));
    await queueReport(makePayload({ description: "B" }));

    const postFn = vi.fn().mockResolvedValue({ ok: true });
    const progress = await syncBatch(postFn, 5);

    expect(progress).toEqual({ total: 2, succeeded: 2, failed: 0, skipped: 0 });
    expect(postFn).toHaveBeenCalledTimes(2);
    expect(await getQueueCount()).toBe(0);
  });

  it("syncBatch honours batchSize with real IndexedDB", async () => {
    for (let i = 0; i < 10; i++) {
      await queueReport(makePayload({ description: `Item ${i}` }));
    }

    const postFn = vi.fn().mockResolvedValue({ ok: true });
    const progress = await syncBatch(postFn, 3);

    // Only 3 items should be processed
    expect(progress).toEqual({ total: 3, succeeded: 3, failed: 0, skipped: 0 });
    expect(postFn).toHaveBeenCalledTimes(3);
    // 7 items should remain in IndexedDB
    expect(await getQueueCount()).toBe(7);

    // Remaining items should still be intact
    const remaining = await getAllQueued();
    expect(remaining[0].payload.description).toBe("Item 3");
  });

  it("syncBatch keeps failed items with lastError in real IndexedDB", async () => {
    await queueReport(makePayload({ description: "OK" }));
    await queueReport(makePayload({ description: "Fail" }));
    await queueReport(makePayload({ description: "Also OK" }));

    const postFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("Connection lost"))
      .mockResolvedValueOnce({ ok: true });

    const progress = await syncBatch(postFn, 5);

    expect(progress).toEqual({ total: 3, succeeded: 2, failed: 1, skipped: 0 });
    expect(await getQueueCount()).toBe(1);

    const failed = await getAllQueued();
    expect(failed[0].payload.description).toBe("Fail");
    expect(failed[0].lastError).toBe("Connection lost");
  });

  it("syncBatch defaults to batchSize of 5", async () => {
    for (let i = 0; i < 12; i++) {
      await queueReport(makePayload({ description: `N${i}` }));
    }

    const postFn = vi.fn().mockResolvedValue({ ok: true });
    const progress = await syncBatch(postFn);

    expect(progress.total).toBe(5);
    expect(postFn).toHaveBeenCalledTimes(5);
    expect(await getQueueCount()).toBe(7);
  });

});
