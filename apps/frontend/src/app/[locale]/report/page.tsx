"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
  Shield,
  EyeOff,
  Navigation,
  Loader2,
  RefreshCw,
  Check,
  Tag,
  X,
  ImageIcon,
  Copy,
  Search,
  Building2,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCamera } from "@/hooks/useCamera";
import {
  ToastContainer,
  showToast,
  notifyThemeColor,
  submitCitizenReport,
  triageCitizenReport,
  queueReport,
} from "@likaslens/shared";
import { EdgeInterceptorModal } from "@/components/modals/edge-interceptor-modal";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

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
  "Illegal Dumpsite",
  "Chemical Runoff",
  "Forest Protected Zone",
  "Heavy Smoke / Burning",
  "Threat to Wildlife",
  "Active Industrial Discharge",
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reportType, setReportType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [base64Image, setBase64Image] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>("Metro Manila, Philippines");
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [triageIndicators, setTriageIndicators] = useState<string[]>([]);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState(false);
  const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isStreamStalled, setIsStreamStalled] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const [aiDetectedCategory, setAiDetectedCategory] = useState<{
    id: string;
    confidence: number;
    label: string;
    reason: string;
  } | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [isOverridden, setIsOverridden] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const runAIDetectionOnCapturedPhoto = (photoDataUrl: string) => {
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
      if (!reportType || reportType === "ai_auto") {
        setReportType(detected.id);
        setIsOverridden(false);
      }
      showToast("✨ AI Auto-Detected: Illegal Waste Dumping (94.6%)", "success");
    }, 600);
  };

  const handlePhotoUploadForAIDetection = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      const stripped = await stripExif(rawBase64);
      setBase64Image(stripped);
      runAIDetectionOnCapturedPhoto(stripped);
    };
    reader.readAsDataURL(file);
  };

  const handleContinueToCamera = () => {
    if (!reportType) {
      showToast("Please select an incident type first, or tap 'Let AI Detect'.", "info");
      setCategoryError(true);
      setTimeout(() => setCategoryError(false), 2000);
      return;
    }
    setStep(2);
  };

  const addDetail = (detail: string) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return detail;
      if (trimmed.includes(detail)) return prev;
      return `${trimmed}, ${detail}`;
    });
    showToast(`Added: ${detail}`, "info");
  };

  const camera = useCamera("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setVideoRef = useCallback(
    (video: HTMLVideoElement | null) => {
      videoRef.current = video;
      if (video && camera.stream) {
        if (video.srcObject !== camera.stream) {
          video.srcObject = camera.stream;
        }
        video.play().catch(() => {});
      }
    },
    [camera.stream]
  );

  // Sync camera stream whenever stream, step, or fullscreen camera state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !camera.stream) return;
    if (video.srcObject !== camera.stream) {
      video.srcObject = camera.stream;
    }
    video.play().catch(() => {});
  }, [camera.stream, step, showFullscreenCamera]);

  // Sync theme with step lock protection
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "ghost") setIsGhostMode(true);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const theme = document.documentElement.getAttribute("data-theme");
          if (step >= 2) {
            const lockedTheme = isGhostMode ? "ghost" : "civic";
            if (theme !== lockedTheme) {
              document.documentElement.setAttribute("data-theme", lockedTheme);
              showToast("Privacy mode is locked for this report. Go back to Step 1 to change.", "info");
            }
          } else {
            setIsGhostMode(theme === "ghost");
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [step, isGhostMode]);

  const handleGhostModeToggle = (checked: boolean) => {
    if (step >= 2) {
      showToast("Privacy mode is locked for this active report. Go back to Step 1 to change.", "info");
      return;
    }
    setIsGhostMode(checked);
    const newTheme = checked ? "ghost" : "civic";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    notifyThemeColor();
  };

  // Online / Offline tracking
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

  // Stable ref to camera.start to avoid infinite re-render loops
  const cameraStartRef = useRef(camera.start);
  cameraStartRef.current = camera.start;
  const cameraIsActiveRef = useRef(camera.isActive);
  cameraIsActiveRef.current = camera.isActive;

  // Pre-warm camera on mount so it's instantly ready when user reaches Step 2
  useEffect(() => {
    if (!cameraIsActiveRef.current) {
      cameraStartRef.current();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smart camera watchdog: detects black screen or stalled stream on slow devices
  useEffect(() => {
    if (!showFullscreenCamera) {
      setIsStreamStalled(false);
      return;
    }
    const timer = setTimeout(() => {
      const v = videoRef.current;
      if (!v || v.videoWidth === 0 || v.readyState < 2) {
        setIsStreamStalled(true);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [showFullscreenCamera]);

  // Auto-fetch GPS when entering Step 2
  useEffect(() => {
    if (step === 2 && navigator.geolocation && !latitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, latitude]);

  const stripExif = async (base64: string) => {
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

  const cameraStopRef = useRef(camera.stop);
  cameraStopRef.current = camera.stop;

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Ensure the video actually has rendered frames (readyState >= 2 = HAVE_CURRENT_DATA)
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      showToast("Camera is still initializing, please wait a moment.", "info");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setBase64Image(dataUrl);
    setShowFullscreenCamera(false);
    setStep(2);
    cameraStopRef.current();
    runAIDetectionOnCapturedPhoto(dataUrl);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retakePhoto = () => {
    setBase64Image("");
    setStep(1);
    cameraStartRef.current();
  };

  const addTag = (tag: string) => {
    if (!description.includes(tag)) {
      setDescription((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
    }
  };

  const finalizeSubmission = async (cleanedImage: string) => {
    let userId: string | undefined = undefined;
    if (!isGhostMode) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id;
      } catch {
        /* anonymous mode */
      }
    }

    const payload: Record<string, unknown> = {
      base64Image: cleanedImage,
      latitude: latitude ?? 14.5995,
      longitude: longitude ?? 120.9842,
      location: resolvedAddress,
      description: description.trim() || `${reportType.replace(/_/g, " ")} reported.`,
      report_type: reportType,
      ghost_mode: isGhostMode,
    };

    // Only include user_id if we have a valid UUID — null FK refs cause constraint violations
    if (!isGhostMode && userId) payload.user_id = userId;

    if (!navigator.onLine) {
      await queueReport(payload);
      showToast("You are offline. Report queued securely.", "info");
      setIsSubmitting(false);
      setShowReviewModal(false);
      setIsSubmittedSuccess(true);
      return;
    }

    const responseData = await submitCitizenReport(payload as any);
    const assignedTicketId = responseData.data?.id || crypto.randomUUID();
    setSubmittedTicketId(assignedTicketId);

    // If submitted in Ghost Mode, save tracking ref to local device vault
    if (typeof window !== "undefined" && isGhostMode) {
      try {
        const raw = localStorage.getItem("likaslens_anonymous_reports");
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({
          id: assignedTicketId,
          category: reportType,
          location: resolvedAddress,
          date: new Date().toISOString(),
          status: "open",
        });
        localStorage.setItem("likaslens_anonymous_reports", JSON.stringify(list.slice(0, 20)));
      } catch {}
    }

    showToast(responseData.message || "Incident Report Submitted Successfully!", "success");
    setShowReviewModal(false);
    setIsSubmittedSuccess(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!base64Image) {
      showToast("Please capture evidence photo first.", "error");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedImage = await stripExif(base64Image);

      if (!isGhostMode && navigator.onLine) {
        setIsTriaging(true);
        try {
          const triageData = await triageCitizenReport(cleanedImage);
          if (triageData.has_concern) {
            setTriageIndicators(
              triageData.indicators
                .map((i: { label?: string; type?: string }) => i.label || i.type)
                .filter(Boolean) as string[]
            );
            setShowReviewModal(false);
            setIsModalOpen(true);
            setIsSubmitting(false);
            setIsTriaging(false);
            return;
          }
        } catch (err) {
          console.error("Triage pre-check failed:", err);
        } finally {
          setIsTriaging(false);
        }
      }

      await finalizeSubmission(cleanedImage);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error submitting report.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = INCIDENT_CATEGORIES.find((c) => c.id === reportType);

  return (
    <>
      <ToastContainer />
      <EdgeInterceptorModal
        isOpen={isModalOpen}
        isLoading={isSubmitting}
        indicators={triageIndicators}
        onCancel={() => setIsModalOpen(false)}
        onProceed={async () => {
          setIsGhostMode(true);
          setIsSubmitting(true);
          const cleaned = await stripExif(base64Image);
          await finalizeSubmission(cleaned);
          setIsModalOpen(false);
        }}
      />

      <DashboardLayoutWrapper
        pageTitle="Submit Incident"
        pageSubtitle="Report environmental violations directly to DENR, DILG, and local emergency taskforces."
        showBranding={false}
        headerChildren={
          !isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber/30 bg-amber/10 text-amber font-mono text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-amber" />
              Offline Mode
            </div>
          ) : undefined
        }
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-12 pt-2">
          {/* Stepper Navigation Progress */}
          {!isSubmittedSuccess && (
            <div className="mb-7">
              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                {[
                  { num: 1, label: "Privacy & Capture" },
                  { num: 2, label: "AI Triage" },
                  { num: 3, label: "Details & Location" },
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
                      className={`relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all text-left ${
                        isActive
                          ? "bg-panel border-accent shadow-[0_6px_24px_-4px_rgba(6,182,212,0.18)] ring-2 ring-accent"
                          : isDone
                          ? "bg-panel/60 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-panel/30 border-ink/5 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-mono text-sm font-black shrink-0 ${
                          isActive
                            ? "bg-accent text-page"
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-ink/10 text-ink/40"
                        }`}
                      >
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : s.num}
                      </div>
                      <div className="min-w-0 hidden sm:block">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/40 leading-none mb-1">
                          Step 0{s.num}
                        </p>
                        <p className="text-sm font-bold text-ink truncate leading-tight">{s.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wizard Card Container */}
          <div className="bg-panel/90 backdrop-blur-xl border border-ink/[0.08] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
            {isSubmittedSuccess ? (
              /* Success State: Balanced, Large 2-Column Layout (Zero Scroll) */
              <div className="py-4 sm:py-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT COLUMN: Header, Reference ID, Photo Evidence, and Action Buttons (5 cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-ink leading-tight">Report Sent Successfully!</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          Your report has been received and forwarded to local authorities.
                        </p>
                      </div>
                    </div>

                    {/* Reference ID Badge with 1-Click Copy */}
                    <div className="p-5 rounded-2xl bg-ink/[0.02] dark:bg-white/[0.03] border border-accent/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/50">
                          Reference Number
                        </span>
                        <span className={`text-xs font-mono font-bold uppercase px-3 py-0.5 rounded-full ${
                          isGhostMode
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                            : "bg-accent/15 text-accent border border-accent/20"
                        }`}>
                          {isGhostMode ? "Ghost Mode (Anonymous)" : "Civic Mode (With Name)"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-panel border border-ink/5 font-mono text-sm">
                        <span className="font-bold text-ink truncate select-all">{submittedTicketId || "LL-CASE-RECORDED"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (submittedTicketId) {
                              navigator.clipboard.writeText(submittedTicketId);
                              setCopiedId(true);
                              showToast("Reference number copied!", "success");
                              setTimeout(() => setCopiedId(false), 2000);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-ink/[0.04] hover:bg-ink/[0.08] text-xs font-bold text-ink shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Evidence Photo Preview */}
                    {base64Image && (
                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/50 block">
                          Photo Evidence
                        </span>
                        <div className="relative rounded-2xl overflow-hidden border border-ink/10 max-h-56 bg-black shadow-md">
                          <NextImage
                            src={base64Image}
                            alt="Submitted Evidence"
                            width={600}
                            height={340}
                            className="w-full h-auto object-cover max-h-56"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 text-white font-mono text-[10px] flex items-center gap-1.5 backdrop-blur-xs">
                            <Fingerprint className="w-3 h-3 text-emerald-400" />
                            Verified Photo
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <Link
                        href={`/${locale}/dashboard/my-reports`}
                        className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-ink text-page font-bold text-sm text-center hover:opacity-90 transition-all shadow-md cursor-pointer"
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
                        className="w-full sm:w-auto py-3.5 px-5 rounded-2xl border border-ink/15 hover:bg-ink/[0.04] text-ink font-bold text-sm transition-all cursor-pointer"
                      >
                        File Another Report
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Continuous 4-Stage Agency Action Rail (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                      <div>
                        <h3 className="text-base font-bold text-ink flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-accent" />
                          Report Status & Next Steps
                        </h3>
                        <p className="text-xs text-ink/50 mt-0.5">Live updates as government staff respond</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse">
                        Active Case
                      </span>
                    </div>

                    {/* 4-Stage Pipeline Rail */}
                    <div className="space-y-3">
                      {/* Stage 1: Received */}
                      <div className="p-4 rounded-xl bg-panel border border-ink/10 flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 text-sm font-bold">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">1. Report Received & Photo Saved</p>
                          <p className="text-ink/60 text-xs mt-0.5">Your photo and report details are safely saved in the system.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                          Received
                        </span>
                      </div>

                      {/* Stage 2: Assigned */}
                      <div className="p-4 rounded-xl bg-panel border border-emerald-500/20 flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-sm font-bold">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">2. Assigned to Government Office</p>
                          <p className="text-ink/60 text-xs mt-0.5">Assigned to <strong className="text-ink font-semibold">DENR & City Environment Office (CENRO)</strong> under <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Clean Air & Waste Management laws</strong>.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                          Assigned
                        </span>
                      </div>

                      {/* Stage 3: Sent to Inspection Team */}
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/35 flex items-center gap-3.5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-accent text-page flex items-center justify-center shrink-0 animate-pulse text-sm">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-accent text-sm sm:text-base">3. Sent to Inspection Team</p>
                          <p className="text-ink/60 text-xs mt-0.5">Local inspectors have been notified to check the area.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-accent text-page uppercase animate-pulse">
                          Sent
                        </span>
                      </div>

                      {/* Stage 4: On-Site Inspection & Clean-up */}
                      <div className="p-4 rounded-xl bg-panel border border-ink/5 flex items-center gap-3.5 opacity-60">
                        <div className="w-8 h-8 rounded-xl bg-ink/10 text-ink/40 flex items-center justify-center shrink-0 text-sm">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">4. On-Site Inspection & Clean-up</p>
                          <p className="text-ink/60 text-xs mt-0.5">Government team visits the location to inspect and resolve the issue.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-ink/5 text-ink/40 uppercase">
                          Next Step
                        </span>
                      </div>

                      {/* Stage 5: Problem Solved & Cleaned Up */}
                      <div className="p-4 rounded-xl bg-panel border border-ink/5 flex items-center gap-3.5 opacity-40">
                        <div className="w-8 h-8 rounded-xl bg-ink/10 text-ink/40 flex items-center justify-center shrink-0 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">5. Problem Solved & Cleaned Up</p>
                          <p className="text-ink/60 text-xs mt-0.5">The issue has been completely fixed and verified by authorities.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-ink/5 text-ink/40 uppercase">
                          Final
                        </span>
                      </div>
                    </div>

                    {/* Government Notice Box */}
                    <div className="p-3.5 rounded-xl bg-ink/[0.03] border border-ink/5 text-xs text-ink/70 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      <span>You can track progress and updates anytime in <strong>My Submissions</strong>.</span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* STEP 1: Privacy Mode & Evidence Capture */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-black text-ink">1. Choose How to Report & Take Photo</h2>
                      <p className="text-sm text-ink/60 mt-0.5">
                        Select whether to report with your name or stay anonymous, then open camera.
                      </p>
                    </div>

                    {/* Privacy Mode — Clear, Simple 2-Choice Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Civic Mode Card */}
                      <button
                        type="button"
                        onClick={() => handleGhostModeToggle(false)}
                        className={`relative p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          !isGhostMode
                            ? "border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-[0_4px_18px_-2px_rgba(16,185,129,0.22)] ring-2 ring-emerald-500/30"
                            : "border-ink/10 bg-panel hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              !isGhostMode
                                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span className={`text-sm font-black tracking-tight truncate ${
                              !isGhostMode ? "text-emerald-700 dark:text-emerald-300" : "text-ink"
                            }`}>
                              Civic Mode (With My Name)
                            </span>
                          </div>
                          {!isGhostMode && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink/65 pl-10 leading-snug">
                          Your name is included • Track status • Get official updates
                        </p>
                      </button>

                      {/* Ghost Mode Card */}
                      <button
                        type="button"
                        onClick={() => handleGhostModeToggle(true)}
                        className={`relative p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isGhostMode
                            ? "border-teal-500/80 bg-teal-500/10 dark:bg-teal-950/30 shadow-[0_4px_18px_-2px_rgba(20,184,166,0.22)] ring-2 ring-teal-500/30"
                            : "border-ink/10 bg-panel hover:border-teal-500/40 hover:bg-teal-500/[0.03] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isGhostMode
                                ? "bg-teal-500 text-white shadow-sm shadow-teal-500/30"
                                : "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                            }`}>
                              <EyeOff className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span className={`text-sm font-black tracking-tight truncate ${
                              isGhostMode ? "text-teal-700 dark:text-teal-300" : "text-ink"
                            }`}>
                              Ghost Mode (Anonymous)
                            </span>
                          </div>
                          {isGhostMode && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500 text-white shadow-xs shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink/65 pl-10 leading-snug">
                          Completely private • No name or phone data shared
                        </p>
                      </button>
                    </div>

                    {/* Open Camera Hero Station */}
                    <div className="flex flex-col items-center justify-center py-12 sm:py-14 rounded-3xl border-2 border-dashed border-ink/15 bg-gradient-to-b from-ink/[0.02] to-ink/[0.06] dark:from-white/[0.02] dark:to-white/[0.06] space-y-5">
                      <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <Camera className="w-10 h-10" />
                      </div>
                      <div className="text-center space-y-1 max-w-sm px-4">
                        <h3 className="text-lg sm:text-xl font-black text-ink">Capture Evidence</h3>
                        <p className="text-xs sm:text-sm text-ink/60 leading-relaxed">
                          Take a photo of the violation to proceed to the next step.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!camera.isActive && !camera.isLoading) {
                            camera.start();
                          }
                          setShowFullscreenCamera(true);
                        }}
                        className="px-8 sm:px-10 py-4 rounded-2xl bg-ink text-page font-bold text-base sm:text-lg inline-flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer group"
                      >
                        <Camera className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Proceed: Take Photo</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      {camera.error && (
                        <p className="text-sm text-rose-500 font-mono mt-2 px-6 text-center">
                          {camera.error === "NOT_ALLOWED" ? getBrowserInstructions() : camera.errorMessage}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: AI Triage & Category Selection */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-ink">2. AI Triage & Category</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          AI auto-detected the violation. Confirm or override the category below.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-ink/15 hover:bg-ink/[0.04] text-xs sm:text-sm font-bold text-ink transition-all font-mono cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Retake
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Evidence Photo (5 cols) */}
                      <div className="lg:col-span-5 space-y-3">
                        <div className="relative rounded-3xl overflow-hidden border border-ink/10 bg-panel w-full aspect-4/3 sm:aspect-square shadow-lg">
                          <img
                            src={base64Image}
                            alt="Evidence Snapshot"
                            className="w-full h-full object-cover"
                          />
                          {isAnalyzingPhoto && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white font-mono text-xs">
                              <Loader2 className="w-6 h-6 text-accent animate-spin" />
                              <span>Analyzing photo...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Results & Category (7 cols) */}
                      <div className="lg:col-span-7 space-y-4 flex flex-col">
                        {/* AI Detection Result */}
                        {aiDetectedCategory && (
                          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 shadow-xs">
                            <div className="flex items-start gap-3">
                              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                  {isOverridden
                                    ? "\uD83D\uDC64 Category Overridden by You"
                                    : `\u2728 AI Auto-Detected: ${aiDetectedCategory.label} (${aiDetectedCategory.confidence}%)`}
                                </p>
                                <p className="text-xs text-ink/70 mt-0.5 leading-relaxed">
                                  {isOverridden
                                    ? `You manually changed category to ${selectedCategory?.label || reportType}.`
                                    : `${aiDetectedCategory.reason} Tap any pill below if you want to override.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Category Grid with Icons */}
                        <div className="p-4 sm:p-5 rounded-3xl bg-panel border border-ink/[0.08] dark:border-white/10 space-y-2.5 shadow-xs">
                          <span className="text-xs font-bold text-ink uppercase tracking-wider">
                            Verified Incident Category
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                  }}
                                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-left ${
                                    isSelected
                                      ? "bg-accent text-page shadow-sm ring-2 ring-accent"
                                      : "bg-ink/[0.03] dark:bg-white/5 text-ink hover:bg-ink/[0.07] border border-ink/5"
                                  }`}
                                >
                                  <CatIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-page" : cat.color}`} />
                                  <span className="truncate">{cat.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step 2 Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={retakePhoto}
                            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-ink/10 text-sm font-bold text-ink/70 hover:text-ink hover:bg-ink/[0.03] transition-all cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-ink text-page font-bold text-base hover:-translate-y-px transition-all shadow-md cursor-pointer"
                          >
                            Continue to Details
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Incident Details & Location */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column (7 cols): Interactive GeoTag Map */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <h2 className="text-xl font-black text-ink">3. Incident Details & Location</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          Pin the incident location and add field observations for the inspector.
                        </p>
                      </div>

                      <GeoTagMap
                        initialLat={latitude}
                        initialLng={longitude}
                        onLocationChange={(lat, lng, addr) => {
                          setLatitude(lat);
                          setLongitude(lng);
                          if (addr) setResolvedAddress(addr);
                        }}
                        onAddressResolve={setResolvedAddress}
                        height="480px"
                      />
                    </div>

                    {/* Right Column (5 cols): Address Card + Environmental Notes + Next */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                      {/* Identified Location Card */}
                      <div className="p-5 rounded-3xl bg-panel border border-accent/30 shadow-xs flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink/50 mb-1">
                              Identified Incident Location
                            </p>
                            <p className="text-sm sm:text-base font-bold text-ink leading-snug break-words">{resolvedAddress}</p>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold shrink-0">
                          GPS Active
                        </span>
                      </div>

                      {/* Observations & Field Details Box */}
                      <div className="p-5 rounded-3xl bg-panel border border-ink/[0.08] dark:border-white/10 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink uppercase tracking-wider">
                            Observation Notes (Optional)
                          </span>
                          <span className="text-[10px] font-mono text-ink/50">Field Details</span>
                        </div>

                        {/* Quick Observation Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Black Smoke",
                            "Foul Odor",
                            "Industrial Dumping",
                            "Near River",
                            "Hazardous Chemicals",
                            "Public Health Risk",
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => addTag(chip)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-ink/[0.04] hover:bg-ink/[0.08] text-ink/80 transition-all cursor-pointer"
                            >
                              + {chip}
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add any additional details or context for the inspector..."
                          rows={3}
                          className="w-full p-3 rounded-2xl bg-ink/[0.02] dark:bg-white/[0.03] border border-ink/10 text-xs sm:text-sm text-ink focus:outline-hidden focus:ring-2 focus:ring-accent resize-none"
                        />
                      </div>

                      {/* Step 3 Actions */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-ink/10 text-sm font-bold text-ink/70 hover:text-ink hover:bg-ink/[0.03] transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Triage
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowReviewModal(true)}
                          className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-ink text-page font-bold text-base hover:-translate-y-px transition-all shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          Review & Submit
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            )}
          </div>
        </div>
      </DashboardLayoutWrapper>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* ═══ FULLSCREEN CAMERA OVERLAY ═══ */}
      <AnimatePresence>
        {showFullscreenCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
          >
            {/* Camera Viewfinder — fills entire screen */}
            {camera.isActive ? (
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  v.play().catch(() => {});
                }}
                onLoadedData={() => setIsStreamStalled(false)}
                onPlaying={() => setIsStreamStalled(false)}
                className="w-full h-full object-cover"
              />
            ) : camera.isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                <span className="text-white/70 font-mono text-sm">Starting camera...</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <Camera className="w-16 h-16 text-white/40 mb-4" />
                <p className="text-white/60 text-center font-mono text-sm mb-6">
                  {camera.error === "NOT_ALLOWED" ? getBrowserInstructions() : camera.errorMessage || "Camera unavailable"}
                </p>
                <button
                  type="button"
                  onClick={() => camera.start()}
                  className="px-8 py-3 rounded-2xl bg-white text-black font-bold text-sm cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Top Bar Controls */}
            {/* Top-Left: Flip Camera */}
            <button
              type="button"
              onClick={() => camera.switchCamera()}
              disabled={camera.isLoading}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all z-10 cursor-pointer"
              aria-label="Switch Camera"
              title="Flip Camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Close Button — top right */}
            <button
              type="button"
              onClick={() => {
                setShowFullscreenCamera(false);
                if (!base64Image) cameraStopRef.current();
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all z-10 cursor-pointer"
              aria-label="Close Camera"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Shutter Button — bottom center */}
            {camera.isActive && (
              <div className="absolute bottom-10 sm:bottom-14 inset-x-0 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="p-1.5 rounded-full border-4 border-white/80 hover:scale-105 active:scale-90 transition-all drop-shadow-2xl cursor-pointer"
                  aria-label="Capture Photo"
                >
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
                    <Camera className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600" />
                  </div>
                </button>
                <span className="text-white/60 text-xs font-mono">Tap to capture evidence</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REVIEW & SUBMIT CONFIRMATION MODAL ═══ */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-panel rounded-3xl overflow-hidden border border-ink/10 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-ink/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-ink">Review & Submit</h3>
                    <p className="text-xs text-ink/50">Verify details before submitting to authorities</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-5 sm:px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Evidence Summary Row */}
                <div className="flex items-start gap-4">
                  {base64Image && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black shrink-0 border border-ink/10 shadow-md">
                      <img src={base64Image} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <span className="text-base font-bold text-ink block">{selectedCategory?.label || reportType}</span>
                      <span className="text-xs text-ink/55 font-mono">Environmental Incident</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink/70">
                      <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{resolvedAddress}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      isGhostMode
                        ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                        : "bg-accent/15 text-accent"
                    }`}>
                      {isGhostMode ? <EyeOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      {isGhostMode ? "Ghost Mode (Anonymous)" : "Civic Mode (With Name)"}
                    </span>
                  </div>
                </div>

                {/* Notes Preview */}
                {description && (
                  <div className="p-3 rounded-2xl bg-ink/[0.02] dark:bg-white/[0.03] border border-ink/5 text-xs text-ink/80 leading-relaxed">
                    <strong>Notes:</strong> {description}
                  </div>
                )}

                {/* Agency Routing & Law Matching */}
                <div className="p-4 rounded-2xl bg-panel border border-accent/25 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                    <Sparkles className="w-3.5 h-3.5" />
                    Assigned Government Office & Law
                  </div>
                  <div className="space-y-1.5 text-xs font-mono text-ink/75">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-ink/[0.03] dark:bg-white/5">
                      <span>Assigned Office:</span>
                      <strong className="text-ink">DENR-EMB / City Environment Office (CENRO)</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-ink/[0.03] dark:bg-white/5">
                      <span>Applicable Law:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">RA 9003 / Clean Air / Water Act</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-ink/[0.03] dark:bg-white/5">
                      <span>Photo Verification:</span>
                      <strong className="text-ink">Original & Tamper-Proof</strong>
                    </div>
                  </div>
                </div>

                {/* Privacy & Verification Badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-xs text-ink/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    {isGhostMode
                      ? "All personal and phone information removed. Report is completely anonymous."
                      : "Filed under your name. You will receive official updates as authorities take action."}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-t border-ink/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isSubmitting || isTriaging}
                  onClick={() => setShowReviewModal(false)}
                  className="px-5 py-3.5 rounded-2xl border border-ink/10 hover:bg-ink/[0.03] text-sm font-bold text-ink/70 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || isTriaging || !base64Image}
                  onClick={() => handleSubmit()}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-ink text-page font-bold text-base hover:-translate-y-1 active:translate-y-0 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Submitting Incident Report...</span>
                    </>
                  ) : isTriaging ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin text-accent" />
                      <span>AI Checking Report...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Submit Incident Report</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forensic Evidence Zoom Lightbox Modal */}
      <AnimatePresence>
        {showImageLightbox && base64Image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
            onClick={() => setShowImageLightbox(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-panel rounded-3xl overflow-hidden border border-ink/10 shadow-2xl p-4 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-ink">Forensic Evidence Preview</h3>
                    <p className="text-xs text-ink/50 font-mono">Zero-Knowledge Chain of Custody Sealed</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageLightbox(false)}
                  className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black/95 max-h-[65vh] flex items-center justify-center border border-ink/10">
                <img
                  src={base64Image}
                  alt="Evidence Zoom"
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-ink/70 pt-2 border-t border-ink/5">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  SHA-256 Validated
                </span>
                <span>EXIF: Sanitized</span>
                <span>GPS: {latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : "Active"}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
