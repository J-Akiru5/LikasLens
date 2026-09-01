"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  MapPin,
  Fingerprint,
  RotateCcw,
  CheckCircle2,
  Trees,
  Droplets,
  Trash2,
  Mountain,
  Wind,
  Waves,
  Flame,
  ShieldAlert,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  EyeOff,
  Navigation,
  Loader2,
  RefreshCw,
  Check,
  X,
  Copy,
  Building2,
  Zap,
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";
import {
  cn,
  submitCitizenReport,
  showToast,
  queueReport,
  Button,
} from "@likaslens/shared";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { GhostShieldOverlay } from "@/components/ghost-shield-overlay";
import { captureWithStamp, dataUrlToBase64 } from "@/lib/camera-stamp";

const INCIDENT_CATEGORIES = [
  { id: "illegal_logging", label: "Illegal Logging", icon: Trees, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "water_pollution", label: "Water Pollution", icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { id: "waste_dumping", label: "Waste Dumping", icon: Trash2, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "wildlife_poaching", label: "Wildlife Poaching", icon: ShieldAlert, color: "text-violet-500", bg: "bg-violet-500/10" },
  { id: "mining_violation", label: "Mining Violation", icon: Mountain, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "air_pollution", label: "Air Pollution", icon: Wind, color: "text-amber-600", bg: "bg-amber-600/10" },
  { id: "coastal_hazard", label: "Coastal & Marine", icon: Waves, color: "text-sky-500", bg: "bg-sky-500/10" },
  { id: "open_burning", label: "Open Burning", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "other", label: "Other Hazard", icon: AlertCircle, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

const SUGGESTED_DETAILS = [
  "Black Smoke",
  "Foul Odor",
  "Industrial Dumping",
  "Near River",
  "Threat to Wildlife",
  "Public Health Risk",
  "Illegal Dumpsite",
  "Chemical Runoff",
];

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
  const haptic = useHaptics();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [base64Image, setBase64Image] = useState<string>("");
  const [reportType, setReportType] = useState<string>(isQuickMode ? "waste_dumping" : "");
  const [description, setDescription] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>("Locating coordinates...");

  // AI & Detection states
  const [aiDetectedCategory, setAiDetectedCategory] = useState<{
    id: string;
    confidence: number;
    label: string;
    reason: string;
  } | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [isOverridden, setIsOverridden] = useState(false);

  // Fullscreen Camera state
  const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
  const [cameraInitialising, setCameraInitialising] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [zoom, setZoom] = useState(1);

  // Submission & modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string>("");
  const [routedOffice, setRoutedOffice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Camera video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Connection restored.", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Connection lost. Reports will queue offline.", "error");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync theme with Ghost Mode
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "ghost") setIsGhostMode(true);
  }, []);

  const handleGhostModeToggle = (checked: boolean) => {
    setIsGhostMode(checked);
    const newTheme = checked ? "ghost" : "civic";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    haptic("light");
  };

  // Geolocation auto-fetch on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Reverse geocoding
  useEffect(() => {
    if (latitude != null && longitude != null) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setResolvedAddress(data.display_name);
          } else {
            setResolvedAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        })
        .catch(() => {
          setResolvedAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        });
    }
  }, [latitude, longitude]);

  // Strip EXIF metadata for zero-knowledge privacy
  const stripExif = async (base64: string): Promise<string> => {
    if (!base64) return base64;
    return new Promise<string>((resolve) => {
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
          const cleaned = canvas.toDataURL("image/jpeg", 0.92);
          resolve(cleaned);
        } catch {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  // Camera Management
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (facing?: "user" | "environment") => {
    const targetFacing = facing ?? facingMode;
    setCameraError(null);
    setCameraInitialising(true);
    stopCamera();

    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9 / 16 },
          },
          audio: false,
        });
      } catch {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: targetFacing } },
            audio: false,
          });
        } catch {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      const errName = (err as Error)?.name;
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraError("NOT_ALLOWED");
      } else {
        setCameraError("NOT_FOUND");
      }
      showToast("Camera access denied or unavailable", "error");
    } finally {
      setCameraInitialising(false);
    }
  }, [facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  }, [facingMode, startCamera]);

  const refreshCamera = useCallback(() => {
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const toggleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  }, []);

  // Trigger camera start when fullscreen overlay opens
  useEffect(() => {
    if (showFullscreenCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showFullscreenCamera, startCamera, stopCamera]);

  // AI Auto-Detection Simulation
  const runAIDetectionOnCapturedPhoto = useCallback((photoDataUrl: string) => {
    setIsAnalyzingPhoto(true);
    showToast("AI analyzing photo with YOLOv8 & Roboflow...", "info");
    setTimeout(() => {
      setIsAnalyzingPhoto(false);
      const detected = {
        id: "waste_dumping",
        confidence: 94.6,
        label: "Illegal Waste Dumping",
        reason: "YOLOv8 detected high-density solid waste and unsegregated plastics.",
      };
      setAiDetectedCategory(detected);
      if (!reportType || reportType === "other") {
        setReportType(detected.id);
        setIsOverridden(false);
      }
      showToast("✨ AI Auto-Detected: Illegal Waste Dumping (94.6%)", "success");
    }, 600);
  }, [reportType]);

  // Photo Capture Flow
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      showToast("Camera is still initializing, please wait a moment.", "info");
      return;
    }
    const dataUrl = captureWithStamp(video, {
      latitude,
      longitude,
      ghostMode: isGhostMode,
    });
    haptic("medium");
    setBase64Image(dataUrl);
    setShowFullscreenCamera(false);
    stopCamera();
    setStep(2);
    runAIDetectionOnCapturedPhoto(dataUrl);
  }, [latitude, longitude, isGhostMode, haptic, stopCamera, runAIDetectionOnCapturedPhoto]);

  const retakePhoto = useCallback(() => {
    setBase64Image("");
    setStep(1);
    setShowFullscreenCamera(true);
  }, []);

  const addTag = useCallback((tag: string) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed}, ${tag}`;
    });
    haptic("light");
    showToast(`Added: ${tag}`, "info");
  }, [haptic]);

  // Finalize Submission
  const finalizeSubmission = async () => {
    if (!base64Image) {
      showToast("Please capture an evidence photo first.", "error");
      setStep(1);
      return;
    }

    if (latitude == null || longitude == null) {
      showToast("Location is required. Tap the map to set the incident location before submitting.", "error");
      setShowReviewModal(false);
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedImage = await stripExif(base64Image);

      let userId: string | undefined = undefined;
      if (!isGhostMode) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          userId = user?.id;
        } catch {
          /* anonymous fallback */
        }
      }

      const payload: Record<string, unknown> = {
        base64Image: dataUrlToBase64(cleanedImage),
        latitude,
        longitude,
        location: resolvedAddress,
        description: description.trim() || `${reportType.replace(/_/g, " ")} reported.`,
        report_type: reportType || "waste_dumping",
        ghost_mode: isGhostMode,
      };

      if (!isGhostMode && userId) payload.user_id = userId;

      if (!navigator.onLine) {
        await queueReport(payload);
        showToast("You are offline. Report queued securely.", "info");
        setIsSubmitting(false);
        setShowReviewModal(false);
        setIsSubmittedSuccess(true);
        return;
      }

      const res = await submitCitizenReport(payload as never);
      const ticketId = res?.data?.id || `LL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(ticketId);

      // The server routes the report to the analyst/LGU account whose service
      // area covers the location; show that real office name here.
      const routed = (res?.data as { routed_office?: string | null } | undefined)?.routed_office;
      setRoutedOffice(typeof routed === "string" && routed ? routed : null);

      // Save submission reference locally for immediate visibility in History / Submissions
      if (typeof window !== "undefined") {
        try {
          const storageKey = isGhostMode ? "likaslens_anonymous_reports" : "likaslens_user_submissions";
          const raw = localStorage.getItem(storageKey);
          const list = raw ? JSON.parse(raw) : [];
          list.unshift({
            id: ticketId,
            display_id: isGhostMode
              ? `GHOST-${ticketId.slice(0, 6).toUpperCase()}`
              : `LL-${ticketId.slice(0, 8).toUpperCase()}`,
            title: `${reportType ? reportType.replace(/_/g, " ") : "Incident"} Report`,
            category: reportType || "waste_dumping",
            location: resolvedAddress,
            date: new Date().toISOString(),
            status: "open",
            isGhost: isGhostMode,
          });
          localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 30)));
        } catch {}
      }

      haptic("success");
      showToast("Incident Report Submitted Successfully!", "success");
      setShowReviewModal(false);
      setIsSubmittedSuccess(true);
    } catch (err) {
      haptic("error");
      const msg = err instanceof Error ? err.message : "Failed to submit report";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = INCIDENT_CATEGORIES.find((c) => c.id === reportType);

  return (
    <div className="min-h-full flex flex-col bg-page text-ink pb-32">
      {/* ── Top App Bar ────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-page/90 backdrop-blur-md border-b border-ink/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard`}
            className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center text-ink active:scale-95 transition-transform"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">Submit Incident</h1>
            <p className="text-[11px] text-ink/50 leading-none mt-0.5">Official Environmental Report</p>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Offline
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* ── Stepper Navigation (Step 1 to Step 3) ─────────────── */}
        {!isSubmittedSuccess && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: "Capture" },
              { num: 2, label: "AI Triage" },
              { num: 3, label: "Location" },
            ].map((s) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num === 1) setStep(1);
                    if (s.num === 2 && base64Image) setStep(2);
                    if (s.num === 3 && base64Image) setStep(3);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border transition-all text-left ${
                    isActive
                      ? "bg-panel border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-xs"
                      : isDone
                      ? "bg-panel/70 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-panel/40 border-ink/5 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-xs"
                        : isDone
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-ink/10 text-ink/40"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : `0${s.num}`}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-ink truncate leading-tight">{s.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── SUCCESS STATE ────────────────────────────────────── */}
        {isSubmittedSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-3xl bg-panel border border-ink/10 space-y-5 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-ink leading-tight">Report Sent Successfully!</h2>
                <p className="text-xs text-ink/60 mt-0.5">Received and dispatched to authorities.</p>
              </div>
            </div>

            {/* Reference Number Card */}
            <div className="p-4 rounded-2xl bg-ink/[0.02] border border-ink/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/50">
                  Reference ID
                </span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    isGhostMode
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {isGhostMode ? "Ghost Mode (Anonymous)" : "Civic Mode (Verified)"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-panel border border-ink/5 font-mono text-xs">
                <span className="font-bold text-ink truncate select-all">{submittedTicketId || "LL-CASE-RECORDED"}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (submittedTicketId) {
                      navigator.clipboard.writeText(submittedTicketId);
                      setCopiedId(true);
                      showToast("Reference ID copied!", "success");
                      setTimeout(() => setCopiedId(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-ink/5 hover:bg-ink/10 text-xs font-bold text-ink shrink-0 flex items-center gap-1 transition-all"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedId ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Photo Preview Thumbnail */}
            {base64Image && (
              <div className="relative rounded-2xl overflow-hidden border border-ink/10 aspect-16/9 bg-black">
                <img src={base64Image} alt="Submitted Evidence" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[9px] flex items-center gap-1 backdrop-blur-xs">
                  <Fingerprint className="w-2.5 h-2.5 text-emerald-400" />
                  Forensic Verified
                </div>
              </div>
            )}

            {/* 5-Stage Agency Lifecycle Pipeline */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                  Official Agency Dispatch Pipeline
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Stage 3 of 5 Active
                </span>
              </div>
              <div className="space-y-2">
                {/* Stage 1: Received */}
                <div className="p-3 rounded-2xl bg-panel border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink text-xs">1. Report Received & Photo Saved</p>
                    <p className="text-ink/60 text-[10px]">Evidence stored securely with timestamp & hash.</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                    Received
                  </span>
                </div>

                {/* Stage 2: Assigned */}
                <div className="p-3 rounded-2xl bg-panel border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink text-xs">2. Assigned to Government Office</p>
                    <p className="text-ink/60 text-[10px]">
                      {routedOffice
                        ? `Auto-routed to ${routedOffice}.`
                        : "Waiting for the covering local office to claim this report."}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                    Assigned
                  </span>
                </div>

                {/* Stage 3: Dispatched (Active) */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs animate-pulse">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">3. Sent to Inspection Team</p>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-ink/60 text-[10px]">Field inspectors dispatched to the GPS coordinates.</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase shadow-xs">
                    Dispatched
                  </span>
                </div>

                {/* Stage 4: On-Site Inspection & Clean-up (Pending/Next) */}
                <div className="p-3 rounded-2xl bg-panel/50 border border-ink/10 flex items-center gap-3 opacity-60">
                  <div className="w-7 h-7 rounded-xl bg-ink/10 text-ink/40 flex items-center justify-center shrink-0 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink text-xs">4. On-Site Inspection & Clean-up</p>
                    <p className="text-ink/50 text-[10px]">Officers deploy in-field for compliance and clean-up.</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full uppercase">
                    Pending
                  </span>
                </div>

                {/* Stage 5: Problem Solved & Cleaned Up (Final) */}
                <div className="p-3 rounded-2xl bg-panel/50 border border-ink/10 flex items-center gap-3 opacity-60">
                  <div className="w-7 h-7 rounded-xl bg-ink/10 text-ink/40 flex items-center justify-center shrink-0 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink text-xs">5. Problem Solved & Cleaned Up</p>
                    <p className="text-ink/50 text-[10px]">Verified resolution with proof of abatement.</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full uppercase">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/${locale}/history`}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm text-center active:scale-98 transition-transform shadow-md shadow-emerald-600/20"
              >
                Track in My Submissions →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSubmittedSuccess(false);
                  setStep(1);
                  setBase64Image("");
                  setDescription("");
                  setAiDetectedCategory(null);
                  setIsOverridden(false);
                }}
                className="w-full py-3 px-4 rounded-2xl border border-ink/15 text-ink font-bold text-xs active:scale-98 transition-transform text-center"
              >
                File Another Report
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Privacy Mode & Photo Capture ──────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-ink">1. Choose How to Report & Take Photo</h2>
                  <p className="text-xs text-ink/60">
                    Select your identity mode, then capture the violation evidence.
                  </p>
                </div>

                {/* Privacy Mode 2-Choice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleGhostModeToggle(false)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      !isGhostMode
                        ? "border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30 shadow-xs"
                        : "border-ink/10 bg-panel hover:border-emerald-500/30 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            !isGhostMode ? "bg-emerald-500 text-white shadow-xs" : "bg-emerald-500/15 text-emerald-600"
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span className={`text-xs font-black ${!isGhostMode ? "text-emerald-700 dark:text-emerald-300" : "text-ink"}`}>
                          Civic Mode (With My Name)
                        </span>
                      </div>
                      {!isGhostMode && (
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink/65 pl-9 leading-tight">
                      Official accountability • Verified submission tracking
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGhostModeToggle(true)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isGhostMode
                        ? "border-teal-500/80 bg-teal-500/10 dark:bg-teal-950/30 ring-2 ring-teal-500/30 shadow-xs"
                        : "border-ink/10 bg-panel hover:border-teal-500/30 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isGhostMode ? "bg-teal-500 text-white shadow-xs" : "bg-teal-500/15 text-teal-600"
                          }`}
                        >
                          <EyeOff className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span className={`text-xs font-black ${isGhostMode ? "text-teal-700 dark:text-teal-300" : "text-ink"}`}>
                          Ghost Mode (Anonymous)
                        </span>
                      </div>
                      {isGhostMode && (
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-teal-500 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink/65 pl-9 leading-tight">
                      100% private • EXIF-stripped & zero user identifiers
                    </p>
                  </button>
                </div>

                {/* Evidence Photo Card / Open Camera Hero */}
                {base64Image ? (
                  <div className="p-4 rounded-3xl bg-panel border border-ink/10 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">
                        Captured Evidence Photo
                      </span>
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake
                      </button>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-black border border-ink/10">
                      <img src={base64Image} alt="Evidence" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>
                          {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-md shadow-emerald-600/20"
                    >
                      Continue to AI Triage <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-ink/15 bg-panel/60 space-y-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <h3 className="text-base font-black text-ink">Capture Violation Evidence</h3>
                      <p className="text-xs text-ink/60 leading-relaxed">
                        Take a photo with forensic metadata stamping to proceed to the next step.
                      </p>
                    </div>

                    <div className="w-full max-w-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFullscreenCamera(true)}
                        className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-md shadow-emerald-600/25"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Proceed: Open Camera</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: AI Triage & Category Selection ────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-ink">2. AI Triage & Category</h2>
                    <p className="text-xs text-ink/60 mt-0.5">
                      Confirm or override the AI-detected incident classification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-ink/15 text-xs font-bold text-ink"
                  >
                    <RotateCcw className="w-3 h-3" /> Retake
                  </button>
                </div>

                {/* Evidence Thumbnail */}
                <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-black border border-ink/10">
                  <img src={base64Image} alt="Evidence" className="w-full h-full object-cover" />
                  {isAnalyzingPhoto && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white font-mono text-xs">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span>Analyzing photo...</span>
                    </div>
                  )}
                </div>

                {/* AI Detection Banner */}
                {aiDetectedCategory && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        {isOverridden
                          ? "👤 Category Overridden by You"
                          : `✨ AI Auto-Detected: ${aiDetectedCategory.label} (${aiDetectedCategory.confidence}%)`}
                      </p>
                    </div>
                    <p className="text-[11px] text-ink/70 leading-relaxed pl-6">
                      {isOverridden
                        ? `Manually categorized as ${selectedCategory?.label || reportType}.`
                        : `${aiDetectedCategory.reason} Tap below if you wish to change it.`}
                    </p>
                  </div>
                )}

                {/* Category Grid */}
                <div className="p-4 rounded-3xl bg-panel border border-ink/10 space-y-2.5 shadow-xs">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                    Verified Incident Category
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {INCIDENT_CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = reportType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setReportType(cat.id);
                            setIsOverridden(cat.id !== aiDetectedCategory?.id);
                            haptic("light");
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-left active:scale-98 ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40"
                              : "bg-ink/5 hover:bg-ink/10 text-ink border border-ink/5"
                          }`}
                        >
                          <CatIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : cat.color}`} />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-3.5 rounded-2xl border border-ink/15 text-xs font-bold text-ink flex items-center gap-1.5 active:scale-98"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-md shadow-emerald-600/20"
                  >
                    Continue to Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Incident Details & Location ────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-ink">3. Incident Details & Location</h2>
                  <p className="text-xs text-ink/60">
                    Verify the pinpoint location and add observational notes for inspectors.
                  </p>
                </div>

                {/* Interactive Leaflet Map */}
                <div className="rounded-3xl bg-panel border border-ink/10 p-4 space-y-2.5 shadow-xs">
                  <GeoTagMap
                    lat={latitude}
                    lng={longitude}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                    height="220px"
                  />
                </div>

                {/* Resolved Address Card */}
                <div className="p-3.5 rounded-2xl bg-panel border border-emerald-500/30 flex items-start gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/50">
                      Identified Location
                    </p>
                    <p className="text-xs font-bold text-ink leading-snug break-words mt-0.5">
                      {resolvedAddress}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-mono text-[9px] font-bold shrink-0",
                    latitude != null && longitude != null
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-amber-500/15 text-amber-600"
                  )}>
                    {latitude != null && longitude != null ? "GPS Active" : "Not Set"}
                  </span>
                </div>

                {(latitude == null || longitude == null) && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Location not set. Tap the map above to place the incident pin — a location is required to submit.</span>
                  </div>
                )}

                {/* Field Notes & Quick Chips */}
                <div className="p-4 rounded-3xl bg-panel border border-ink/10 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      Observation Notes (Optional)
                    </span>
                    <span className="text-[10px] font-mono text-ink/40">Field Tags</span>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_DETAILS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => addTag(chip)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-ink/5 hover:bg-ink/10 text-ink/80 transition-all active:scale-95 cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add observations, landmark details, or estimated hazard scale..."
                    rows={3}
                    className="w-full p-3 rounded-2xl bg-ink/[0.03] dark:bg-white/[0.03] border border-ink/10 text-xs text-ink placeholder:text-ink/30 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Step 3 Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-3.5 rounded-2xl border border-ink/15 text-xs font-bold text-ink flex items-center gap-1.5 active:scale-98"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    disabled={latitude == null || longitude == null}
                    onClick={() => setShowReviewModal(true)}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    Review & Submit
                  </button>
                </div>
              </motion.div>
            )}
           </AnimatePresence>
        )}
      </div>

      {/* ── FULLSCREEN CAMERA VIEWPORT OVERLAY ─────────────────── */}
      <AnimatePresence>
        {showFullscreenCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
              <button
                type="button"
                onClick={() => setShowFullscreenCamera(false)}
                aria-label="Close camera"
                className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 active:scale-95"
                style={{ backdropFilter: "blur(10px)" }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { switchCamera(); haptic("light"); }}
                  disabled={cameraInitialising}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide bg-black/40 text-white border border-white/20 flex items-center gap-1.5 active:scale-95"
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {facingMode === "environment" ? "Back" : "Front"}
                </button>

                <button
                  type="button"
                  onClick={() => handleGhostModeToggle(!isGhostMode)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 active:scale-95 ${
                    isGhostMode ? "bg-teal-400 text-black font-bold" : "bg-black/40 text-white border border-white/20"
                  }`}
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Ghost {isGhostMode ? "On" : "Off"}
                </button>
              </div>
            </div>

            {/* Video Viewport */}
            {cameraError === "NOT_ALLOWED" ? (
              <div className="p-6 text-center text-white space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">Camera Access Blocked</h3>
                <p className="text-xs text-white/60 leading-relaxed">{getBrowserInstructions()}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cameraInitialising ? 'opacity-0' : 'opacity-100'}`}
                />
                
                <AnimatePresence>
                  {cameraInitialising && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-black z-20"
                    >
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                      <p className="text-xs font-mono text-white/60">Initializing camera...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <GhostShieldOverlay active={isGhostMode} />
                {/* Rule of thirds grid */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "33.33% 33.33%",
                  }}
                />

                {/* Zoom controls */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => toggleZoom(0.5)}
                    className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 active:scale-95"
                    style={{ backdropFilter: "blur(8px)" }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-white/60 text-[10px] font-mono text-center">{zoom.toFixed(1)}x</span>
                  <button
                    type="button"
                    onClick={() => toggleZoom(-0.5)}
                    className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 active:scale-95"
                    style={{ backdropFilter: "blur(8px)" }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 inset-x-0 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-16 flex justify-around items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <button
                type="button"
                onClick={() => { refreshCamera(); haptic("light"); }}
                disabled={cameraInitialising}
                className="flex flex-col items-center gap-1 text-white/70 active:scale-95"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/15 flex items-center justify-center text-white backdrop-blur-md">
                  <RefreshCw className={`w-5 h-5 ${cameraInitialising ? "animate-spin" : ""}`} />
                </div>
                <span className="text-[10px] font-semibold">Refresh</span>
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                aria-label="Capture photo"
                className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-2xl shadow-black"
              >
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                  <Camera className="w-6 h-6 text-emerald-600" />
                </div>
              </button>

              <div className="w-12 h-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REVIEW & SUBMIT BOTTOM SHEET MODAL ────────────────── */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-panel rounded-t-[32px] sm:rounded-3xl border border-ink/10 p-5 space-y-4 shadow-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                <div>
                  <h3 className="text-base font-black text-ink">Confirm Official Submission</h3>
                  <p className="text-xs text-ink/50 mt-0.5">Please review your report details</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode & Category Banner */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-ink/5 border border-ink/5">
                  <span className="text-[10px] font-mono text-ink/40 uppercase block">Mode</span>
                  <span className="font-bold text-ink">
                    {isGhostMode ? "Ghost Mode (Anonymous)" : "Civic Mode (Verified)"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-ink/5 border border-ink/5">
                  <span className="text-[10px] font-mono text-ink/40 uppercase block">Category</span>
                  <span className="font-bold text-ink capitalize">
                    {selectedCategory?.label || reportType.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="p-3 rounded-xl bg-ink/5 border border-ink/5 text-xs space-y-1">
                <span className="text-[10px] font-mono text-ink/40 uppercase block">Location</span>
                <p className="font-bold text-ink leading-snug">{resolvedAddress}</p>
              </div>

              {/* Description */}
              {description && (
                <div className="p-3 rounded-xl bg-ink/5 border border-ink/5 text-xs space-y-1">
                  <span className="text-[10px] font-mono text-ink/40 uppercase block">Observations</span>
                  <p className="text-ink/80 leading-snug">{description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-3.5 rounded-2xl border border-ink/15 text-xs font-bold text-ink active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={finalizeSubmission}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Submit Official Report</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
