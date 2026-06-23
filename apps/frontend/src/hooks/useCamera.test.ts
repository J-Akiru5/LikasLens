/**
 * Tests for src/hooks/useCamera.ts
 *
 * These tests verify the camera hook's behavior including
 * start, stop, switchCamera, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCamera } from "@/hooks/useCamera";

// Mock MediaStream
class MockMediaStream {
  tracks = [{ stop: vi.fn() }];
  getTracks() {
    return this.tracks;
  }
}

// Mock getUserMedia
const mockGetUserMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Setup navigator.mediaDevices.getUserMedia mock
  Object.defineProperty(globalThis, "navigator", {
    value: {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    },
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCamera", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.stream).toBeNull();
    expect(result.current.isActive).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.facingMode).toBe("environment");
  });

  it("should accept initial facing mode", () => {
    const { result } = renderHook(() => useCamera("user"));

    expect(result.current.facingMode).toBe("user");
  });

  it("should set isActive to true on successful start", async () => {
    const mockStream = new MockMediaStream();
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.stream).toBe(mockStream);
    expect(result.current.error).toBeNull();
  });

  it("should set isActive to false on stop", async () => {
    const mockStream = new MockMediaStream();
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.stream).toBeNull();
  });

  it("should handle NOT_ALLOWED error", async () => {
    const error = new Error("Permission denied");
    error.name = "NotAllowedError";
    mockGetUserMedia.mockRejectedValue(error);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBe("NOT_ALLOWED");
    expect(result.current.errorMessage).toContain("denied");
  });

  it("should handle NOT_FOUND error", async () => {
    const error = new Error("No camera found");
    error.name = "NotFoundError";
    mockGetUserMedia.mockRejectedValue(error);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe("NOT_FOUND");
    expect(result.current.errorMessage).toContain("No camera");
  });

  it("should handle NOT_READABLE error", async () => {
    const error = new Error("Camera in use");
    error.name = "NotReadableError";
    mockGetUserMedia.mockRejectedValue(error);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe("NOT_READABLE");
    expect(result.current.errorMessage).toContain("in use");
  });

  it("should handle SecurityError", async () => {
    const error = new Error("Insecure context");
    error.name = "SecurityError";
    mockGetUserMedia.mockRejectedValue(error);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe("INSECURE_CONTEXT");
    expect(result.current.errorMessage).toContain("secure context");
  });

  it("should handle unknown errors", async () => {
    const error = new Error("Something weird");
    error.name = "WeirdError";
    mockGetUserMedia.mockRejectedValue(error);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe("UNKNOWN");
    expect(result.current.errorMessage).toContain("unexpected");
  });

  it("should switch camera facing mode", async () => {
    const mockStream = new MockMediaStream();
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useCamera("environment"));

    await act(async () => {
      await result.current.switchCamera();
    });

    expect(result.current.facingMode).toBe("user");
    expect(result.current.isActive).toBe(true);
  });

  it("should toggle between facing modes on multiple switches", async () => {
    const mockStream = new MockMediaStream();
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useCamera("environment"));

    await act(async () => {
      await result.current.switchCamera();
    });
    expect(result.current.facingMode).toBe("user");

    await act(async () => {
      await result.current.switchCamera();
    });
    expect(result.current.facingMode).toBe("environment");
  });

  it("should stop tracks on unmount", async () => {
    const mockStream = new MockMediaStream();
    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result, unmount } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    unmount();

    expect(mockStream.tracks[0].stop).toHaveBeenCalled();
  });
});
