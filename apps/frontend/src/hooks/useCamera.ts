"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FacingMode = "user" | "environment";

export type CameraError =
  | "NOT_ALLOWED"
  | "NOT_FOUND"
  | "NOT_READABLE"
  | "INSECURE_CONTEXT"
  | "UNKNOWN";

const ERROR_MESSAGES: Record<CameraError, string> = {
  NOT_ALLOWED:
    "Camera access was denied. Please allow camera permission and try again.",
  NOT_FOUND: "No camera was found on this device.",
  NOT_READABLE:
    "The camera is already in use by another application. Please close it and try again.",
  INSECURE_CONTEXT:
    "Camera access requires a secure context (HTTPS or localhost).",
  UNKNOWN: "An unexpected error occurred while accessing the camera.",
};

function mapError(err: unknown): CameraError {
  if (!(err instanceof Error)) return "UNKNOWN";
  if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
    return "NOT_ALLOWED";
  if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")
    return "NOT_FOUND";
  if (err.name === "NotReadableError" || err.name === "TrackStartError")
    return "NOT_READABLE";
  if (err.name === "SecurityError") return "INSECURE_CONTEXT";
  return "UNKNOWN";
}

export interface UseCameraReturn {
  stream: MediaStream | null;
  isActive: boolean;
  isLoading: boolean;
  error: CameraError | null;
  errorMessage: string | null;
  facingMode: FacingMode;
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>;
}

export function useCamera(initialFacing: FacingMode = "environment"): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacing);

  // Keep a ref so that cleanup callbacks always see the latest stream.
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = useCallback((s: MediaStream | null) => {
    s?.getTracks().forEach((t) => t.stop());
  }, []);

  const stop = useCallback(() => {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setIsActive(false);
    setError(null);
  }, [stopTracks]);

  const acquireStream = useCallback(
    async (facing: FacingMode): Promise<MediaStream> => {
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw Object.assign(new Error("Insecure context"), {
          name: "SecurityError",
        });
      }

      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
    },
    []
  );

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Stop any existing stream before opening a new one.
      stopTracks(streamRef.current);
      const newStream = await acquireStream(facingMode);
      streamRef.current = newStream;
      setStream(newStream);
      setIsActive(true);
    } catch (err) {
      const code = mapError(err);
      setError(code);
      setIsActive(false);
      streamRef.current = null;
      setStream(null);
    } finally {
      setIsLoading(false);
    }
  }, [acquireStream, facingMode, stopTracks]);

  const switchCamera = useCallback(async () => {
    const nextFacing: FacingMode =
      facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setIsLoading(true);
    setError(null);
    try {
      stopTracks(streamRef.current);
      const newStream = await acquireStream(nextFacing);
      streamRef.current = newStream;
      setStream(newStream);
      setIsActive(true);
    } catch (err) {
      const code = mapError(err);
      setError(code);
      setIsActive(false);
      streamRef.current = null;
      setStream(null);
    } finally {
      setIsLoading(false);
    }
  }, [acquireStream, facingMode, stopTracks]);

  // Clean up all tracks when the component using this hook unmounts.
  useEffect(() => {
    return () => {
      stopTracks(streamRef.current);
    };
  }, [stopTracks]);

  return {
    stream,
    isActive,
    isLoading,
    error,
    errorMessage: error ? ERROR_MESSAGES[error] : null,
    facingMode,
    start,
    stop,
    switchCamera,
  };
}
