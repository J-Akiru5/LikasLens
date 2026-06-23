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
} from "lucide-react";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { cn, laravelPost, showToast, Button, useOnnxInference } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { captureWithStamp, dataUrlToBase64 } from "@/lib/camera-stamp";
import { stripExif } from "@/lib/exif-stripper";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useHaptics } from "@/hooks/use-haptics";
import { BottomSheet } from "@/components/native/bottom-sheet";

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
  const [incidentType, setIncidentType] = useState(isQuickMode ? "Illegal Dumping" : "");
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const haptic = useHaptics();

  // On-device inference for offline triage (lazy init)
  const onnx = useOnnxInference({ autoInit: false });

  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported: voiceSupported,
    toggleListening,
    setTranscript,
  } = useVoiceInput();

  const [cameraError, setCameraError] = useState<"NOT_ALLOWED" | "NOT_FOUND" | "UNKNOWN" | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
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
        const errName = (fallbackErr as Error)?.name;
        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          setCameraError("NOT_ALLOWED");
        } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
          setCameraError("NOT_FOUND");
        } else {
          setCameraError("UNKNOWN");
        }
        showToast("Camera access denied or unavailable", "error");
      }
    }
  }, []);

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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

<<<<<<< HEAD
  const stripExif = useCallback(async (base64: string) => {
    if (!base64) return base64;
    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(base64);
          ctx.drawImage(img, 0, 0);
          const cleaned = canvas.toDataURL();
          resolve(cleaned);
        } catch {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }, []);

  const handleFileCaptureMobile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
=======
  const handleFileCaptureMobile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
>>>>>>> origin/main
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
<<<<<<< HEAD
      const cleaned = await stripExif(dataUrl);
      setPhoto(cleaned);
=======
      try {
        const cleaned = await stripExif(dataUrl);
        setPhoto(cleaned);
      } catch {
        setPhoto(dataUrl);
      }
>>>>>>> origin/main
      setStep("preview");
      stopCamera();
    };
    reader.readAsDataURL(file);
  }, [stopCamera, stripExif]);

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
    setPhoto(dataUrl);
    setStep("preview");
    stopCamera();
  }, [stopCamera, gps, ghostMode, haptic]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGps(null),
      );
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

    setSubmitting(true);
    try {
      // canvas.toDataURL() returns a raw pixel raster, so EXIF metadata is
      // already stripped at capture. Ghost Mode additionally omits GPS.
      const base64Image = dataUrlToBase64(photo);

      // On-device triage when offline (skip if Ghost Mode)
      if (!ghostMode && !navigator.onLine && onnx.isReady) {
        try {
          const onnxResult = await onnx.infer(base64Image);
          if (onnxResult.has_environmental_concern) {
            showToast(
              `On-device AI detected: ${onnxResult.environmental_indicators.join(", ")}. Submitting offline.`,
              "info"
            );
          }
        } catch {
          // Triage failure shouldn't block submission
        }
      }

      showToast("Submitting report...", "info");

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

      haptic("success");

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
    } catch (err) {
      haptic("error");
      const message = err instanceof Error ? err.message : "Failed to submit report";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
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
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Rule-of-thirds guide */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
                backgroundSize: "33.33% 33.33%",
              }} />
            </>
          )
        ) : (
          <img src={photo!} alt="Captured evidence preview" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-16 flex justify-center items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {step === "camera" ? (
            cameraError !== "NOT_ALLOWED" && (
              <button
                onClick={capturePhoto}
                aria-label="Capture photo"
                className="w-[76px] h-[76px] rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-[58px] h-[58px] rounded-full bg-white" />
              </button>
            )
          ) : (
            <div className="flex w-full px-12 justify-between items-center">
              <button
                onClick={() => { setPhoto(null); setStep("camera"); haptic("light"); }}
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
      style={{ height: 54, borderRadius: 14, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, opacity: (disabled || submitting) ? 0.5 : 1 }}
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
              GPS {gps ? "detected" : "pending"}
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
              {incidentType || "Select classification"}
            </span>
            <Camera style={{ width: 18, height: 18, color: "var(--muted)" }} />
          </button>
        </div>

        <GhostToggle />
        <SubmitButton label="Submit report" disabled={!incidentType || !photo} />
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

      {/* Photo thumbnail */}
      <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full" style={{ maxHeight: 260 }}>
        <img src={photo!} alt="Captured evidence" className="w-full h-full object-cover" />
        <button
          onClick={() => setStep("camera")}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-semibold uppercase"
          style={{ backdropFilter: "blur(8px)" }}
        >
          Retake photo
        </button>
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
            {incidentType || "Select classification"}
          </span>
          <Camera style={{ width: 18, height: 18, color: "var(--muted)" }} />
        </button>
      </div>

      <BottomSheet open={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="Select incident type">
        <div className="ios-grouped-list">
          {INCIDENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => { setIncidentType(type); setTypeSheetOpen(false); haptic("light"); }}
              className="ios-list-row"
              style={{ width: "100%", justifyContent: "space-between", background: incidentType === type ? "color-mix(in oklab, var(--accent) 6%, transparent)" : undefined }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{type}</span>
              {incidentType === type && <Check style={{ width: 18, height: 18, color: "var(--accent)" }} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Description + voice */}
      <div>
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>Description (optional)</label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any extra details about the location or situation..."
            rows={4}
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
      </div>

      <GhostToggle />
      <SubmitButton label="Submit evidence" disabled={!incidentType} />
    </div>
  );
}
