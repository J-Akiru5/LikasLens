"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  MapPin,
  ChevronDown,
  Send,
  Fingerprint,
  X,
  Check,
  ArrowLeft,
  Mic,
  MicOff,
  Zap,
} from "lucide-react";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { cn, laravelPost, showToast } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { captureWithStamp, dataUrlToBase64 } from "@/lib/camera-stamp";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useVoiceInput } from "@/hooks/use-voice-input";

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

type Step = "camera" | "preview" | "form";

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "en";
  const isQuickMode = searchParams.get("quick") === "true";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("camera");
  const [incidentType, setIncidentType] = useState(isQuickMode ? "Illegal Dumping" : "");
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported: voiceSupported,
    toggleListening,
    setTranscript,
  } = useVoiceInput();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
      } catch (fallbackErr) {
        console.error("Camera access denied:", fallbackErr);
        showToast("Camera access denied or unavailable", "error");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream, step]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const dataUrl = captureWithStamp(video, {
      latitude: gps?.lat ?? 0,
      longitude: gps?.lng ?? 0,
      ghostMode,
    });
    setPhoto(dataUrl);
    setStep("preview");
    stopCamera();
  }, [stopCamera, gps, ghostMode]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGps(null),
      );
    }
  }, []);

  // Sync voice transcript into the description field
  useEffect(() => {
    if (transcript) {
      setDescription((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed ? `${trimmed} ${transcript}` : transcript;
      });
      setTranscript("");
    }
  }, [transcript, setTranscript]);

  useEffect(() => {
    if (step === "camera") {
      startCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  // Ghost Mode only affects submission metadata — the global theme toggle
  // in the app layout handles the visual theme via localStorage + data-theme.
  // No DOM manipulation here to avoid conflicting with the layout's theme toggle.

  async function handleSubmit() {
    if (!incidentType) {
      showToast("Please select an incident type", "error");
      return;
    }

    if (!photo) {
      showToast("No photo captured", "error");
      return;
    }

    setSubmitting(true);
    try {
      showToast("Submitting report...", "info");

      // Extract base64 data from the data URL.
      // canvas.toDataURL() returns a raw pixel raster, so EXIF metadata is
      // already stripped at the point of capture. Ghost Mode additionally
      // omits GPS coordinates from the payload below.
      const base64Image = dataUrlToBase64(photo);

      // Resolve the current user ID (optional) from Supabase session.
      let userId: string | undefined;
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id;
      } catch {
        // User not logged in — submit anonymously.
      }

      await laravelPost("/reports", {
        base64Image,
        latitude: ghostMode ? undefined : gps?.lat,
        longitude: ghostMode ? undefined : gps?.lng,
        user_id: userId,
        description: description || undefined,
        report_type: incidentType,
      });

      if (ghostMode) {
        showToast(
          "Metadata stripped for your safety. Report submitted!",
          "success",
        );
      } else {
        showToast("Report submitted successfully!", "success");
      }

      setPhoto(null);
      setIncidentType("");
      setDescription("");
      setStep("camera");
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit report";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Camera & Preview Screen (Takes over entirely)
  if (step === "camera" || step === "preview") {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={() => {
              stopCamera();
              router.push(`/${locale}/dashboard`);
            }}
            className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            {isQuickMode && (
              <span className="flex items-center gap-1 px-3 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#facc15]/90 text-black font-bold backdrop-blur-md shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                <Zap className="w-3 h-3" />
                Quick
              </span>
            )}
            <button
              onClick={() => setGhostMode(!ghostMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-mono uppercase transition-all backdrop-blur-md",
                ghostMode
                  ? "bg-[#facc15]/90 text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                  : "bg-black/40 text-white/80 border border-white/20",
              )}
            >
              <Fingerprint className="w-4 h-4" />
              Ghost {ghostMode && "On"}
            </button>
          </div>
        </div>

        {/* Video or Image */}
        {step === "camera" ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <img
            src={photo!}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-16 flex justify-center items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {step === "camera" ? (
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white/20 border-4 border-white backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          ) : (
            <div className="flex w-full px-12 justify-between items-center">
              <button
                onClick={() => {
                  setPhoto(null);
                  setStep("camera");
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform border border-white/10">
                  <X className="w-7 h-7" />
                </div>
                <span className="text-white/80 text-[10px] font-mono uppercase tracking-wider">
                  Retake
                </span>
              </button>

              <button
                onClick={() => setStep("form")}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center text-white active:scale-95 transition-transform shadow-[0_0_20px_rgba(46,230,200,0.6)]">
                  <Check className="w-8 h-8" />
                </div>
                <span className="text-green font-bold text-[10px] font-mono uppercase tracking-wider">
                  Use Photo
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quick Mode Form — minimal: photo, ghost toggle, submit
  if (isQuickMode) {
    return (
      <div className="p-4 space-y-5 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("preview")}
            className="p-2 -ml-2 rounded-full hover:bg-ink/5"
          >
            <ArrowLeft className="w-6 h-6 text-ink" />
          </button>
          <div className="flex-1">
            <h1
              className="text-2xl font-bold text-ink"
              style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
            >
              Quick Report
            </h1>
            <p className="text-sm text-ink/50 mt-0.5 font-mono">
              Illegal Dumping &middot; GPS {gps ? "detected" : "pending..."}
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#facc15]/20 text-[#facc15] font-bold border border-[#facc15]/30">
            <Zap className="w-3 h-3" />
            Quick
          </span>
        </div>

        {/* Photo Thumbnail */}
        <div className="relative rounded-2xl overflow-hidden bg-ink/5 aspect-[4/3] w-full max-h-56 shadow-inner ring-1 ring-ink/5">
          <img
            src={photo!}
            alt="Captured Evidence"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => setStep("camera")}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-mono uppercase backdrop-blur-sm"
          >
            Retake
          </button>
          {gps && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] font-mono text-white/80">
              <MapPin className="w-3 h-3" />
              {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Ghost Mode Toggle */}
        <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-start gap-3">
          <button
            onClick={() => setGhostMode(!ghostMode)}
            className={cn(
              "mt-0.5 w-10 h-6 rounded-full transition-colors relative shrink-0",
              ghostMode ? "bg-secondary" : "bg-ink/20",
            )}
          >
            <div
              className={cn(
                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                ghostMode && "translate-x-4",
              )}
            />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Ghost Mode</p>
            <p className="text-xs text-ink/50 mt-1 leading-relaxed">
              Strip location data and metadata to protect your identity.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            "w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
            submitting
              ? "bg-ink/5 text-ink/30 cursor-not-allowed"
              : "bg-green text-white shadow-lg shadow-green/20 hover:bg-green/90 hover:shadow-green/30",
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

  // Full Form View (Step 3) — standard report flow
  return (
    <div className="p-4 space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep("preview")}
          className="p-2 -ml-2 rounded-full hover:bg-ink/5"
        >
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <div>
          <h1
            className="text-2xl font-bold text-ink"
            style={{
              fontFamily: "var(--font-heading), Montserrat, sans-serif",
            }}
          >
            Report Details
          </h1>
          <p className="text-sm text-ink/50 mt-0.5 font-mono">
            Review and submit evidence
          </p>
        </div>
      </div>

      {/* Selected Photo Thumbnail */}
      <div className="relative rounded-2xl overflow-hidden bg-ink/5 aspect-[4/3] w-full max-h-64 shadow-inner ring-1 ring-ink/5">
        <img
          src={photo!}
          alt="Captured Evidence"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => setStep("camera")}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-mono uppercase backdrop-blur-sm"
        >
          Retake Photo
        </button>
      </div>

      {/* Map — shows GPS pin, draggable to refine location */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink/40 mb-2 pl-1">
          Location
        </label>
        <GeoTagMap
          lat={gps?.lat ?? null}
          lng={gps?.lng ?? null}
          onLocationChange={(lat, lng) => setGps({ lat, lng })}
          height="220px"
        />
      </div>

      {/* Incident Type */}
      <div className="relative">
        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink/40 mb-2 pl-1">
          Incident Type
        </label>
        <button
          onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
          className="w-full h-14 px-4 rounded-xl bg-page border border-ink/10 text-left text-sm flex items-center justify-between shadow-sm focus:border-green/50 transition-colors"
        >
          <span
            className={incidentType ? "text-ink font-medium" : "text-ink/30"}
          >
            {incidentType || "Select classification..."}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-ink/40 transition-transform",
              typeDropdownOpen && "rotate-180",
            )}
          />
        </button>
        {typeDropdownOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-page border border-ink/10 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setIncidentType(type);
                  setTypeDropdownOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3.5 text-left text-sm hover:bg-ink/[0.04] transition-colors border-b border-ink/5 last:border-0",
                  incidentType === type &&
                    "bg-green/5 text-green font-semibold",
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
        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink/40 mb-2 pl-1">
          Description (Optional)
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any extra details about the location or situation..."
            rows={4}
            className="w-full px-4 py-3 pr-14 rounded-xl bg-page border border-ink/10 text-sm text-ink placeholder:text-ink/30 shadow-sm focus:outline-none focus:border-green/50 focus:ring-2 focus:ring-green/10 resize-none transition-all"
          />
          {voiceSupported ? (
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute bottom-3 right-3 p-2.5 rounded-full transition-all",
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                  : "bg-ink/5 text-ink/40 hover:bg-ink/10 hover:text-ink/60",
              )}
              title={isListening ? "Stop listening" : "Speak description"}
            >
              {isListening ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>
          ) : (
            <div
              className="absolute bottom-3 right-3 p-2.5 rounded-full bg-ink/5 text-ink/20 cursor-not-allowed"
              title="Voice input not supported"
            >
              <MicOff className="w-5 h-5" />
            </div>
          )}
        </div>
        {isListening && (
          <p className="text-xs text-red-500 mt-2 pl-1 flex items-center gap-1.5 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Listening...
          </p>
        )}
        {voiceError && (
          <p className="text-xs text-red-400 mt-2 pl-1 font-mono">
            {voiceError}
          </p>
        )}
        {!voiceSupported && (
          <p className="text-xs text-ink/30 mt-2 pl-1 font-mono">
            Voice input not supported in this browser
          </p>
        )}
      </div>

      {/* Ghost Mode Toggle in Form */}
      <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-start gap-3">
        <button
          onClick={() => setGhostMode(!ghostMode)}
          className={cn(
            "mt-0.5 w-10 h-6 rounded-full transition-colors relative shrink-0",
            ghostMode ? "bg-secondary" : "bg-ink/20",
          )}
        >
          <div
            className={cn(
              "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
              ghostMode && "translate-x-4",
            )}
          />
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Ghost Mode</p>
          <p className="text-xs text-ink/50 mt-1 leading-relaxed">
            When enabled, location data and device metadata will be completely
            stripped from this report to protect your identity.
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !incidentType}
        className={cn(
          "w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
          submitting || !incidentType
            ? "bg-ink/5 text-ink/30 cursor-not-allowed"
            : "bg-green text-white shadow-lg shadow-green/20 hover:bg-green/90 hover:shadow-green/30",
        )}
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Evidence
          </>
        )}
      </button>
    </div>
  );
}
