"use client";

import { Space_Grotesk } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type StatusKind = "loading" | "ready" | "error";

interface CameraStatus {
  kind: StatusKind;
  message: string;
}

const ERROR_COPY: Record<string, string> = {
  NotAllowedError:
    "Camera permission was denied. Please allow access and try again.",
  PermissionDeniedError:
    "Camera permission was denied. Please allow access and try again.",
  NotFoundError: "No camera was found on this device.",
  NotReadableError:
    "The camera is already in use by another app. Close it and retry.",
  OverconstrainedError:
    "The back camera is not available. Try again or switch devices.",
  SecurityError: "Camera access requires HTTPS or localhost.",
};

const DEFAULT_ERROR = "Unable to access the camera. Please retry.";

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>({
    kind: "loading",
    message: "Opening camera...",
  });

  const stopStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay can be blocked; the stream still exists.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        setStatus({ kind: "loading", message: "Opening camera..." });
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw Object.assign(new Error("SecurityError"), {
            name: "SecurityError",
          });
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (!isMounted) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        await attachStream(stream);
        setStatus({ kind: "ready", message: "Camera ready" });
      } catch (error) {
        const errorName = error instanceof Error ? error.name : "Unknown";
        const message = ERROR_COPY[errorName] ?? DEFAULT_ERROR;
        setStatus({ kind: "error", message });
      }
    };

    void startCamera();

    return () => {
      isMounted = false;
      stopStream(streamRef.current);
      streamRef.current = null;

      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, [attachStream, stopStream]);

  const handleRetry = useCallback(() => {
    const stream = streamRef.current;
    stopStream(stream);
    streamRef.current = null;
    setStatus({ kind: "loading", message: "Retrying camera..." });

    void (async () => {
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        streamRef.current = nextStream;
        await attachStream(nextStream);
        setStatus({ kind: "ready", message: "Camera ready" });
      } catch (error) {
        const errorName = error instanceof Error ? error.name : "Unknown";
        const message = ERROR_COPY[errorName] ?? DEFAULT_ERROR;
        setStatus({ kind: "error", message });
      }
    })();
  }, [attachStream, stopStream]);

  return (
    <main
      className={`${spaceGrotesk.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-6 text-white`}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-24 translate-y-24 rounded-full bg-sky-400/15 blur-3xl" />

      <section className="relative w-full max-w-md space-y-5 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-5 shadow-2xl backdrop-blur">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-200">
            FE2 Camera Lab
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Camera Test</h1>
            <p className="text-sm text-zinc-300">
              Opens the back camera directly in a live video feed. Works on HTTPS
              or localhost.
            </p>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-2xl bg-black shadow-inner aspect-[3/4]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label="Live camera feed"
          />
          <div className="pointer-events-none absolute inset-0 border border-white/10" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => console.log("Photo Snapped")}
            className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Take Photo
          </button>

          {status.kind === "error" && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
            >
              Retry Camera
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400" aria-live="polite">
          <span>{status.message}</span>
          <span
            className={
              status.kind === "ready"
                ? "text-emerald-300"
                : status.kind === "error"
                ? "text-rose-300"
                : "text-sky-200"
            }
          >
            {status.kind === "ready"
              ? "LIVE"
              : status.kind === "error"
              ? "BLOCKED"
              : "OPENING"}
          </span>
        </div>
      </section>
    </main>
  );
}
