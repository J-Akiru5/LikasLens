"use client";

import { Space_Grotesk } from "next/font/google";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { stripExif } from "@/utils/exifStripper";
import { showToast } from "@likaslens/shared";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>({
    kind: "loading",
    message: "Opening camera...",
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState("GPS idle");
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("Idle");

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
    const videoNode = videoRef.current;

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

      if (videoNode) {
        videoNode.srcObject = null;
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

  const handleTakePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 1);
    setCapturedImage(dataUrl);

    setGpsStatus("Requesting GPS...");
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsStatus("GPS locked");
      },
      () => {
        setGpsStatus("GPS denied or unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!capturedImage) {
      setSubmitStatus("Capture a photo first");
      return;
    }

    if (latitude === null || longitude === null) {
      setSubmitStatus("GPS lock required before submit");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      setSubmitStatus("Missing API URL configuration");
      return;
    }

    setSubmitStatus("Preparing payload...");
    try {
      const imageForUpload = await stripExif(capturedImage);

      const payload = {
        base64Image: imageForUpload,
        latitude,
        longitude,
        isGhostMode,
      };

      setSubmitStatus("Submitting report...");
      const response = await fetch(`${apiBaseUrl}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setSubmitStatus(`Submit failed (${response.status})`);
        return;
      }

      setSubmitStatus("Report submitted");
      showToast("Report submitted successfully", "success");
    } catch {
      setSubmitStatus("Failed to submit report");
      showToast("Failed to submit report", "error");
    }
  }, [capturedImage, isGhostMode, latitude, longitude]);

  return (
    <main
      className={`${spaceGrotesk.className} relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 p-6 text-white`}
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

        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleTakePhoto}
            className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Take Photo
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!capturedImage}
            className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Report
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

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
          <span className="font-medium">Ghost Mode (strip EXIF)</span>
          <input
            type="checkbox"
            checked={isGhostMode}
            onChange={(event) => setIsGhostMode(event.target.checked)}
            className="h-4 w-4 accent-emerald-300"
          />
        </label>

        {capturedImage && (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3">
            <Image
              src={capturedImage}
              alt="Captured preview"
              width={640}
              height={853}
              sizes="(max-width: 768px) 100vw, 320px"
              unoptimized
              className="h-40 w-full rounded-xl object-cover"
            />
            <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-300">
              <span>Captured: {capturedImage ? "Yes" : "No"}</span>
              <span>
                Lat: {latitude !== null ? latitude.toFixed(6) : "-"}
              </span>
              <span>
                Lng: {longitude !== null ? longitude.toFixed(6) : "-"}
              </span>
            </div>
            <div className="text-xs text-zinc-400">{gpsStatus}</div>
          </div>
        )}

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

        <p className="text-xs text-zinc-400">Submit: {submitStatus}</p>
      </section>
    </main>
  );
}
