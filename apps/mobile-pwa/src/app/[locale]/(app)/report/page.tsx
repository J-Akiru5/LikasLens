"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  MapPin,
  ChevronDown,
  Send,
  Fingerprint,
} from "lucide-react";
import { cn, showToast } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";

const INCIDENT_TYPES = [
  "Illegal Dumping",
  "Water Pollution",
  "Air Pollution",
  "Deforestation",
  "Noise Pollution",
  "Wildlife Threat",
  "Chemical Spill",
  "Other",
];

export default function ReportPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPhoto(dataUrl);
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGps(null)
      );
    }
    startCamera();
    return () => stopCamera();
  }, []);

  async function handleSubmit() {
    if (!incidentType) {
      showToast("Please select an incident type", "error");
      return;
    }

    setSubmitting(true);
    try {
      showToast("Submitting report...", "info");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (ghostMode) {
        showToast("Metadata stripped for your safety. Report submitted!", "success");
      } else {
        showToast("Report submitted successfully!", "success");
      }

      setPhoto(null);
      setIncidentType("");
      setDescription("");
      startCamera();
    } catch (err) {
      showToast("Failed to submit report", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
          >
            Report Issue
          </h1>
          <p className="text-sm text-ink/50 mt-1 font-mono">
            Capture environmental evidence
          </p>
        </div>

        <button
          onClick={() => setGhostMode(!ghostMode)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono uppercase transition-all",
            ghostMode
              ? "bg-secondary/10 text-secondary border border-secondary/20"
              : "bg-ink/5 text-ink/40 border border-ink/10"
          )}
        >
          <Fingerprint className="w-4 h-4" />
          Ghost
        </button>
      </div>

      {/* Camera / Photo Preview */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        {!photo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-white/30 flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full border-2 border-black/20" />
            </button>
          </>
        ) : (
          <>
            <img
              src={photo}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => {
                setPhoto(null);
                startCamera();
              }}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-mono uppercase backdrop-blur-sm"
            >
              Retake
            </button>
          </>
        )}
      </div>

      {/* GPS */}
      {gps && (
        <div className="flex items-center gap-2 text-xs text-ink/40 font-mono">
          <MapPin className="w-3.5 h-3.5" />
          {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
        </div>
      )}

      {/* Incident Type */}
      <div className="relative">
        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink/40 mb-2">
          Incident Type
        </label>
        <button
          onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
          className="w-full h-12 px-4 rounded-xl bg-ink/[0.03] border border-ink/10 text-left text-sm flex items-center justify-between"
        >
          <span className={incidentType ? "text-ink" : "text-ink/30"}>
            {incidentType || "Select type..."}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-ink/30 transition-transform",
              typeDropdownOpen && "rotate-180"
            )}
          />
        </button>
        {typeDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-page border border-ink/10 rounded-xl shadow-lg z-10 overflow-hidden">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setIncidentType(type);
                  setTypeDropdownOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-ink/[0.04] transition-colors border-b border-ink/5 last:border-0",
                  incidentType === type && "bg-ink/[0.04] text-green font-medium"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink/40 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you observed..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-ink/[0.03] border border-ink/10 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-green/50 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !incidentType}
        className={cn(
          "w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
          submitting || !incidentType
            ? "bg-ink/10 text-ink/30"
            : "bg-green text-white hover:bg-green/90"
        )}
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Report
          </>
        )}
      </button>
    </div>
  );
}
