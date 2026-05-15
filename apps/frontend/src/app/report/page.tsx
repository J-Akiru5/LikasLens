"use client";

import { useCallback, useEffect, useState } from "react";
import NextImage from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Camera, MapPin, Fingerprint, AlertCircle, CameraOff } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { EdgeInterceptorModal } from "@/components/modals/edge-interceptor-modal";
import { Toast, type ToastTone, Spinner } from "@/components/ui/toast";

export default function ReportPage() {
  const [base64Image, setBase64Image] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [isGhostMode, setIsGhostMode] = useState(false);

  const cam = useCamera("environment");
  const videoRef = useRef<HTMLVideoElement>(null);

  const offlineQueueKey = "likaslens_offline_reports";
  const offlineDbName = "likaslens-offline";
  const offlineStoreName = "report-queue";

  useEffect(() => {
    if (cam.stream && videoRef.current) {
      videoRef.current.srcObject = cam.stream;
    }
  }, [cam.stream]);

  const capturePhoto = async () => {
    await cam.start();
    await new Promise((r) => setTimeout(r, 500));
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    setBase64Image(canvas.toDataURL("image/jpeg", 0.8));
    cam.stop();
  };

  const clearForm = () => {
    setBase64Image("");
    setLatitude(null);
    setLongitude(null);
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const stripExif = async (base64: string) => {
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
          resolve(canvas.toDataURL());
        } catch { resolve(base64); }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const openOfflineDb = useCallback(
    () => new Promise<IDBDatabase>((resolve, reject) => {
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
    [offlineDbName, offlineStoreName],
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
    } catch {
      const existing = localStorage.getItem(offlineQueueKey);
      const queue = existing ? JSON.parse(existing) : [];
      queue.push(queuedPayload);
      localStorage.setItem(offlineQueueKey, JSON.stringify(queue));
    }
  };

  const flushOfflineQueue = useCallback(async () => {
    const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://127.0.0.1:8000";
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
        },
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
        const response = await fetch(`${laravelUrl}/api/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (response.ok) successfulIds.push(item.id);
      } catch { /* keep queued */ }
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
    const handleOnline = () => { void flushOfflineQueue(); };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [flushOfflineQueue]);

  const doSubmit = async (asGhost: boolean) => {
    setIsSubmitting(true);
    setToastMsg("");
    try {
      const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";
      const cleanedImage = await stripExif(base64Image);

      let userId: string | undefined;
      if (!asGhost) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        } catch { /* continue anonymously */ }
      }

      const payload: Record<string, unknown> = {
        base64Image: cleanedImage,
        latitude,
        longitude,
      };
      if (!asGhost && userId) payload.user_id = userId;

      if (!navigator.onLine) {
        await queueOfflineReport(payload);
        setToastMsg("Offline. Report queued and will sync when connection returns.");
        setToastTone("info");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${laravelUrl}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      setToastMsg(responseData.message || "Report submitted!");
      setToastTone("success");
      clearForm();

      if (responseData.data?.triage?.has_concern && !asGhost) {
        setShowEdgeModal(true);
      }
    } catch (error) {
      setToastMsg(error instanceof Error ? error.message : "Submission failed");
      setToastTone("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    doSubmit(isGhostMode);
  };

  const handleEdgeProceed = () => {
    setShowEdgeModal(false);
    setIsGhostMode(true);
    setToastMsg("Switched to Ghost Mode. Your identity is protected.");
    setToastTone("info");
  };

  return (
    <main className={`min-h-screen font-body transition-colors duration-700 ${
      isGhostMode ? "bg-[#081c15]" : "bg-gradient-to-br from-[#1b4332]/10 to-[#2de1c2]/10"
    }`}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary mb-4 bg-background/50 rounded">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Report an Issue</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-primary mb-2">
            Document the Problem
          </h1>
          <p className="text-lg text-foreground/80 font-semibold">
            Your evidence helps protect our earth. Every photo, every detail counts.
          </p>
        </div>

        <Toast
          message={toastMsg}
          tone={toastTone}
          onDismiss={() => setToastMsg("")}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="brutal-panel panel-surface border-4 border-primary p-8">
            <div className="flex items-center gap-3 mb-6">
              <Camera className="w-6 h-6 text-secondary" />
              <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">Evidence Photo</h2>
            </div>

            <div className="bionic-frame p-6 bg-background/40 backdrop-blur-md border-2 border-primary rounded-lg min-h-48 flex items-center justify-center overflow-auto">
              {cam.isActive && (
                <video ref={videoRef} autoPlay playsInline className="max-h-full max-w-full rounded" />
              )}
              {base64Image && !cam.isActive ? (
                <NextImage src={base64Image} alt="Report Evidence" className="max-h-full max-w-full rounded" />
              ) : !cam.isActive ? (
                <div className="text-center">
                  <CameraOff className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                  <p className="text-primary/60 font-mono text-sm">Tap below to open camera</p>
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={cam.isLoading}
                className="flex-1 brutal-button px-4 py-3 font-bold uppercase text-sm rounded-lg transition-all border-2 border-primary bg-primary text-background hover:shadow-[4px_4px_0px_#1b4332] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cam.isLoading ? <Spinner /> : <Camera className="w-4 h-4" />}
                {cam.isLoading ? "Opening Camera..." : base64Image ? "Retake Photo" : "Take Photo"}
              </button>
              <button
                type="button"
                onClick={cam.switchCamera}
                disabled={!cam.isActive}
                className="px-4 py-3 border-2 border-primary text-primary font-bold uppercase text-sm rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                Flip
              </button>
            </div>
            {cam.error && (
              <p className="text-xs text-accent font-mono mt-2">{cam.errorMessage}</p>
            )}
          </div>

          <div className="brutal-panel panel-surface border-4 border-primary p-8">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-secondary" />
              <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">Location Data</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bionic-frame p-4 border-2 border-primary bg-background/50 rounded">
                <p className="text-xs font-mono font-bold text-primary/70 uppercase mb-2">Latitude</p>
                <p className="text-2xl font-mono font-bold text-primary">{latitude?.toFixed(6) ?? "—"}</p>
              </div>
              <div className="bionic-frame p-4 border-2 border-primary bg-background/50 rounded">
                <p className="text-xs font-mono font-bold text-primary/70 uppercase mb-2">Longitude</p>
                <p className="text-2xl font-mono font-bold text-primary">{longitude?.toFixed(6) ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className={`brutal-panel border-4 p-8 transition-colors duration-500 ${
            isGhostMode ? "border-accent bg-[#081c15]/80 shadow-[8px_8px_0px_#ffb703]" : "panel-surface border-primary shadow-[8px_8px_0px_#1b4332]"
          }`}>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Fingerprint className={`w-6 h-6 ${isGhostMode ? "text-accent" : "text-primary"}`} />
                <div>
                  <p className={`font-heading text-xl font-black uppercase tracking-tight ${isGhostMode ? "text-accent" : "text-primary"}`}>
                    Ghost Mode
                  </p>
                  <p className={`text-sm font-semibold ${isGhostMode ? "text-white/80" : "text-foreground/70"}`}>
                    Send anonymously. Remove all identifying data.
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isGhostMode}
                  onChange={(e) => setIsGhostMode(e.target.checked)}
                  className="w-6 h-6 rounded border-2 cursor-pointer"
                  style={{ borderColor: isGhostMode ? "#ffb703" : "#1b4332", accentColor: isGhostMode ? "#ffb703" : "#1b4332" }}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
            className={`w-full brutal-button px-8 py-4 font-heading font-black uppercase text-lg rounded-lg transition-all border-2 flex items-center justify-center gap-3 ${
              isSubmitting || !base64Image || latitude === null || longitude === null
                ? "border-foreground/30 bg-foreground/10 text-foreground/40 cursor-not-allowed"
                : "border-primary bg-primary text-background hover:shadow-[6px_6px_0px_#1b4332]"
            }`}
          >
            {isSubmitting ? (
              <><Spinner className="w-5 h-5" /> Submitting...</>
            ) : (
              <><AlertCircle className="w-5 h-5" /> Submit Report</>
            )}
          </button>
        </form>

        <EdgeInterceptorModal
          isOpen={showEdgeModal}
          onCancel={() => setShowEdgeModal(false)}
          onProceed={handleEdgeProceed}
        />
      </div>
    </main>
  );
}
