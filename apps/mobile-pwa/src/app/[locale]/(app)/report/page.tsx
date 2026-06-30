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
} from "lucide-react";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { cn, laravelPost, showToast, Button, useOnnxInference } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { captureWithStamp, dataUrlToBase64 } from "@/lib/camera-stamp";
import { queueReport } from "@likaslens/shared";
import { stripExif } from "@/lib/exif-stripper";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useHaptics } from "@/hooks/use-haptics";
import { BottomSheet } from "@/components/native/bottom-sheet";
import { useTranslations } from "next-intl";

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



type Step = "camera" | "preview" | "form";

const getBrowserInstructions = (t: (key: string) => string): string => {
  if (typeof window === "undefined") return "";
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(ua);
  if (isIOS) {
    return t("cameraBlockedIos");
  }
  return t("cameraBlockedAndroid");
};

export default function ReportPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const INCIDENT_TYPES: { value: string; label: string }[] = [
    { value: "waste_dumping", label: t("illegalDumping") },
    { value: "water_pollution", label: t("waterPollution") },
    { value: "air_pollution", label: t("airPollution") },
    { value: "illegal_logging", label: t("deforestation") },
    { value: "wildlife_poaching", label: t("wildlifeThreat") },
    { value: "other", label: t("other") },
  ];
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
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [cameraInitialising, setCameraInitialising] = useState(false);
  const MAX_RETRIES = 3;

  const [failedSubmission, setFailedSubmission] = useState<FailedSubmission | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [autoRetrying, setAutoRetrying] = useState(false);

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

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<"NOT_ALLOWED" | "NOT_FOUND" | "UNKNOWN" | null>(null);

  // Online / offline detection only — no auto-flush or auto-retry.
  // Sync is manual via the /offline-queue tab.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast(t("connectionRestored"), "success");
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(t("connectionLostQueue"), "error");
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
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: targetFacing } },
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
        showToast(t("cameraAccessDenied"), "error");
      }
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
  }, []);

  const handleFileCaptureMobile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const cleaned = await stripExif(dataUrl);
        setPhoto(cleaned);
      } catch {
        setPhoto(dataUrl);
      }
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
    setPhoto(dataUrl);
    setStep("preview");
    stopCamera();
  }, [stopCamera, gps, ghostMode, haptic]);

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
      showToast(t("selectIncidentType"), "error");
      haptic("error");
      return;
    }
    if (!photo) {
      showToast(t("noPhotoCaptured"), "error");
      haptic("error");
      return;
    }
    if (!gps) {
      showToast(t("locationUnavailable"), "error");
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
      // canvas.toDataURL() returns a raw pixel raster, so EXIF metadata is
      // already stripped at capture. Ghost Mode additionally omits GPS.
      const base64Image = dataUrlToBase64(photo);

      // On-device triage when offline (skip if Ghost Mode)
      if (!ghostMode && !navigator.onLine && onnx.isReady) {
        try {
          const onnxResult = await onnx.infer(base64Image);
          if (onnxResult.has_environmental_concern) {
            showToast(
              `${t("onDeviceAiDetected")}: ${onnxResult.environmental_indicators.join(", ")}. ${t("submittingOffline")}.`,
              "info"
            );
          }
        } catch {
          // Triage failure shouldn't block submission
        }
      }

      showToast(t("submittingReport"), "info");

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
        showToast(t("offlineQueued"), "info");
        setPhoto(null);
        setIncidentType("");
        setDescription("");
        setStep("camera");
        return;
      }

      await laravelPost("/reports", payload);

      haptic("success");

      if (ghostMode) {
        showToast(t("ghostSubmitted"), "success");
      } else {
        showToast(t("reportSubmitted"), "success");
      }

      setPhoto(null);
      setIncidentType("");
      setDescription("");
      setStep("camera");
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      haptic("error");
      const message = err instanceof Error ? err.message : t("failedToSubmit");
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
            aria-label={t("closeCamera")}
            className="touch-target rounded-full bg-black/30 text-white"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            {isQuickMode && (
              <span className="flex items-center gap-1 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#facc15]/90 text-black" style={{ backdropFilter: "blur(10px)" }}>
                <Zap className="w-3 h-3" /> {t("quick")}
              </span>
            )}
            {/* Flip camera button */}
            <button
              onClick={() => { switchCamera(); haptic("light"); }}
              disabled={cameraInitialising}
              className="touch-target flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all bg-black/40 text-white/85 border border-white/20 disabled:opacity-40"
              style={{ backdropFilter: "blur(10px)" }}
              aria-label={t("switchCamera")}
            >
              <RotateCcw className="w-4 h-4" />
              {facingMode === "environment" ? t("back") : t("front")}
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
              {ghostMode ? t("ghostOn") : t("ghostOff")}
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
                <h3 className="text-lg font-bold">{t("cameraAccessBlocked")}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {getBrowserInstructions(t)}
                </p>
              </div>
              
              <label className="touch-target inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#3a7d54] text-white text-sm font-semibold active:scale-95 transition-transform cursor-pointer">
                <Camera className="w-4 h-4" />
                {t("uploadOrCapture")}
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
              <p className="text-sm text-zinc-500 font-medium">{t("initializingCamera")}</p>
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
          <img src={photo!} alt={t("capturedEvidencePreview")} className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-16 flex justify-center items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {step === "camera" ? (
            cameraError !== "NOT_ALLOWED" && (
              <button
                onClick={capturePhoto}
                aria-label={t("capturePhoto")}
                className="w-[76px] h-[76px] rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-[58px] h-[58px] rounded-full bg-white" />
              </button>
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
                <span style={{ fontFamily: "var(--font-body)" }} className="text-white/85 text-[11px] font-semibold">{t("retake")}</span>
              </button>

              <button
                onClick={() => { setStep("form"); haptic("light"); }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center text-white active:scale-95 transition-transform shadow-[0_0_24px_rgba(46,230,200,0.55)]">
                  <Check className="w-8 h-8" />
                </div>
                <span style={{ fontFamily: "var(--font-body)" }} className="text-green font-bold text-[11px]">{t("usePhoto")}</span>
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
      showToast(t("reportSubmittedSuccess"), "success");
      setFailedSubmission(null);
      setRetryCount(0);
      setPhoto(null);
      setIncidentType("");
      setDescription("");
      setStep("camera");
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      haptic("error");
      const msg = err instanceof Error ? err.message : t("requestFailed");
      const remaining = MAX_RETRIES - attempt;
      if (remaining > 0) {
        showToast(`${t("attempt")} ${attempt} / ${MAX_RETRIES} — ${remaining} ${remaining > 1 ? t("retriesLeft") : t("retryLeft")}`, "error");
      } else {
        showToast(`${t("attempt")} ${attempt} / ${MAX_RETRIES} — ${t("maxRetriesReached")}`, "error");
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
            aria-label={t("dismissRetry")}
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
            {t("dismiss")}
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
            {failedSubmission.retriesExhausted ? t("maxRetries") : autoRetrying ? t("autoRetrying") : `${t("retry")}${retryCount > 0 ? ` (${retryCount}/${MAX_RETRIES})` : ""}`}
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
        aria-label={t("toggleGhostMode")}
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
              {t("exifStripped")}
            </span>
          )}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted)", margin: "5px 0 0", lineHeight: 1.5 }}>
          {ghostMode
            ? t("ghostModeActiveDesc")
            : t("ghostModeInactiveDesc")}
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
          <button onClick={() => setStep("preview")} aria-label={t("backToPreview")} className="touch-target -ml-2 rounded-full text-ink">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>{t("quickReport")}</h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", margin: "3px 0 0" }}>
              {gps ? t("gpsDetected") : showManualCoords ? t("gpsManual") : t("gpsPending")}
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#facc15]/20 text-[#b8860b] border border-[#facc15]/30">
            <Zap className="w-3 h-3" /> Quick
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full" style={{ maxHeight: 240 }}>
          <img src={photo!} alt={t("capturedEvidence")} className="w-full h-full object-cover" />
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
          <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>{t("incidentType")}</label>
          <button
            onClick={() => { setTypeSheetOpen(true); haptic("light"); }}
            className="ios-list-row w-full"
            style={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--panel)", minHeight: 56 }}
          >
            <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-body)", fontSize: 15, color: incidentType ? "var(--ink)" : "var(--muted-subtle)" }}>
              {INCIDENT_TYPES.find(t => t.value === incidentType)?.label || t("selectClassification")}
            </span>
            {!gps && (
              <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "var(--red)", marginLeft: 8 }}>
                {t("gpsPending")}
              </span>
            )}
            <Camera style={{ width: 18, height: 18, color: "var(--muted)" }} />
          </button>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "color-mix(in oklab, var(--ink) 6%, transparent)", border: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}>
            <div className="w-2 h-2 rounded-full bg-ink/30" />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: 0 }}>
              {t("offlineNotice")}
            </p>
          </div>
        )}
        <RetryBanner />
        <GhostToggle />
        <SubmitButton label={t("submitReport")} disabled={!incidentType || !gps} />
      </div>
    );
  }

  /* ── Full form — standard report flow ──────────────────────────────────── */
  return (
    <div className="p-5 space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep("preview")} aria-label={t("backToPreview")} className="touch-target -ml-2 rounded-full text-ink">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0 }}>{t("reportDetails")}</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", margin: "3px 0 0" }}>{t("reviewSubmitEvidence")}</p>
        </div>
      </div>

      {/* Photo thumbnail */}
      <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/3] w-full" style={{ maxHeight: 260 }}>
        <img src={photo!} alt={t("capturedEvidencePreview")} className="w-full h-full object-cover" />
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
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>{t("location")}</label>
        <GeoTagMap
          lat={gps?.lat ?? null}
          lng={gps?.lng ?? null}
          onLocationChange={(lat, lng) => setGps({ lat, lng })}
          height="220px"
        />
      </div>

      {/* Incident type — opens a bottom sheet, not a dropdown */}
      <div>
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>{t("incidentType")}</label>
        <button
          onClick={() => { setTypeSheetOpen(true); haptic("light"); }}
          className="ios-list-row w-full"
          style={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--panel)", minHeight: 56 }}
        >
          <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-body)", fontSize: 15, color: incidentType ? "var(--ink)" : "var(--muted-subtle)" }}>
            {INCIDENT_TYPES.find(t => t.value === incidentType)?.label || t("selectClassification")}
          </span>
          <Camera style={{ width: 18, height: 18, color: "var(--muted)" }} />
        </button>
      </div>

      <BottomSheet open={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title={t("selectIncidentType")}>
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
          <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>{t("gpsUnavailable")}</label>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder={t("latitudePlaceholder")}
              value={manualLat}
              onChange={(e) => { setManualLat(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val) && val >= -90 && val <= 90) setGps(prev => ({ lat: val, lng: prev?.lng ?? 0 })); }}
              aria-label={t("latitudeAria")}
              style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "var(--panel)", border: "1px solid var(--border)", fontFamily: "var(--font-data)", fontSize: 14, color: "var(--ink)", outline: "none" }}
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder={t("longitudePlaceholder")}
              value={manualLng}
              onChange={(e) => { setManualLng(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val) && val >= -180 && val <= 180) setGps(prev => ({ lat: prev?.lat ?? 0, lng: val })); }}
              aria-label={t("longitudeAria")}
              style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "var(--panel)", border: "1px solid var(--border)", fontFamily: "var(--font-data)", fontSize: 14, color: "var(--ink)", outline: "none" }}
            />
          </div>
        </div>
      )}

      {/* Description + voice */}
      <div>
        <label className="ios-section-label" style={{ marginBottom: 8, display: "block", paddingLeft: 2 }}>{t("descriptionOptional")}</label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => { if (e.target.value.length <= 5000) setDescription(e.target.value); }}
            placeholder={t("descriptionPlaceholder")}
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
              aria-label={isListening ? t("stopListening") : t("speakDescription")}
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
            <div className="absolute bottom-3 right-3 rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: "color-mix(in oklab, var(--ink) 5%, transparent)", color: "var(--muted-subtle)" }} title={t("voiceNotSupported")}>
              <MicOff className="w-5 h-5" />
            </div>
          )}
        </div>
        {isListening && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--red)", margin: "8px 0 0 2px", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--red)] animate-pulse" />
            {t("listening")}
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
              {t("offlineNotice")}
            </p>
          </div>
        )}
        <RetryBanner />
        <GhostToggle />
        <SubmitButton label={t("submitEvidence")} disabled={!incidentType || !gps} />
      </div>
  );
}
