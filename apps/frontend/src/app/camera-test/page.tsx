"use client";

import { useEffect, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";

export default function CameraTestPage() {
  const { stream, isActive, isLoading, errorMessage, facingMode, start, stop, switchCamera } =
    useCamera("environment");

  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach the MediaStream to the <video> element whenever it changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-6 font-sans">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Camera Test
      </h1>

      {/* Video viewport */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 shadow-xl aspect-[3/4]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          aria-label="Live camera feed"
        />

        {/* Facing-mode badge */}
        {isActive && (
          <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {facingMode === "environment" ? "📷 Back" : "🤳 Front"}
          </span>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="text-sm font-medium text-white">
              Starting camera…
            </span>
          </div>
        )}

        {/* Idle placeholder */}
        {!isActive && !isLoading && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
            <span className="text-4xl">📷</span>
            <span className="text-sm text-zinc-400">
              Press &ldquo;Start Camera&rdquo; to begin
            </span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-950/80 p-6 text-center">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-medium text-red-200">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3">
        {!isActive ? (
          <button
            onClick={start}
            disabled={isLoading}
            className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Starting…" : "Start Camera"}
          </button>
        ) : (
          <button
            onClick={stop}
            className="rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-red-400"
          >
            Stop Camera
          </button>
        )}

        <button
          onClick={switchCamera}
          disabled={isLoading}
          className="rounded-full border border-zinc-600 bg-zinc-800 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {facingMode === "environment" ? "Switch to Front" : "Switch to Back"}
        </button>
      </div>

      {/* Status row */}
      <p className="text-xs text-zinc-500">
        Status:{" "}
        <span
          className={
            isActive
              ? "text-green-400"
              : errorMessage
              ? "text-red-400"
              : "text-zinc-400"
          }
        >
          {isLoading
            ? "initialising"
            : isActive
            ? "streaming"
            : errorMessage
            ? "error"
            : "idle"}
        </span>
      </p>
    </main>
  );
}
