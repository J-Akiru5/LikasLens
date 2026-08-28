"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  MapPin,
  Send,
  Fingerprint,
  X,
  Check,
  ArrowLeft,
  Mic,
  MicOff,
  Zap,
  RefreshCw,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ImagePlus,
  Flashlight,
  FlashlightOff,
  Images,
  Minus,
  Plus,
} from "lucide-react";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { cn, laravelPost, showToast, Button } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { captureWithStamp, dataUrlToBase64 } from "@/lib/camera-stamp";
import { queueReport } from "@likaslens/shared";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useHaptics } from "@/hooks/use-haptics";
import { BottomSheet } from "@/components/native/bottom-sheet";
import { GhostShieldOverlay } from "@/components/ghost-shield-overlay";
import { AIAnalysisAnimation } from "@/components/ai-analysis-animation";

interface FailedPayload {
  base64Image: string;
  latitude: number | undefined;
  longitude: number | undefined;
  user_id: string | undefined;
  description: string | undefined;
  report_type: string;
}

interface FailedSubmission {
  error: string;
  payload: FailedPayload;
  retriesExhausted?: boolean;
}

const INCIDENT_TYPES: { value: string; label: string }[] = [
  { value: "waste_dumping", label: "Illegal Dumping" },
  { value: "water_pollution", label: "Water Pollution" },
  { value: "air_pollution", label: "Air Pollution" },
  { value: "illegal_logging", label: "Deforestation" },
  { value: "other", label: "Noise Pollution" },
  { value: "wildlife_poaching", label: "Wildlife Threat" },
  { value: "other", label: "Chemical Spill" },
  { value: "other", label: "Other" },
];

type Step = "camera" | "preview" | "form";

