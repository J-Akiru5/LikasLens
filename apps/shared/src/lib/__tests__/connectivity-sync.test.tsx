/**
 * Tests for the online/offline connectivity detection used in the report pages.
 *
 * Sync is manual-only — the user must tap "Sync Now" on the /offline-queue page.
 * This file only tests that connectivity detection works (online/offline events,
 * isOnline state, notification toasts). No auto-flush, no auto-retry.
 *
 * Rather than mounting the full ReportPage component (which depends on camera,
 * GPS, voice input, etc.), this file uses a minimal test harness that mirrors
 * the exact `useEffect` + event-listener pattern from the actual page.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useEffect, useState } from "react";
import { showToast } from "../../ui/toast";

// ── Mock ────────────────────────────────────────────────────────

vi.mock("../../ui/toast", () => ({
  showToast: vi.fn(),
}));

// ── Test harness hook (mirrors the report page's useEffect) ─────

function useConnectivitySync() {
  const [isOnline, setIsOnline] = useState(true);

  // ── Connectivity effect ──────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Connection restored.", "success");
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        "Connection lost. Reports will queue until you are back online.",
        "error",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}

// ── Helpers ─────────────────────────────────────────────────────

function dispatchOnline() {
  window.dispatchEvent(new Event("online"));
}

function dispatchOffline() {
  window.dispatchEvent(new Event("offline"));
}

// ── Tests ───────────────────────────────────────────────────────

describe("connectivity detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: simulated as online
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("event listener lifecycle", () => {
    it("adds online and offline event listeners on mount", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const { unmount } = renderHook(() => useConnectivitySync());

      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));

      unmount();
    });

    it("removes event listeners on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useConnectivitySync());
      unmount();

      expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    });
  });

  describe("offline event", () => {
    it("sets isOnline to false when the offline event fires", async () => {
      const { result } = renderHook(() => useConnectivitySync());

      expect(result.current.isOnline).toBe(true);

      await act(async () => {
        dispatchOffline();
        await Promise.resolve();
      });

      expect(result.current.isOnline).toBe(false);
    });

    it("shows an error toast when going offline", async () => {
      renderHook(() => useConnectivitySync());

      await act(async () => {
        dispatchOffline();
        await Promise.resolve();
      });

      expect(showToast).toHaveBeenCalledWith(
        "Connection lost. Reports will queue until you are back online.",
        "error",
      );
    });
  });

  describe("online event", () => {
    it("sets isOnline to true when the online event fires", async () => {
      const { result } = renderHook(() => useConnectivitySync());

      // Go offline first
      await act(async () => {
        dispatchOffline();
        await Promise.resolve();
      });
      expect(result.current.isOnline).toBe(false);

      // Come back online
      await act(async () => {
        dispatchOnline();
        await Promise.resolve();
      });

      expect(result.current.isOnline).toBe(true);
    });

    it("shows a restored toast when coming back online", async () => {
      renderHook(() => useConnectivitySync());

      await act(async () => {
        dispatchOnline();
        await Promise.resolve();
      });

      // Does NOT show a sync toast — just "Connection restored."
      expect(showToast).toHaveBeenCalledWith(
        "Connection restored.",
        "success",
      );
    });
  });

  describe("initial online state", () => {
    it("reads from navigator.onLine on mount", () => {
      const { result } = renderHook(() => useConnectivitySync());
      expect(result.current.isOnline).toBe(true);
    });

    it("initializes as offline when navigator.onLine is false", () => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useConnectivitySync());
      expect(result.current.isOnline).toBe(false);
    });
  });
});
