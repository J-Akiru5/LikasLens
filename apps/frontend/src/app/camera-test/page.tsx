"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("Opening camera...");

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error("Camera access requires a secure browser context.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        setStatus("Camera ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown camera error.";
        setStatus(message);
      }
    };

    void startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
      <section className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Camera Test</h1>
          <p className="text-sm text-zinc-300">
            This page opens the back camera directly in a video element.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-black shadow-inner aspect-[3/4]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label="Live camera feed"
          />
        </div>

        <button
          type="button"
          onClick={() => console.log("Photo Snapped")}
          className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Take Photo
        </button>

        <p className="text-xs text-zinc-400">{status}</p>
      </section>
    </main>
  );
}
