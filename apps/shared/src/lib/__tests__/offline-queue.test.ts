import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  queueReport,
  getAllQueued,
  clearQueue,
  getQueueCount,
  removeQueued,
  syncBatch,
} from "../offline-queue";

/* ──────────────────────────────────────────────────────────────
 * In-memory store that simulates IndexedDB behaviour
 * ──────────────────────────────────────────────────────────── */

let memoryStore: Map<string, unknown> = new Map();
let idCounter = 0;
let dbFail = false;

function setupMockIndexedDB() {
  /* ── Transaction-level oncomplete trigger ───────────────────── */
  let triggerComplete: (() => void) | null = null;
  let triggerError: (() => void) | null = null;

  /* ── Object store — each mutating op schedules tx.oncomplete ── */
  const store = {
    put: vi.fn((item: unknown) => {
      const entry = item as { id: string };
      memoryStore.set(entry.id, item);
      queueMicrotask(() => triggerComplete?.());
    }),
    getAll: vi.fn(() => {
      const items = Array.from(memoryStore.values());
      const req = {
        result: items,
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
      };
      // Fire onsuccess in a microtask so the source-code promise's
      // assignment of req.onsuccess = … runs BEFORE we invoke it.
      queueMicrotask(() => req.onsuccess?.(new Event("success")));
      return req;
    }),
    delete: vi.fn((id: string) => {
      memoryStore.delete(id);
      queueMicrotask(() => triggerComplete?.());
    }),
    clear: vi.fn(() => {
      memoryStore.clear();
      queueMicrotask(() => triggerComplete?.());
    }),
  };

  /* ── Transaction — exposes oncomplete/onerror triggers ──────── */
  const tx = {
    objectStore: vi.fn(() => store),
    get oncomplete() { return triggerComplete; },
    set oncomplete(fn: (() => void) | null) { triggerComplete = fn; },
    get onerror() { return triggerError; },
    set onerror(fn: (() => void) | null) { triggerError = fn; },
  };

  /* ── Database ────────────────────────────────────────────────── */
  const mockDb = {
    transaction: vi.fn(() => tx),
    objectStoreNames: { contains: vi.fn(() => true) },
    close: vi.fn(),
    createObjectStore: vi.fn(() => store),
  } as unknown as IDBDatabase;

  /* ── open request ────────────────────────────────────────────── */
  const request = {
    result: mockDb,
    onupgradeneeded: null as ((ev: Event) => void) | null,
    onsuccess: null as ((ev: Event) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
  };

  const openMock = vi.fn((_dbName: string, _version: number) => {
    if (dbFail) {
      queueMicrotask(() => request.onerror?.(new Event("error")));
    } else {
      queueMicrotask(() => {
        request.onupgradeneeded?.(new Event("upgradeneeded"));
        request.onsuccess?.(new Event("success"));
      });
    }
    return request;
  });

  vi.stubGlobal("indexedDB", { open: openMock });
}

/* ──────────────────────────────────────────────────────────────
 * Setup / teardown
 * ──────────────────────────────────────────────────────────── */

beforeEach(() => {
  idCounter = 0;
  memoryStore.clear();
  dbFail = false;
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => `mock-uuid-${++idCounter}` as ReturnType<typeof crypto.randomUUID>);
  setupMockIndexedDB();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  memoryStore.clear();
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
 * Tests
 * ──────────────────────────────────────────────────────────── */

describe("offline queue", () => {
  describe("queueReport", () => {
    it("stores a payload in IndexedDB and adds a queuedAt timestamp", async () => {
      await queueReport(makePayload());

      const all = await getAllQueued();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe("mock-uuid-1");
      expect(all[0].payload.base64Image).toBe(makePayload().base64Image);
      expect(all[0].payload.queuedAt).toBeDefined();
      expect(typeof all[0].queuedAt).toBe("string");
    });

    it("preserves multiple queued reports", async () => {
      await queueReport(makePayload({ report_type: "water_pollution" }));
      await queueReport(makePayload({ report_type: "air_pollution" }));
      await queueReport(makePayload({ report_type: "illegal_logging" }));

      const all = await getAllQueued();
      expect(all).toHaveLength(3);
      expect(all.map((r) => r.payload.report_type)).toEqual([
        "water_pollution",
        "air_pollution",
        "illegal_logging",
      ]);
    });

    it("auto-generates a random UUID for each queued item", async () => {
      await queueReport(makePayload());
      await queueReport(makePayload());

      const all = await getAllQueued();
      expect(all[0].id).toBe("mock-uuid-1");
      expect(all[1].id).toBe("mock-uuid-2");
      expect(all[0].id).not.toBe(all[1].id);
    });

    it("stores payload with queuedAt timestamp", async () => {
      await queueReport(makePayload());

      const all = await getAllQueued();
      expect(all[0].payload.queuedAt).toBeDefined();
      expect(() => new Date(all[0].payload.queuedAt as string)).not.toThrow();
    });

    it("falls back to localStorage when IndexedDB fails", async () => {
      dbFail = true;
      await queueReport(makePayload({ description: "Fallback test" }));

      // getAllQueued should still return from localStorage
      const all = await getAllQueued();
      expect(all).toHaveLength(1);
      expect(all[0].payload.description).toBe("Fallback test");
    });
  });

  describe("getAllQueued", () => {
    it("returns an empty array when nothing has been queued", async () => {
      const all = await getAllQueued();
      expect(all).toEqual([]);
    });

    it("returns all queued reports", async () => {
      await queueReport(makePayload({ description: "Report A" }));
      await queueReport(makePayload({ description: "Report B" }));

      const all = await getAllQueued();
      expect(all).toHaveLength(2);
      expect(all.map((r) => r.payload.description)).toEqual(["Report A", "Report B"]);
    });

    it("returns empty array from localStorage fallback when the key is missing", async () => {
      dbFail = true;
      // localStorage key "likaslens_offline_reports" is intentionally not set
      const all = await getAllQueued();
      expect(all).toEqual([]);
    });

    it("returns empty array from localStorage fallback when JSON is corrupted", async () => {
      dbFail = true;
      localStorage.setItem("likaslens_offline_reports", "this is not valid json{{{}}");
      const all = await getAllQueued();
      expect(all).toEqual([]);
    });

    it("returns empty array from localStorage fallback when the stored value is an empty array", async () => {
      dbFail = true;
      localStorage.setItem("likaslens_offline_reports", "[]");
      const all = await getAllQueued();
      expect(all).toEqual([]);
    });

    it("returns items from localStorage fallback and supplies a fallback queuedAt when missing", async () => {
      dbFail = true;
      const payload = { base64Image: "data:img", report_type: "waste_dumping" };
      // Store a payload WITHOUT queuedAt to test the fallback date logic
      localStorage.setItem("likaslens_offline_reports", JSON.stringify([payload]));

      const all = await getAllQueued();
      expect(all).toHaveLength(1);
      expect(all[0].payload.base64Image).toBe("data:img");
      expect(all[0].queuedAt).toBeDefined();
      expect(() => new Date(all[0].queuedAt)).not.toThrow();
    });

    it("returns empty array when localStorage contains null entries that crash the map", async () => {
      dbFail = true;
      // Stored data contains a null entry — accessing .queuedAt on null throws,
      // the inner try/catch catches it and returns []
      localStorage.setItem(
        "likaslens_offline_reports",
        '[{"base64Image":"img1","report_type":"water_pollution","queuedAt":"2026-01-01T00:00:00.000Z"}, null, {"base64Image":"img2","report_type":"illegal_logging"}]'
      );

      const all = await getAllQueued();
      expect(all).toEqual([]);
    });

    it("reads from localStorage fallback when IndexedDB is unavailable", async () => {
      dbFail = true;
      // Pre-populate localStorage with data, bypassing IndexedDB
      localStorage.setItem(
        "likaslens_offline_reports",
        JSON.stringify([
          { base64Image: "img_a", report_type: "air_pollution", queuedAt: "2026-03-15T10:00:00.000Z" },
          { base64Image: "img_b", report_type: "illegal_logging", queuedAt: "2026-03-16T12:00:00.000Z" },
        ])
      );

      const all = await getAllQueued();
      expect(all).toHaveLength(2);
      expect(all[0].payload.report_type).toBe("air_pollution");
      expect(all[0].queuedAt).toBe("2026-03-15T10:00:00.000Z");
      expect(all[1].payload.report_type).toBe("illegal_logging");
      expect(all[1].queuedAt).toBe("2026-03-16T12:00:00.000Z");
    });
  });

  describe("getQueueCount", () => {
    it("returns 0 when queue is empty", async () => {
      expect(await getQueueCount()).toBe(0);
    });

    it("returns the correct count after queuing", async () => {
      await queueReport(makePayload());
      expect(await getQueueCount()).toBe(1);

      await queueReport(makePayload());
      expect(await getQueueCount()).toBe(2);

      await queueReport(makePayload());
      expect(await getQueueCount()).toBe(3);
    });
  });

  describe("clearQueue", () => {
    it("removes all items from the queue", async () => {
      await queueReport(makePayload());
      await queueReport(makePayload());
      expect(await getQueueCount()).toBe(2);

      await clearQueue();
      expect(await getQueueCount()).toBe(0);
    });

    it("is a no-op when the queue is already empty", async () => {
      await clearQueue();
      expect(await getQueueCount()).toBe(0);
    });
  });

  describe("removeQueued", () => {
    it("removes a single item by id", async () => {
      await queueReport(makePayload({ description: "Keep" }));
      await queueReport(makePayload({ description: "Remove" }));
      await queueReport(makePayload({ description: "Keep too" }));

      const all = await getAllQueued();
      const toRemove = all.find((r) => r.payload.description === "Remove")!;
      expect(toRemove).toBeDefined();

      await removeQueued(toRemove.id);

      const remaining = await getAllQueued();
      expect(remaining).toHaveLength(2);
      expect(remaining.map((r) => r.payload.description)).toEqual(["Keep", "Keep too"]);
    });

    it("is a no-op when the id does not exist", async () => {
      await queueReport(makePayload());
      await removeQueued("non-existent-id");
      expect(await getQueueCount()).toBe(1);
    });
  });

  describe("syncBatch", () => {
    it("returns empty progress when the queue is empty", async () => {
      const postFn = vi.fn();
      const progress = await syncBatch(postFn, 5);
      expect(progress).toEqual({ total: 0, succeeded: 0, failed: 0, skipped: 0 });
      expect(postFn).not.toHaveBeenCalled();
    });

    it("processes up to batchSize items and removes successful ones", async () => {
      await queueReport(makePayload({ description: "A" }));
      await queueReport(makePayload({ description: "B" }));
      await queueReport(makePayload({ description: "C" }));

      const postFn = vi.fn().mockResolvedValue({ success: true });
      const progress = await syncBatch(postFn, 5);

      expect(progress).toEqual({ total: 3, succeeded: 3, failed: 0, skipped: 0 });
      expect(postFn).toHaveBeenCalledTimes(3);
      expect(await getQueueCount()).toBe(0);
    });

    it("honours batchSize — only processes that many items", async () => {
      await queueReport(makePayload({ description: "A" }));
      await queueReport(makePayload({ description: "B" }));
      await queueReport(makePayload({ description: "C" }));
      await queueReport(makePayload({ description: "D" }));

      const postFn = vi.fn().mockResolvedValue({ success: true });
      const progress = await syncBatch(postFn, 2);

      expect(progress).toEqual({ total: 2, succeeded: 2, failed: 0, skipped: 0 });
      expect(postFn).toHaveBeenCalledTimes(2);
      expect(await getQueueCount()).toBe(2);
    });

    it("keeps failed items in the queue with lastError set", async () => {
      await queueReport(makePayload({ description: "Success" }));
      await queueReport(makePayload({ description: "Fail" }));
      await queueReport(makePayload({ description: "Also Success" }));

      const postFn = vi
        .fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ success: true });

      const progress = await syncBatch(postFn, 5);

      expect(progress).toEqual({ total: 3, succeeded: 2, failed: 1, skipped: 0 });
      expect(await getQueueCount()).toBe(1);

      const remaining = await getAllQueued();
      expect(remaining[0].lastError).toBe("Network error");
    });

    it("handles all failures gracefully", async () => {
      await queueReport(makePayload({ description: "A" }));
      await queueReport(makePayload({ description: "B" }));

      const postFn = vi.fn().mockRejectedValue(new Error("Server down"));
      const progress = await syncBatch(postFn, 5);

      expect(progress).toEqual({ total: 2, succeeded: 0, failed: 2, skipped: 0 });
      expect(await getQueueCount()).toBe(2);

      const all = await getAllQueued();
      expect(all.every((r) => r.lastError === "Server down")).toBe(true);
    });

    it("passes the correct payload to the post function", async () => {
      await queueReport(makePayload({ description: "Payload 1", report_type: "waste_dumping" }));
      await queueReport(makePayload({ description: "Payload 2", report_type: "water_pollution" }));

      const postFn = vi.fn().mockResolvedValue({ success: true });
      await syncBatch(postFn, 5);

      expect(postFn).toHaveBeenCalledTimes(2);
      expect(postFn.mock.calls[0][0].description).toBe("Payload 1");
      expect(postFn.mock.calls[0][0].report_type).toBe("waste_dumping");
      expect(postFn.mock.calls[1][0].description).toBe("Payload 2");
      expect(postFn.mock.calls[1][0].report_type).toBe("water_pollution");
    });

    it("defaults batchSize to 5", async () => {
      for (let i = 0; i < 7; i++) {
        await queueReport(makePayload({ description: `Report ${i}` }));
      }

      const postFn = vi.fn().mockResolvedValue({ success: true });
      const progress = await syncBatch(postFn);

      expect(progress.total).toBe(5);
      expect(postFn).toHaveBeenCalledTimes(5);
    });
  });
});
