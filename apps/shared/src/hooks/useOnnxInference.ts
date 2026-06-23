/**
 * React hook for on-device ONNX inference.
 *
 * Provides a declarative interface to run YOLOv8 inference in the browser.
 * Handles model initialization, status tracking, and inference execution.
 *
 * @example
 * ```tsx
 * const { infer, status, isReady } = useOnnxInference();
 *
 * // Run inference on captured photo
 * const result = await infer(base64Image);
 * if (result.has_environmental_concern) {
 *   showWarning(result.environmental_indicators);
 * }
 * ```
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type InferenceResult,
  type InferenceStatus,
  initializeOnnx,
  inferOnDevice,
  isOnnxReady,
  onInferenceStatusChange,
  getLoadedModels,
} from "../lib/onnx/inference";

export interface UseOnnxInferenceOptions {
  /** Auto-initialize models on mount. Default: false (lazy on first infer call) */
  autoInit?: boolean;
  /** Confidence threshold override (0-1) */
  confidenceThreshold?: number;
  /** NMS IoU threshold override (0-1) */
  nmsThreshold?: number;
}

export interface UseOnnxInferenceReturn {
  /** Current inference engine status */
  status: InferenceStatus;
  /** Whether models are loaded and ready */
  isReady: boolean;
  /** Whether inference is currently running */
  isRunning: boolean;
  /** Run on-device inference on a base64 data URL image */
  infer: (imageDataUrl: string) => Promise<InferenceResult>;
  /** Initialize models manually (if autoInit is false) */
  init: () => Promise<void>;
  /** Names of loaded models */
  loadedModels: string[];
  /** Last error, if any */
  error: Error | null;
}

export function useOnnxInference(
  options?: UseOnnxInferenceOptions
): UseOnnxInferenceReturn {
  const [status, setStatus] = useState<InferenceStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [loadedModels, setLoadedModels] = useState<string[]>([]);
  const initRef = useRef(false);
  const autoInitRef = useRef(options?.autoInit ?? false);

  // Keep autoInitRef in sync with options
  autoInitRef.current = options?.autoInit ?? false;

  // Subscribe to status changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onInferenceStatusChange((newStatus) => {
        setStatus(newStatus);
        if (newStatus === "ready") {
          setLoadedModels(getLoadedModels());
        }
      });
      // Set initial status
      setStatus(isOnnxReady() ? "ready" : "idle");
      if (isOnnxReady()) setLoadedModels(getLoadedModels());
    } catch {
      // Ignore errors in status subscription
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Auto-init on mount if requested
  useEffect(() => {
    if (autoInitRef.current && !initRef.current) {
      initRef.current = true;
      initializeOnnx()
        .then(() => {
          // success
        })
        .catch((err: unknown) => {
          // Don't crash the component - just log and set error
          console.warn("[useOnnxInference] Auto-init failed:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        });
    }
  }, []);

  const init = useCallback(async () => {
    try {
      setError(null);
      await initializeOnnx();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    }
  }, []);

  const infer = useCallback(
    async (imageDataUrl: string): Promise<InferenceResult> => {
      try {
        setError(null);
        const result = await inferOnDevice(imageDataUrl, {
          confidenceThreshold: options?.confidenceThreshold,
          nmsThreshold: options?.nmsThreshold,
        });
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [options?.confidenceThreshold, options?.nmsThreshold]
  );

  return {
    status,
    isReady: status === "ready",
    isRunning: status === "running",
    infer,
    init,
    loadedModels,
    error,
  };
}
