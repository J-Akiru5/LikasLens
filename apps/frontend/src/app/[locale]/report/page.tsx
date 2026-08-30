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
  apiPost,
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
  const [submittedTicketId, setSubmittedTicketId] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const handleContinueToCamera = () => {
    if (!reportType) {
      showToast("Please select an incident type first.", "info");
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

  // Sync camera stream whenever stream or step changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !camera.stream) return;
    if (video.srcObject !== camera.stream) {
      video.srcObject = camera.stream;
    }
    video.play().catch(() => {});
  }, [camera.stream, step]);

  // Sync theme
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "ghost") setIsGhostMode(true);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const theme = document.documentElement.getAttribute("data-theme");
          setIsGhostMode(theme === "ghost");
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleGhostModeToggle = (checked: boolean) => {
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
    cameraStopRef.current();

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
    };

    // Only include user_id if we have a valid UUID — null FK refs cause constraint violations
    if (!isGhostMode && userId) payload.user_id = userId;

    if (!navigator.onLine) {
      await queueReport(payload);
      showToast("You are offline. Report queued securely.", "info");
      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
      return;
    }

    const responseData = await apiPost<{ message: string; data?: { id?: string } }>("/reports", payload);
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
    setIsSubmittedSuccess(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!base64Image) {
      showToast("Please capture evidence photo first.", "error");
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedImage = await stripExif(base64Image);

      if (!isGhostMode && navigator.onLine) {
        setIsTriaging(true);
        try {
          const triageData = await apiPost<{
            has_concern: boolean;
            indicators: Array<{ label?: string; type?: string }>;
          }>("/reports/triage", { base64Image: cleanedImage });
          if (triageData.has_concern) {
            setTriageIndicators(
              triageData.indicators
                .map((i: { label?: string; type?: string }) => i.label || i.type)
                .filter(Boolean) as string[]
            );
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
                  { num: 1, label: "Incident Details" },
                  { num: 2, label: "Photo Evidence" },
                  { num: 3, label: "Location & Submit" },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        if (s.num === 1) setStep(1);
                        if (s.num === 2 && reportType) setStep(2);
                        if (s.num === 3 && reportType && base64Image) setStep(3);
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
                        <h2 className="text-2xl sm:text-3xl font-black text-ink leading-tight">Incident Dispatched</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          Evidence sealed, EXIF-scrubbed, and queued for agency action.
                        </p>
                      </div>
                    </div>

                    {/* Reference ID Badge with 1-Click Copy */}
                    <div className="p-5 rounded-2xl bg-ink/[0.02] dark:bg-white/[0.03] border border-accent/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/50">
                          Tracking Reference ID
                        </span>
                        <span className={`text-xs font-mono font-bold uppercase px-3 py-0.5 rounded-full ${
                          isGhostMode
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                            : "bg-accent/15 text-accent border border-accent/20"
                        }`}>
                          {isGhostMode ? "Ghost Mode (Anonymous)" : "Verified Citizen"}
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
                              showToast("Tracking ID copied!", "success");
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
                      <div className="p-4 rounded-2xl bg-ink/[0.02] border border-ink/5 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 shrink-0 border border-ink/10 relative shadow-sm">
                          <img
                            src={base64Image}
                            alt="Evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            <ShieldCheck className="w-4 h-4" />
                            Forensic Stamp Verified
                          </div>
                          <p className="font-bold text-ink text-sm sm:text-base truncate">{selectedCategory?.label || reportType}</p>
                          <p className="text-xs text-ink/50 truncate">{resolvedAddress}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-1">
                      <Link
                        href={`/${locale}/dashboard/my-reports`}
                        className="w-full py-4 px-6 rounded-xl bg-ink text-page font-bold text-base flex items-center justify-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md text-center cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        View in My Submissions
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setReportType("");
                          setDescription("");
                          setBase64Image("");
                          setIsSubmittedSuccess(false);
                        }}
                        className="w-full py-3 px-4 rounded-xl border border-ink/10 hover:bg-ink/[0.04] text-ink font-semibold text-sm transition-all text-center cursor-pointer"
                      >
                        Submit Another Incident
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Live Telemetry & Agency Progress Pipeline (7 cols) */}
                  <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-ink/[0.02] dark:bg-white/[0.02] border border-ink/[0.08] dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-ink/5 pb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/60">
                        Live Government Telemetry & Agency Pipeline
                      </span>
                      <span className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Dispatch
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Stage 1 */}
                      <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                          ✓
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">1. Report Lodged & Geo-Stamped</p>
                          <p className="text-ink/60 text-xs mt-0.5">Evidence securely locked with GPS coordinates.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                          Received
                        </span>
                      </div>

                      {/* Stage 2 */}
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/35 flex items-center gap-3.5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-accent text-page flex items-center justify-center shrink-0 animate-pulse text-sm">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-accent text-sm sm:text-base">2. AI Jurisdictional Matching</p>
                          <p className="text-ink/60 text-xs mt-0.5">Classifying violation under Philippine Environmental Law for DENR/LGU dispatch.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-accent text-page uppercase animate-pulse">
                          In Progress
                        </span>
                      </div>

                      {/* Stage 3 */}
                      <div className="p-4 rounded-xl bg-panel border border-ink/5 flex items-center gap-3.5 opacity-60">
                        <div className="w-8 h-8 rounded-xl bg-ink/10 text-ink/40 flex items-center justify-center shrink-0 text-sm">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">3. Dispatched to Taskforce</p>
                          <p className="text-ink/60 text-xs mt-0.5">Enforcement officer assigned for field investigation.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-ink/5 text-ink/40 uppercase">
                          Queued
                        </span>
                      </div>

                      {/* Stage 4 */}
                      <div className="p-4 rounded-xl bg-panel border border-ink/5 flex items-center gap-3.5 opacity-40">
                        <div className="w-8 h-8 rounded-xl bg-ink/10 text-ink/40 flex items-center justify-center shrink-0 text-sm">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink text-sm sm:text-base">4. On-Site Inspection & Clean-up</p>
                          <p className="text-ink/60 text-xs mt-0.5">Field team executes clean-up / violation abatement.</p>
                        </div>
                        <span className="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-ink/5 text-ink/40 uppercase">
                          Pending
                        </span>
                      </div>
                    </div>

                    {/* Government Notice Box */}
                    <div className="p-3.5 rounded-xl bg-ink/[0.03] border border-ink/5 text-xs text-ink/70 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      <span>Report received! You can track live inspector updates anytime in <strong>My Submissions</strong>.</span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* STEP 1: Incident Details (Full-Width 2-Column Senior-Friendly Layout) */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column (7 cols): Large Incident Category Tiles & Details */}
                    <div className="lg:col-span-7 space-y-5">
                      <div>
                        <h2 className="text-xl font-black text-ink">1. Select Incident Type</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          Tap the category that best describes the environmental violation observed.
                        </p>
                      </div>

                      {/* 9 Large Category Tiles with rich tactile elevation */}
                      <div
                        className={`grid grid-cols-3 gap-3 sm:gap-4 p-1.5 rounded-3xl transition-all duration-300 ${
                          categoryError
                            ? "ring-2 ring-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-pulse"
                            : ""
                        }`}
                      >
                        {INCIDENT_CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const isSelected = reportType === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setReportType(cat.id);
                                setCategoryError(false);
                              }}
                              className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 text-center group cursor-pointer ${
                                isSelected
                                  ? `bg-panel border-accent ring-2 ring-accent shadow-[0_10px_30px_rgba(6,182,212,0.28)] -translate-y-1 ${cat.bg}`
                                  : "bg-panel border-ink/[0.08] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-ink/20 active:translate-y-0 active:scale-[0.98]"
                              }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 shadow-sm ${cat.bg} ${cat.color}`}
                              >
                                <Icon className="w-6 h-6" />
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-ink tracking-tight leading-snug">
                                {cat.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Observations Textarea */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-ink">
                            Observations & Field Notes
                          </label>
                          <span className="text-xs font-mono text-ink/40">{description.length}/2000</span>
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe what you observed in the field (e.g. truck plate numbers, water color, heavy smoke, specific landmarks)..."
                          rows={3}
                          maxLength={2000}
                          className="w-full px-4 py-3.5 text-sm sm:text-base bg-panel border border-border text-ink placeholder:text-muted rounded-2xl focus:ring-2 focus:ring-accent focus:outline-none transition-all resize-none shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Right Column (5 cols): Quick Tags, Ghost Mode, Continue Button */}
                    <div className="lg:col-span-5 space-y-5 flex flex-col justify-between h-full">
                      {/* Observed Evidence Details (Professional Form Additions) */}
                      <div className="p-5 rounded-3xl bg-panel border border-ink/[0.08] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-ink/75">
                            <Tag className="w-4 h-4 text-accent" />
                            <span>Observed Evidence Details</span>
                          </div>
                          <span className="text-[10px] font-mono text-ink/40">Tap to add</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_DETAILS.map((detail) => (
                            <button
                              key={detail}
                              type="button"
                              onClick={() => addDetail(detail)}
                              className="px-3.5 py-1.5 rounded-xl bg-ink/[0.03] dark:bg-white/[0.05] border border-ink/[0.08] dark:border-white/10 hover:bg-accent/10 hover:border-accent/40 text-xs sm:text-sm font-semibold text-ink/80 hover:text-accent shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="text-accent font-bold">+</span>
                              <span>{detail}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reporting Privacy Mode Selector (Clear, Friendly, Empowering) */}
                      <div className="p-5 rounded-3xl bg-panel border border-ink/[0.08] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent" />
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink/80">
                              Reporting Privacy Mode
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-ink/5 dark:bg-white/10 text-ink/60">
                            {isGhostMode ? "Anonymous Active" : "Verified Account"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Civic Mode Option */}
                          <button
                            type="button"
                            onClick={() => handleGhostModeToggle(false)}
                            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                              !isGhostMode
                                ? "bg-accent/10 border-accent ring-2 ring-accent/30 shadow-xs"
                                : "bg-ink/[0.02] border-ink/10 opacity-70 hover:opacity-100 hover:border-ink/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg">👤</span>
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                !isGhostMode ? "border-accent bg-accent" : "border-ink/30"
                              }`}>
                                {!isGhostMode && <span className="w-1.5 h-1.5 rounded-full bg-page" />}
                              </span>
                            </div>
                            <div>
                              <p className={`text-xs sm:text-sm font-bold ${!isGhostMode ? "text-accent" : "text-ink"}`}>
                                Civic Mode
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-ink/60 mt-0.5 leading-snug">
                                Submits with your verified account. Track easily on any phone.
                              </p>
                            </div>
                          </button>

                          {/* Ghost Mode Option */}
                          <button
                            type="button"
                            onClick={() => handleGhostModeToggle(true)}
                            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                              isGhostMode
                                ? "bg-teal-500/15 border-teal-500 ring-2 ring-teal-500/40 shadow-xs"
                                : "bg-ink/[0.02] border-ink/10 opacity-70 hover:opacity-100 hover:border-ink/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg">👻</span>
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isGhostMode ? "border-teal-500 bg-teal-500" : "border-ink/30"
                              }`}>
                                {isGhostMode && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                            </div>
                            <div>
                              <p className={`text-xs sm:text-sm font-bold ${isGhostMode ? "text-teal-600 dark:text-teal-400" : "text-ink"}`}>
                                Ghost Mode
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-ink/60 mt-0.5 leading-snug">
                                100% Anonymous. No one can see your name or track you.
                              </p>
                            </div>
                          </button>
                        </div>

                        {/* Reassuring Helper Callout */}
                        <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 transition-colors ${
                          isGhostMode
                            ? "bg-teal-500/10 text-teal-950 dark:text-teal-200 border border-teal-500/20"
                            : "bg-ink/[0.03] text-ink/70 border border-ink/5"
                        }`}>
                          {isGhostMode ? (
                            <EyeOff className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          )}
                          <p className="text-[11px] leading-relaxed">
                            {isGhostMode ? (
                              <span>
                                <strong>Safe & Private:</strong> Use this if you want to stay completely anonymous. All camera and personal information are stripped from the photo before sending.
                              </span>
                            ) : (
                              <span>
                                <strong>Verified Citizen:</strong> This report is securely tied to your profile so you can manage case progress right in your dashboard.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Large Continue to Camera Action Button (Always Clickable) */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleContinueToCamera}
                          className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-ink text-page font-bold text-base sm:text-lg hover:-translate-y-1 active:translate-y-0 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] cursor-pointer"
                        >
                          Continue to Camera
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Evidence Photo Capture */}
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
                        <h2 className="text-xl font-black text-ink">2. Capture Evidence Photo</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          Real-time evidentiary capture with chain-of-custody integrity.
                        </p>
                      </div>
                      {base64Image && (
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-ink/15 hover:bg-ink/[0.04] text-xs sm:text-sm font-bold text-ink transition-all font-mono cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retake Photo
                        </button>
                      )}
                    </div>

                    {base64Image ? (
                      /* Captured Photo Preview */
                      <div className="relative rounded-3xl overflow-hidden border border-ink/10 bg-black/95 max-h-[420px] flex items-center justify-center shadow-lg">
                        <NextImage
                          src={base64Image}
                          alt="Evidence Snapshot"
                          width={900}
                          height={500}
                          className="max-h-[420px] w-full object-contain"
                        />
                        <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                          <Check className="w-4 h-4" />
                          Evidentiary Photo Locked
                        </div>
                      </div>
                    ) : (
                      /* Open Camera CTA — clean card with big action button */
                      <div className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-3xl border-2 border-dashed border-ink/15 bg-gradient-to-b from-ink/[0.02] to-ink/[0.06] dark:from-white/[0.02] dark:to-white/[0.06] space-y-6">
                        <div className="w-24 h-24 rounded-[2rem] bg-accent/15 text-accent flex items-center justify-center shadow-lg shadow-accent/10">
                          <Camera className="w-12 h-12" />
                        </div>
                        <div className="text-center space-y-1.5 max-w-sm">
                          <h3 className="text-lg sm:text-xl font-black text-ink">Open Camera</h3>
                          <p className="text-sm text-ink/55 leading-relaxed">
                            Tap the button below to open a fullscreen camera and capture evidence for your report.
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
                          className="px-10 py-4 rounded-2xl bg-ink text-page font-bold text-base sm:text-lg inline-flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer"
                        >
                          <Camera className="w-6 h-6" />
                          Open Camera
                        </button>
                        {camera.error && (
                          <p className="text-sm text-rose-500 font-mono mt-2 px-6 text-center">
                            {camera.error === "NOT_ALLOWED" ? getBrowserInstructions() : camera.errorMessage}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step 2 Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-ink/5">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-ink/10 text-sm font-bold text-ink/70 hover:text-ink hover:bg-ink/[0.03] transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Details
                      </button>

                      <button
                        type="button"
                        disabled={!base64Image}
                        onClick={() => setStep(3)}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-ink text-page font-bold text-base hover:-translate-y-px transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
                      >
                        Continue to Location
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Location & Submit (2-Column Full-Width Layout) */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column (7 cols): Full Interactive GeoTagMap */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <h2 className="text-xl font-black text-ink">3. Verify Incident Location</h2>
                        <p className="text-sm text-ink/60 mt-0.5">
                          Drag pin or click on map to set precise incident location.
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
                        height="520px"
                      />
                    </div>

                    {/* Right Column (5 cols): Address Card + Review Tile + Submit Button */}
                    <div className="lg:col-span-5 space-y-5 flex flex-col justify-between min-h-[520px]">
                      <div className="space-y-4">
                        {/* Identified Location Card */}
                        <div className="p-5 rounded-3xl bg-panel border border-accent/30 shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-start justify-between gap-4">
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

                        {/* Review Summary Card */}
                        <div className="p-5 rounded-3xl bg-panel border border-ink/[0.08] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/60">
                            <ShieldCheck className="w-4 h-4 text-accent" />
                            Evidence & Protocol Summary
                          </div>

                          <div className="flex items-center gap-4">
                            {base64Image && (
                              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black shrink-0 border border-ink/10 shadow-md">
                                <NextImage
                                  src={base64Image}
                                  alt="Snapshot Preview"
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-bold text-ink">{selectedCategory?.label || reportType}</span>
                                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                                  isGhostMode
                                    ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                                    : "bg-accent/15 text-accent border border-accent/20"
                                }`}>
                                  {isGhostMode ? "Ghost Mode" : "Civic Verified"}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-ink/70 line-clamp-3 leading-relaxed">
                                {description || "Evidence captured and ready for immediate agency dispatch."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 Actions */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex items-center gap-2 px-5 py-4 rounded-2xl border border-ink/10 hover:border-ink/25 text-sm font-bold text-ink/80 hover:text-ink hover:bg-ink/[0.03] transition-all shrink-0 cursor-pointer shadow-xs"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting || isTriaging || !base64Image}
                          onClick={() => handleSubmit()}
                          className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-ink text-page font-bold text-base sm:text-lg hover:-translate-y-1 active:translate-y-0 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Dispatching...
                            </>
                          ) : isTriaging ? (
                            <>
                              <Sparkles className="w-5 h-5 animate-spin text-accent" />
                              AI Triage...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              Submit Report
                            </>
                          )}
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

            {/* Flip Camera — top left */}
            <button
              type="button"
              onClick={() => camera.switchCamera()}
              disabled={camera.isLoading}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all z-10 cursor-pointer"
              aria-label="Switch Camera"
            >
              <RotateCcw className="w-5 h-5" />
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
    </>
  );
}