const getBrowserInstructions = (): string => {
  if (typeof window === "undefined") return "";
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(ua);
  if (isIOS) {
    return "Camera access is blocked. Tap the aA icon in your address bar, select Website Settings, and allow Camera.";
  }
  return "Camera access is blocked. Tap the lock icon 🔒 in your address bar, go to Permissions, and allow Camera access.";
};

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
  const [incidentType, setIncidentType] = useState(isQuickMode ? "waste_dumping" : "");
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [cameraInitialising, setCameraInitialising] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const MAX_RETRIES = 3;
  const MAX_PHOTOS = 3;

  const [failedSubmission, setFailedSubmission] = useState<FailedSubmission | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [autoRetrying, setAutoRetrying] = useState(false);

  const haptic = useHaptics();

  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported: voiceSupported,
    toggleListening,
    setTranscript,
  } = useVoiceInput();

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<"NOT_ALLOWED" | "NOT_FOUND" | "UNKNOWN" | null>(null);

  // Online / offline detection only — no auto-flush or auto-retry.
  // Sync is manual via the /offline-queue tab.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Connection restored.", "success");
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast("Connection lost. Reports will queue until you are back online.", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

const startCamera = useCallback(async (facing?: "user" | "environment") => {
    const targetFacing = facing ?? facingMode;
    setCameraError(null);
    setCameraInitialising(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: targetFacing } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera access denied:", err);
      const errName = (err as Error)?.name;
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraError("NOT_ALLOWED");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setCameraError("NOT_FOUND");
      } else {
        setCameraError("UNKNOWN");
      }
      showToast("Camera access denied or unavailable", "error");
    } finally {
      setCameraInitialising(false);
    }
  }, [facingMode]);

  // Proactively check camera permission state on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions?.query) return;

    let active = true;
    let cleanupListener: (() => void) | undefined;

    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        if (!active) return;
        if (result.state === "denied") {
          setCameraError("NOT_ALLOWED");
        }

        const handleChange = () => {
          if (!active) return;
          if (result.state === "denied") {
            setCameraError("NOT_ALLOWED");
          } else if (result.state === "granted" || result.state === "prompt") {
            setCameraError((prev) => (prev === "NOT_ALLOWED" ? null : prev));
          }
        };

        result.addEventListener("change", handleChange);
        cleanupListener = () => {
          result.removeEventListener("change", handleChange);
        };
      } catch (err) {
        console.warn("Permissions API check for camera failed:", err);
      }
    };

    void checkPermission();
    return () => {
      active = false;
      if (cleanupListener) {
        cleanupListener();
      }
    };
  }, []);

  const switchCamera = useCallback(async () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setFacingMode(nextFacing);
    await startCamera(nextFacing);
  }, [facingMode, startCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setTorchOn(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    if (!caps.torch) return;
    const next = !torchOn;
    await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] } as unknown as MediaTrackConstraints);
    setTorchOn(next);
    haptic("light");
  }, [torchOn, haptic]);

  const toggleZoom = useCallback((delta: number) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
    if (!caps.zoom) return;
    const newZoom = Math.max(caps.zoom.min, Math.min(caps.zoom.max, zoom + delta));
    setZoom(newZoom);
    track.applyConstraints({ advanced: [{ zoom: newZoom } as MediaTrackConstraintSet] } as unknown as MediaTrackConstraints);
  }, [zoom]);

  const handleFileCaptureMobile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setStep("preview");
      stopCamera();
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

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
    haptic("medium");
    const nextPhotos = [...photos, dataUrl];
    setPhotos(nextPhotos);
    setActivePhotoIndex(nextPhotos.length - 1);
    setPhoto(dataUrl);
    if (nextPhotos.length >= MAX_PHOTOS) {
      setStep("preview");
      stopCamera();
    }
  }, [stopCamera, gps, ghostMode, haptic, photos]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          setGps(null);
          setShowManualCoords(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setShowManualCoords(true);
    }
  }, []);

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

  async function handleSubmit() {
    if (!incidentType) {
      showToast("Please select an incident type", "error");
      haptic("error");
      return;
    }
    if (!photo) {
      showToast("No photo captured", "error");
      haptic("error");
      return;
    }
    if (!gps) {
      showToast("Location not available. Enter coordinates or enable GPS.", "error");
      haptic("error");
      return;
    }

    setSubmitting(true);
    setFailedSubmission(null);
    setRetryCount(0);

    // Resolve userId before try so it's available in both success and error paths
    let userId: string | undefined;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    } catch {
      // User not logged in — submit anonymously.
    }

    try {
      showToast("Submitting report...", "info");

      // canvas.toDataURL() returns a raw pixel raster, so EXIF metadata is
      // already stripped at capture. Ghost Mode additionally omits GPS.
      const base64Image = dataUrlToBase64(photo);

      const payload: FailedPayload = {
        base64Image,
        latitude: gps?.lat,
        longitude: gps?.lng,
        user_id: userId,
        description: description || undefined,
        report_type: incidentType,
      };

      if (!navigator.onLine) {
        await queueReport(payload as unknown as Record<string, unknown>);
        haptic("success");
        showToast("You are offline. Report queued securely.", "info");
        setPhoto(null);
        setIncidentType("");
        setDescription("");
        setStep("camera");
        return;
      }

      await laravelPost("/reports", payload);

      haptic("success");

      // Show AI analysis animation before redirecting
      setShowAnalysis(true);
    } catch (err) {
      haptic("error");
      const message = err instanceof Error ? err.message : "Failed to submit report";
      showToast(message, "error");
      setFailedSubmission({
        error: message,
        payload: {
          base64Image: dataUrlToBase64(photo!),
          latitude: gps?.lat,
          longitude: gps?.lng,
          user_id: userId,
          description: description || undefined,
          report_type: incidentType,
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  // AI Analysis animation overlay
  if (showAnalysis) {
    return (
      <AIAnalysisAnimation
        photoUrl={photo || undefined}
        onComplete={() => {
          setShowAnalysis(false);
          if (ghostMode) {
            showToast("Metadata stripped for your safety. Report submitted!", "success");
          } else {
            showToast("Report submitted successfully!", "success");
          }
          setPhoto(null);
          setIncidentType("");
          setDescription("");
          setStep("camera");
          router.push(`/${locale}/dashboard`);
        }}
      />
    );
  }

  /* ───────────────────────────────────────────────────────────────────────
     Full-screen camera + preview — takes over the viewport.
     Refined shutter, haptics, Ghost Mode as a visible state.
     ─────────────────────────────────────────────────────────────────────── */
  if (step === "camera" || step === "preview") {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={() => {
              stopCamera();
              setShowManualCoords(false);
              router.push(`/${locale}/dashboard`);
            }}
            aria-label="Close camera"
            className="touch-target rounded-full bg-black/30 text-white"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            {isQuickMode && (
              <span className="flex items-center gap-1 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#facc15]/90 text-black" style={{ backdropFilter: "blur(10px)" }}>
                <Zap className="w-3 h-3" /> Quick
              </span>
            )}
            {/* Flip camera button */}
            <button
              onClick={() => { switchCamera(); haptic("light"); }}
              disabled={cameraInitialising}
              className="touch-target flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all bg-black/40 text-white/85 border border-white/20 disabled:opacity-40"
              style={{ backdropFilter: "blur(10px)" }}
              aria-label={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}
            >
              <RotateCcw className="w-4 h-4" />
              {facingMode === "environment" ? "Back" : "Front"}
            </button>
            {/* Torch toggle */}
            <button
              onClick={toggleTorch}
              aria-label={torchOn ? "Turn off flash" : "Turn on flash"}
              className="touch-target rounded-full bg-black/40 text-white/85 border border-white/20"
              style={{ backdropFilter: "blur(10px)" }}
            >
              {torchOn ? <Flashlight className="w-5 h-5 text-yellow-400" /> : <FlashlightOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { setGhostMode(!ghostMode); haptic("light"); }}
              aria-pressed={ghostMode}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all",
                ghostMode
                  ? "bg-[#facc15] text-black"
                  : "bg-black/40 text-white/85 border border-white/20",
              )}
              style={{ backdropFilter: "blur(10px)" }}
            >
              <Fingerprint className="w-4 h-4" />
              Ghost {ghostMode ? "On" : "Off"}
            </button>
          </div>
        </div>

        {/* Video or image */}
        {step === "camera" ? (
          cameraError === "NOT_ALLOWED" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold">Camera Access Blocked</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {getBrowserInstructions()}
                </p>
              </div>
              
              <label className="touch-target inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#3a7d54] text-white text-sm font-semibold active:scale-95 transition-transform cursor-pointer">
                <Camera className="w-4 h-4" />
                Upload Photo / Capture
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileCaptureMobile}
                  className="sr-only"
                />
              </label>
            </div>
          ) : cameraInitialising ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-500 font-medium">Initializing camera...</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Ghost Mode shield overlay */}
              <GhostShieldOverlay active={ghostMode} />
              {/* Rule-of-thirds guide */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
                backgroundSize: "33.33% 33.33%",
              }} />
              {/* Zoom controls */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                <button
                  onClick={() => toggleZoom(0.5)}
                  className="w-10 h-10 rounded-full bg-black/40 text-white/80 flex items-center justify-center border border-white/15 active:scale-95 transition-transform"
                  style={{ backdropFilter: "blur(8px)" }}
                  aria-label="Zoom in"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <span className="text-white/50 text-[10px] font-semibold text-center">{zoom.toFixed(1)}x</span>
                <button
                  onClick={() => toggleZoom(-0.5)}
                  className="w-10 h-10 rounded-full bg-black/40 text-white/80 flex items-center justify-center border border-white/15 active:scale-95 transition-transform"
                  style={{ backdropFilter: "blur(8px)" }}
                  aria-label="Zoom out"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </>
          )
        ) : (
          <img src={photo!} alt="Captured evidence preview" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-16 flex justify-center items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {step === "camera" ? (
            cameraError !== "NOT_ALLOWED" && (
              <div className="flex items-center gap-6">
                {/* Gallery picker */}
                <label className="flex flex-col items-center gap-1 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white/70 active:scale-95 transition-transform border border-white/10" style={{ backdropFilter: "blur(8px)" }}>
                    {photos.length > 0 ? (
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <img src={photos[photos.length - 1]} alt="Last capture" className="w-full h-full object-cover" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green text-white text-[10px] font-bold flex items-center justify-center">{photos.length}</span>
                      </div>
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-white/60 text-[10px] font-semibold">Gallery</span>
                  <input type="file" accept="image/*" onChange={handleFileCaptureMobile} className="sr-only" />
                </label>

                {/* Shutter button */}
                <button
                  onClick={capturePhoto}
                  aria-label="Capture photo"
                  className="w-[76px] h-[76px] rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <div className="w-[58px] h-[58px] rounded-full bg-white" />
                </button>

                {/* Photo count */}
                <div className="w-12 h-12 flex flex-col items-center justify-center">
                  {photos.length > 0 ? (
                    <span className="text-white/60 text-[10px] font-semibold">{photos.length}/{MAX_PHOTOS}</span>
                  ) : (
                    <span className="text-white/30 text-[10px]">0/{MAX_PHOTOS}</span>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex w-full px-12 justify-between items-center">
              <button
                onClick={() => { setPhoto(null); setStep("camera"); setShowManualCoords(false); haptic("light"); }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white active:scale-95 transition-transform border border-white/10" style={{ backdropFilter: "blur(10px)" }}>
                  <RefreshCw className="w-6 h-6" />
                </div>
                <span style={{ fontFamily: "var(--font-body)" }} className="text-white/85 text-[11px] font-semibold">Retake</span>
              </button>

              <button
                onClick={() => { setStep("form"); haptic("light"); }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center text-white active:scale-95 transition-transform shadow-[0_0_24px_rgba(46,230,200,0.55)]">
                  <Check className="w-8 h-8" />
                </div>
                <span style={{ fontFamily: "var(--font-body)" }} className="text-green font-bold text-[11px]">Use photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const retrySubmission = useCallback(async () => {
    if (!failedSubmission) return;
    if (retryCount >= MAX_RETRIES) return;

    const attempt = retryCount + 1;
    setSubmitting(true);
    setRetryCount(attempt);
    try {
      await laravelPost("/reports", failedSubmission.payload);
      haptic("success");
      showToast("Report submitted successfully!", "success");
      setFailedSubmission(null);
      setRetryCount(0);
      setPhoto(null);
      setIncidentType("");
      setDescription("");
      setStep("camera");
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      haptic("error");
      const msg = err instanceof Error ? err.message : "Request failed";
      const remaining = MAX_RETRIES - attempt;
      if (remaining > 0) {
        showToast(`Attempt ${attempt} of ${MAX_RETRIES} failed. ${remaining} retr${remaining > 1 ? "ies" : "y"} left.`, "error");
      } else {
        showToast(`Attempt ${attempt} of ${MAX_RETRIES} — max retries reached. Please try again later.`, "error");
      }
      setFailedSubmission((prev) =>
        prev
          ? {
              ...prev,
              error: `${msg} (attempt ${attempt}/${MAX_RETRIES})`,
              retriesExhausted: attempt >= MAX_RETRIES,
            }
          : null,
      );
    } finally {
      setSubmitting(false);
    }
  }, [failedSubmission, retryCount, locale, router]);

  const RetryBanner = () =>
    failedSubmission ? (
      <div
        className="ios-grouped-list"
        style={{
          padding: "14px",
          borderRadius: 16,
          border: "1px solid color-mix(in oklab, var(--red) 35%, transparent)",
          background: "color-mix(in oklab, var(--red) 6%, var(--panel))",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle
            style={{ width: 18, height: 18, color: "var(--red)", flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Report failed to send
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--muted)",
                margin: "4px 0 0",
                lineHeight: 1.4,
              }}
            >
              {failedSubmission.error}
            </p>
          </div>
          <button
            onClick={() => { setFailedSubmission(null); setRetryCount(0); }}
            aria-label="Dismiss retry"
            className="touch-target rounded-full"
            style={{
              background: "color-mix(in oklab, var(--ink) 8%, transparent)",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 14, height: 14, color: "var(--muted)" }} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setFailedSubmission(null); setRetryCount(0); }}
            className="touch-target"
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            Dismiss
          </button>            <button
            onClick={retrySubmission}
            disabled={submitting || autoRetrying || failedSubmission.retriesExhausted}
            className="touch-target"
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: "none",
              background: failedSubmission.retriesExhausted ? "color-mix(in oklab, var(--ink) 20%, transparent)" : "var(--red)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 700,
              color: failedSubmission.retriesExhausted ? "var(--muted-subtle)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: submitting ? 0.5 : 1,
              cursor: failedSubmission.retriesExhausted ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : failedSubmission.retriesExhausted ? (
              <X style={{ width: 14, height: 14 }} />
            ) : (
              <RefreshCw style={{ width: 14, height: 14 }} />
            )}
            {autoRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {failedSubmission.retriesExhausted ? "Max retries" : autoRetrying ? "Auto-retrying..." : `Retry ${retryCount > 0 ? `(${retryCount}/${MAX_RETRIES})` : ""}`}
          </button>
        </div>
      </div>
    ) : null;

  /* ───────────────────────────────────────────────────────────────────────
     Shared form pieces — Ghost Mode readout + submit button.
     ─────────────────────────────────────────────────────────────────────── */
  const GhostToggle = () => (
    <div
      className="ios-grouped-list"
      style={{
        padding: "14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        borderColor: ghostMode ? "color-mix(in oklab, var(--secondary) 30%, transparent)" : "var(--border)",
        background: ghostMode ? "color-mix(in oklab, var(--secondary) 6%, var(--panel))" : "var(--panel)",
      }}
    >
      <button
        onClick={() => { setGhostMode(!ghostMode); haptic("light"); }}
        aria-pressed={ghostMode}
        aria-label="Toggle Ghost Mode"
        className={cn("relative shrink-0 rounded-full transition-colors")}
        style={{ width: 44, height: 26, background: ghostMode ? "var(--secondary)" : "color-mix(in oklab, var(--ink) 20%, transparent)" }}
      >
        <div
          className={cn("absolute top-1 left-1 w-[18px] h-[18px] rounded-full bg-white transition-transform")}
          style={{ transform: ghostMode ? "translateX(18px)" : "translateX(0)" }}
        />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Fingerprint style={{ width: 15, height: 15, color: ghostMode ? "var(--secondary)" : "var(--ink)" }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Ghost Mode</p>
          {ghostMode && (
            <span style={{ fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "color-mix(in oklab, var(--secondary) 16%, transparent)", color: "var(--secondary)" }}>
              EXIF STRIPPED
            </span>
          )}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted)", margin: "5px 0 0", lineHeight: 1.5 }}>
          {ghostMode
            ? "Your identity and location are stripped from this report before it is transmitted."
            : "Strip location and device metadata to protect your identity on sensitive reports."}
        </p>
      </div>
    </div>
  );

  const SubmitButton = ({ label, disabled }: { label: string; disabled?: boolean }) => (
    <Button
      onClick={handleSubmit}
      disabled={disabled || submitting}
      variant="primary"
      className={cn("w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]")}
      style={{ height: 54, borderRadius: 14, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, opacity: (disabled || submitting) ? 0.5 : 1, background: ghostMode ? "#f59e0b" : undefined }}
    >
      {submitting ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {ghostMode ? <ShieldCheck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {label}
        </>
      )}
    </Button>
  );

  /* ── Quick Mode form — minimal ─────────────────────────────────────────── */
  if (isQuickMode) {
    return (
      <div className="p-5 space-y-5 pb-32">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("preview")} aria-label="Back to preview" className="touch-target -ml-2 rounded-full text-ink">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>Quick report</h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", margin: "3px 0 0" }}>
              GPS {gps ? "detected" : showManualCoords ? "enter manual" : "pending"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#facc15]/20 text-[#b8860b] border border-[#facc15]/30">
            <Zap className="w-3 h-3" /> Quick
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full" style={{ maxHeight: 240 }}>
          <img src={photo!} alt="Captured evidence" className="w-full h-full object-cover" />
          <button
            onClick={() => setStep("camera")}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-semibold uppercase"
            style={{ backdropFilter: "blur(8px)" }}
          >
            Retake
          </button>
          {gps && !ghostMode && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/55 text-white" style={{ backdropFilter: "blur(8px)" }}>
              <MapPin className="w-3 h-3" />
              <span style={{ fontFamily: "var(--font-data)", fontSize: 10 }}>{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>
            </div>
          )}
        </div>

        {/* Incident type selector */}
        <div>
          <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>Incident type</label>
          <button
            onClick={() => { setTypeSheetOpen(true); haptic("light"); }}
            className="ios-list-row w-full"
            style={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--panel)", minHeight: 56 }}
          >
            <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-body)", fontSize: 15, color: incidentType ? "var(--ink)" : "var(--muted-subtle)" }}>
              {INCIDENT_TYPES.find(t => t.value === incidentType)?.label || "Select classification"}
            </span>
            {!gps && (
              <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--red)", marginLeft: 8 }}>
                GPS pending
              </span>
            )}
            <ChevronDown style={{ width: 18, height: 18, color: "var(--muted)" }} />
          </button>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "color-mix(in oklab, var(--ink) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}>
            <div className="w-2 h-2 rounded-full bg-ink/30" />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: 0 }}>
              Offline — reports will queue until connection returns.
            </p>
          </div>
        )}
        <RetryBanner />
        <GhostToggle />
        <SubmitButton label="Submit report" disabled={!incidentType || !gps} />
      </div>
    );
  }

  /* ── Full form — standard report flow ──────────────────────────────────── */
  return (
    <div className="p-5 space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep("preview")} aria-label="Back to preview" className="touch-target -ml-2 rounded-full text-ink">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>Report details</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", margin: "3px 0 0" }}>Review and submit evidence</p>
        </div>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="ios-section-label" style={{ margin: 0, paddingLeft: 2 }}>Evidence photos ({photos.length}/{MAX_PHOTOS})</label>
          {photos.length < MAX_PHOTOS && (
            <button onClick={() => setStep("camera")} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
              <ImagePlus className="w-3.5 h-3.5" /> Add more
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {photos.map((p, i) => (
            <div key={i} className="relative shrink-0" style={{ width: 100, height: 100 }}>
              <img src={p} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover rounded-xl" style={{ border: i === activePhotoIndex ? "2px solid var(--accent)" : "2px solid transparent" }} />
              <button
                onClick={() => {
                  const next = photos.filter((_, idx) => idx !== i);
                  setPhotos(next);
                  if (activePhotoIndex >= next.length) setActivePhotoIndex(Math.max(0, next.length - 1));
                  setPhoto(next[activePhotoIndex] || null);
                  haptic("light");
                }}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                style={{ backdropFilter: "blur(4px)" }}
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => setStep("camera")}
              className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-dashed"
              style={{ width: 100, height: 100, borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <ImagePlus className="w-5 h-5 mb-1" />
              <span style={{ fontSize: 10 }}>Add</span>
            </button>
          )}
        </div>
        {/* Main preview */}
        <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full mt-2" style={{ maxHeight: 260 }}>
          <img src={photo!} alt="Captured evidence" className="w-full h-full object-cover" />
          <button
            onClick={() => setStep("camera")}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-semibold uppercase"
            style={{ backdropFilter: "blur(8px)" }}
          >
            Retake
          </button>
        </div>
      </div>

      {/* Map */}
      <div>
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>Location</label>
        <GeoTagMap
          lat={gps?.lat ?? null}
          lng={gps?.lng ?? null}
          onLocationChange={(lat, lng) => setGps({ lat, lng })}
          height="220px"
        />
      </div>

      {/* Incident type — opens a bottom sheet, not a dropdown */}
      <div>
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>Incident type</label>
        <button
          onClick={() => { setTypeSheetOpen(true); haptic("light"); }}
          className="ios-list-row w-full"
          style={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--panel)", minHeight: 56 }}
        >
          <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-body)", fontSize: 15, color: incidentType ? "var(--ink)" : "var(--muted-subtle)" }}>
            {INCIDENT_TYPES.find(t => t.value === incidentType)?.label || "Select classification"}
          </span>
          <ChevronDown style={{ width: 18, height: 18, color: "var(--muted)" }} />
        </button>
      </div>

      <BottomSheet open={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="Select incident type">
        <div className="ios-grouped-list">
          {INCIDENT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setIncidentType(value); setTypeSheetOpen(false); haptic("light"); }}
              className="ios-list-row"
              style={{ width: "100%", justifyContent: "space-between", background: incidentType === value ? "color-mix(in oklab, var(--accent) 6%, transparent)" : undefined }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{label}</span>
              {incidentType === value && <Check style={{ width: 18, height: 18, color: "var(--accent)" }} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Manual GPS coordinates fallback */}
      {showManualCoords && (
        <div>
          <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>GPS unavailable — enter coordinates</label>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="Latitude (e.g. 14.5833)"
              value={manualLat}
              onChange={(e) => { setManualLat(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val) && val >= -90 && val <= 90) setGps(prev => ({ lat: val, lng: prev?.lng ?? 0 })); }}
              aria-label="Latitude coordinate"
              style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "var(--panel)", border: "1px solid var(--border)", fontFamily: "var(--font-data)", fontSize: 14, color: "var(--ink)", outline: "none" }}
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="Longitude (e.g. 120.9833)"
              value={manualLng}
              onChange={(e) => { setManualLng(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val) && val >= -180 && val <= 180) setGps(prev => ({ lat: prev?.lat ?? 0, lng: val })); }}
              aria-label="Longitude coordinate"
              style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "var(--panel)", border: "1px solid var(--border)", fontFamily: "var(--font-data)", fontSize: 14, color: "var(--ink)", outline: "none" }}
            />
          </div>
        </div>
      )}

      {/* Description + voice */}
      <div>
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>Description (optional)</label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => { if (e.target.value.length <= 5000) setDescription(e.target.value); }}
            placeholder="Add any extra details about the location or situation..."
            rows={4}
            maxLength={5000}
            style={{
              width: "100%", padding: "14px 52px 14px 16px", borderRadius: 16,
              background: "var(--panel)", border: "1px solid var(--border)",
              fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)",
              resize: "none", outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "color-mix(in oklab, var(--accent) 45%, transparent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          {voiceSupported ? (
            <button
              type="button"
              onClick={() => { toggleListening(); haptic("light"); }}
              aria-label={isListening ? "Stop listening" : "Speak description"}
              className={cn("absolute bottom-3 right-3 rounded-full transition-all")}
              style={{
                background: isListening ? "var(--red)" : "color-mix(in oklab, var(--ink) 5%, transparent)",
                color: isListening ? "#fff" : "var(--muted)",
                width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          ) : (
            <div className="absolute bottom-3 right-3 rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: "color-mix(in oklab, var(--ink) 5%, transparent)", color: "var(--muted-subtle)" }} title="Voice input not supported">
              <MicOff className="w-5 h-5" />
            </div>
          )}
        </div>
        {isListening && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--red)", margin: "8px 0 0 2px", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--red)] animate-pulse" />
            Listening...
          </p>
        )}
        {voiceError && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--red)", margin: "8px 0 0 2px" }}>{voiceError}</p>}
        <p style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--muted-subtle)", margin: "6px 0 0 2px", textAlign: "right" }}>
          {description.length}/5000
        </p>
      </div>
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "color-mix(in oklab, var(--ink) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}>
            <div className="w-2 h-2 rounded-full bg-ink/30" />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: 0 }}>
              Offline — reports will queue until connection returns.
            </p>
          </div>
        )}
        <RetryBanner />
        <GhostToggle />
        <SubmitButton label="Submit evidence" disabled={!incidentType || !gps} />
      </div>
  );
}
