"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Camera, MapPin, Fingerprint, RefreshCw, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCamera } from "@/hooks/useCamera";
import { ToastContainer, showToast, EmptyState, Skeleton } from "@likaslens/shared";
import { EdgeInterceptorModal } from "@/components/modals/edge-interceptor-modal";
import { GeoTagMap } from "@/components/maps/geo-tag-map";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { CustomSelect } from "@/components/ui/custom-select";

const INCIDENT_TYPES = [
  { value: "illegal_logging", label: "Illegal Logging" },
  { value: "water_pollution", label: "Water Pollution" },
  { value: "illegal_fishing", label: "Illegal Fishing" },
  { value: "waste_dumping", label: "Waste Dumping" },
  { value: "wildlife_poaching", label: "Wildlife Poaching" },
  { value: "mining_violation", label: "Mining Violation" },
  { value: "air_pollution", label: "Air Pollution" },
  { value: "land_encroachment", label: "Land Encroachment" },
  { value: "other", label: "Other" },
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
  const [base64Image, setBase64Image] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageIndicators, setTriageIndicators] = useState<string[]>([]);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState("");
  const [useMapPinning, setUseMapPinning] = useState(false);

  const offlineQueueKey = "likaslens_offline_reports";
  const offlineDbName = "likaslens-offline";
  const offlineStoreName = "report-queue";

  const camera = useCamera("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !camera.stream) return;
    video.srcObject = camera.stream;
    video.play().catch(() => {});
  }, [camera.stream]);

  useEffect(() => {
    // Initial sync
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "ghost") setIsGhostMode(true);
    
    // Watch for theme changes triggered externally
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

  // When the user explicitly toggles Ghost Mode on THIS page, update global state
  const handleGhostModeToggle = (checked: boolean) => {
    setIsGhostMode(checked);
    const newTheme = checked ? "ghost" : "civic";
    document.documentElement.setAttribute("data-theme", newTheme);
    try { localStorage.setItem("likaslens-theme", newTheme); } catch {}
    (window as any).updateThemeColor?.();
  };

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
          const cleaned = canvas.toDataURL();
          resolve(cleaned);
        } catch {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const openOfflineDb = useCallback(
    () =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(offlineDbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(offlineStoreName)) {
            db.createObjectStore(offlineStoreName, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
    [offlineDbName, offlineStoreName]
  );

  const queueOfflineReport = async (payload: Record<string, unknown>) => {
    const queuedPayload = { ...payload, queuedAt: new Date().toISOString() };
    try {
      const db = await openOfflineDb();
      const tx = db.transaction(offlineStoreName, "readwrite");
      const store = tx.objectStore(offlineStoreName);
      store.put({ id: crypto.randomUUID(), payload: queuedPayload });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return;
    } catch {
      const existing = localStorage.getItem(offlineQueueKey);
      const queue = existing ? JSON.parse(existing) : [];
      queue.push(queuedPayload);
      localStorage.setItem(offlineQueueKey, JSON.stringify(queue));
    }
  };

  const flushOfflineQueue = useCallback(async () => {
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const queued: Array<{ id: string; payload: Record<string, unknown> }> = [];

    try {
      const db = await openOfflineDb();
      const tx = db.transaction(offlineStoreName, "readonly");
      const store = tx.objectStore(offlineStoreName);
      const request = store.getAll();
      const items = await new Promise<Array<{ id: string; payload: Record<string, unknown> }>>(
        (resolve, reject) => {
          request.onsuccess = () => resolve(request.result as Array<{ id: string; payload: Record<string, unknown> }>);
          request.onerror = () => reject(request.error);
        }
      );
      queued.push(...items);
    } catch {
      const existing = localStorage.getItem(offlineQueueKey);
      const items = existing ? JSON.parse(existing) : [];
      queued.push(...items.map((payload: Record<string, unknown>, idx: number) => ({ id: String(idx), payload })));
    }

    if (!queued.length) return;

    const successfulIds: string[] = [];
    for (const item of queued) {
      try {
        const response = await fetch(`${laravelUrl}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (response.ok) successfulIds.push(item.id);
      } catch {
        // keep queued
      }
    }

    try {
      const db = await openOfflineDb();
      const tx = db.transaction(offlineStoreName, "readwrite");
      const store = tx.objectStore(offlineStoreName);
      successfulIds.forEach((id) => store.delete(id));
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const existing = localStorage.getItem(offlineQueueKey);
      const items = existing ? JSON.parse(existing) : [];
      const remaining = items.filter((_: unknown, idx: number) => !successfulIds.includes(String(idx)));
      localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
    }
  }, [openOfflineDb, offlineQueueKey, offlineStoreName]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); void flushOfflineQueue(); showToast("Connection restored. Syncing queued reports.", "success"); };
    const handleOffline = () => { setIsOnline(false); showToast("Connection lost. Reports will queue until you are back online.", "error"); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushOfflineQueue]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setBase64Image(dataUrl);
    camera.stop();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setLatitude(position.coords.latitude); setLongitude(position.coords.longitude); },
        () => { setShowManualCoords(true); showToast("Could not get GPS location. Enter coordinates manually below.", "info"); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setShowManualCoords(true);
    }
  }, [camera]);

  const handleFileCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setBase64Image(dataUrl);
      camera.stop();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          () => {
            setShowManualCoords(true);
            showToast("Could not get GPS location. Enter coordinates manually below.", "info");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setShowManualCoords(true);
      }
    };
    reader.readAsDataURL(file);
  }, [camera]);

  const clearForm = () => {
    setBase64Image("");
    setLatitude(null);
    setLongitude(null);
    setShowManualCoords(false);
    setManualLat("");
    setManualLng("");
    setDescription("");
    setReportType("");
    setUseMapPinning(false);
    setTriageIndicators([]);
    setIsModalOpen(false);
    camera.stop();
  };

  const finalizeSubmission = async (cleanedImage: string) => {
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";
    let userId: string | undefined = undefined;
    if (!isGhostMode) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch { /* continue anonymously */ }
    }

    const payload: Record<string, unknown> = { base64Image: cleanedImage, latitude, longitude };
    if (description.trim()) payload.description = description.trim();
    if (reportType) payload.report_type = reportType;
    if (!isGhostMode && userId) payload.user_id = userId;

    if (!navigator.onLine) {
      await queueOfflineReport(payload);
      showToast("You are offline. Report queued securely.", "info");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch(`${laravelUrl}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    showToast(responseData.message || "Report submitted successfully!", "success");
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!base64Image) { showToast("Please capture a photo first.", "error"); return; }
    setIsSubmitting(true);
    const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";

    try {
      const cleanedImage = await stripExif(base64Image);

      if (!isGhostMode && navigator.onLine) {
        setIsTriaging(true);
        try {
          const triageRes = await fetch(`${laravelUrl}/reports/triage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Image: cleanedImage }),
          });
          if (triageRes.ok) {
            const triageData = await triageRes.json();
            if (triageData.has_concern) {
              setTriageIndicators(triageData.indicators.map((i: { label?: string; type?: string }) => i.label || i.type));
              setIsModalOpen(true);
              setIsSubmitting(false);
              setIsTriaging(false);
              return;
            }
          }
        } catch (err) { console.error("Triage pre-check failed:", err); }
        finally { setIsTriaging(false); }
      }

      await finalizeSubmission(cleanedImage);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error submitting report. Check console.", "error");
    } finally { setIsSubmitting(false); }
  };

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

      <DashboardLayoutWrapper>
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3a7d54]" />
              <span className="font-mono text-xs text-ink/40 uppercase tracking-wider">Report an Issue</span>
            </div>
            <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl text-ink">Document the Problem</h1>
            <p className="font-mono text-sm text-ink/50">Your evidence helps protect our earth. Every photo, every detail counts.</p>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 p-3 border border-ink/10 font-mono text-xs text-ink/50">
              <span className="h-2 w-2 rounded-full bg-ink/30" />
              Offline &mdash; reports will queue until connection returns.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
                <Camera className="w-4 h-4 text-ink/40" />
                Evidence Photo
              </h2>

              {base64Image ? (
                <div className="border border-ink/10 p-4 rounded-xl">
                  <NextImage src={base64Image} alt="Report Evidence" width={800} height={600} className="max-h-64 w-full object-contain" />
                </div>
              ) : camera.isActive ? (
                <div className="relative bg-black/90 border border-ink/10 overflow-hidden rounded-xl">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <button type="button" onClick={capturePhoto} aria-label="Capture photo" className="px-5 py-2.5 bg-ink text-page text-sm font-medium hover:-translate-y-px shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
                      <Camera className="w-4 h-4" aria-hidden="true" /> Capture
                    </button>
                    <button type="button" onClick={() => camera.stop()} aria-label="Cancel camera" className="px-5 py-2.5 border border-ink/10 text-sm text-ink/60 hover:text-ink transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : camera.isLoading ? (
                <div className="border border-ink/10 rounded-xl overflow-hidden">
                  <Skeleton className="w-full aspect-video rounded-none" />
                  <div className="flex justify-center gap-3 p-4">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[240px] group rounded-2xl border border-dashed border-ink/10 bg-ink/[0.015]">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-ink/[0.04] text-ink/40 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                      <Camera className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-medium text-ink mb-1.5">Evidence Photo</h3>
                    <p className="text-sm text-ink/50 max-w-sm leading-relaxed mx-auto mb-6">
                      Upload an existing photo from your gallery or capture a new one using your camera.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <label className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 rounded-lg border border-ink/10 text-ink/70 text-sm font-medium hover:text-ink hover:bg-ink/[0.02] transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-accent/40">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileCapture}
                          className="sr-only"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => camera.start()}
                        className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-page text-sm font-medium hover:-translate-y-px shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                      >
                        <Camera className="w-4 h-4" />
                        Open Camera
                      </button>
                    </div>
                  </div>
                  {camera.error && (
                    <p className="font-mono text-xs text-red-500/80 text-center max-w-md mx-auto">
                      {camera.error === "NOT_ALLOWED" ? getBrowserInstructions() : camera.errorMessage}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ink/40" />
                Location Data
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div className="border border-ink/10 p-4 space-y-2 rounded-lg">
                  <span className="font-mono text-xs text-ink/40 uppercase tracking-wide">Latitude</span>
                  <p className="font-mono text-lg text-ink">{latitude?.toFixed(6) ?? "\u2014"}</p>
                  {showManualCoords && (
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="e.g. 11.7053"
                      aria-label="Latitude coordinate"
                      value={manualLat}
                      onChange={(e) => { setManualLat(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val) && val >= -90 && val <= 90) setLatitude(val); }}
                      className="w-full px-3 py-2 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none rounded-lg mt-2"
                    />
                  )}
                </div>
                <div className="border border-ink/10 p-4 space-y-2 rounded-lg">
                  <span className="font-mono text-xs text-ink/40 uppercase tracking-wide">Longitude</span>
                  <p className="font-mono text-lg text-ink">{longitude?.toFixed(6) ?? "\u2014"}</p>
                  {showManualCoords && (
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="e.g. 122.2970"
                      aria-label="Longitude coordinate"
                      value={manualLng}
                      onChange={(e) => { setManualLng(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val) && val >= -180 && val <= 180) setLongitude(val); }}
                      className="w-full px-3 py-2 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none rounded-lg mt-2"
                    />
                  )}
                </div>
              </div>
              {!showManualCoords && (
                <button type="button" onClick={() => setShowManualCoords(true)} aria-label="Enter coordinates manually" className="font-mono text-xs text-ink/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                  Enter coordinates manually
                </button>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-ink/40" />
                  Pin on Map
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={useMapPinning} onChange={(e) => setUseMapPinning(e.target.checked)} className="w-4 h-4 accent-green" />
                  <span className="font-mono text-xs text-ink/40 uppercase tracking-wide">Enable Map</span>
                </label>
              </div>
              {useMapPinning ? (
                <GeoTagMap initialLat={latitude} initialLng={longitude} onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} height="320px" />
              ) : (
                <EmptyState
                  icon={MapPin}
                  title="Map pinning is disabled"
                  description={'Toggle "Enable Map" above to pin your exact location on the map.'}
                  className="border border-ink/10 rounded-xl"
                />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink/40" />
                Incident Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">Incident Type</label>
                  <CustomSelect
                    value={reportType}
                    onChange={setReportType}
                    options={INCIDENT_TYPES}
                    placeholder="-- Select Incident Type --"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you observed..."
                    rows={5}
                    maxLength={2000}
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 resize-y min-h-[120px] rounded-lg"
                  />
                  <p className="font-mono text-xs text-ink/30 mt-1 text-right">{description.length}/2000</p>
                </div>
              </div>
            </section>

            <label className={`cursor-pointer block border p-5 rounded-xl transition-all duration-300 ${isGhostMode ? "border-[#2EE6C8]/30 bg-[#2EE6C8]/5 shadow-[0_0_15px_rgba(46,230,200,0.1)]" : "border-ink/10 hover:border-ink/20 hover:bg-ink/[0.01]"}`}>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <Fingerprint className={`w-5 h-5 transition-colors ${isGhostMode ? "text-[#2EE6C8]" : "text-ink/40"}`} />
                  <div>
                    <p className={`font-semibold tracking-tight text-base transition-colors ${isGhostMode ? "text-[#2EE6C8]" : "text-ink"}`}>Ghost Mode</p>
                    <p className="font-mono text-xs text-ink/50">Send anonymously. Remove all identifying data.</p>
                  </div>
                </div>
                <div className="inline-flex items-center" aria-label="Toggle Ghost Mode">
                  <input type="checkbox" checked={isGhostMode} onChange={(e) => handleGhostModeToggle(e.target.checked)} className="w-4 h-4 accent-[#2EE6C8] cursor-pointer" />
                </div>
              </div>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <button type="button" onClick={clearForm} aria-label="Clear form" className="py-3 border border-ink/10 text-sm text-ink/50 hover:text-ink transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isTriaging || !base64Image || latitude === null || longitude === null}
                aria-label="Submit report"
                className="py-3 bg-ink text-page text-sm font-medium hover:-translate-y-px shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                {isSubmitting ? "Submitting..." : isTriaging ? "Analyzing..." : "Submit Report"}
              </button>
            </div>
          </form>
            </div>
      </DashboardLayoutWrapper>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </>
  );
}
