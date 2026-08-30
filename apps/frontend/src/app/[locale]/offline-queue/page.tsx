"use client";

import { useCallback, useEffect, useState } from "react";
import {
  WifiOff,
  RefreshCw,
  Trash2,
  Clock,
  MapPin,
  FileText,
  Camera,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
} from "lucide-react";
import { showToast, submitCitizenReport, EmptyState } from "@likaslens/shared";
import { useParams } from "next/navigation";
import {
  getAllQueued,
  removeQueued,
  clearQueue,
  syncBatch,
  type QueuedReport,
  type SyncProgress,
} from "@likaslens/shared";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

const BATCH_SIZE = 5;

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  waste_dumping: "Illegal Dumping",
  water_pollution: "Water Pollution",
  air_pollution: "Air Pollution",
  illegal_logging: "Deforestation",
  wildlife_poaching: "Wildlife Threat",
  mining_violation: "Mining Violation",
  other: "Other",
};

function getTypeLabel(payload: Record<string, unknown>): string {
  const t = payload.report_type as string | undefined;
  return t ? INCIDENT_TYPE_LABELS[t] ?? t.replace(/_/g, " ") : "Unknown";
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const date = new Date(iso).getTime();
  if (isNaN(date)) return "";
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function OfflineQueuePage() {
  const params = useParams();

  const [queue, setQueue] = useState<QueuedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getAllQueued();
      items.sort(
        (a, b) =>
          new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime(),
      );
      setQueue(items);
    } catch {
      showToast("Failed to load queue", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Refresh queue when user returns to this tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadQueue();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadQueue]);

  const handleSyncNow = useCallback(async () => {
    if (syncing || queue.length === 0) return;
    setSyncing(true);
    setProgress(null);

    try {
      const postFn = (payload: Record<string, unknown>) =>
        submitCitizenReport(payload as any);
      const result = await syncBatch(postFn, BATCH_SIZE);
      setProgress(result);

      if (result.succeeded > 0) {
        showToast(`Synced ${result.succeeded} of ${result.total}.`, "success");
      }
      if (result.failed > 0) {
        showToast(
          `${result.failed} failed — they remain in your queue for retry.`,
          "error",
        );
      }

      await loadQueue();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Sync failed",
        "error",
      );
    } finally {
      setSyncing(false);
    }
  }, [syncing, queue.length, loadQueue]);

  const handleRemove = useCallback(
    async (id: string) => {
      await removeQueued(id);
      setQueue((prev) => prev.filter((item) => item.id !== id));
    },
    [],
  );

  const handleClearAll = useCallback(async () => {
    await clearQueue();
    setQueue([]);
    showToast("Queue cleared.", "info");
  }, []);

  const offlineBanner = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber/20 bg-amber/5">
      <WifiOff className="w-4 h-4 text-amber shrink-0" />
      <p className="text-xs text-ink/60 m-0">
        You are offline. Reports will sync when a connection is available.
      </p>
    </div>
  );

  const syncProgressBanner = progress && (
    <div className="p-4 rounded-xl border border-accent/25 bg-accent/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink">Sync complete</span>
        <span className="font-mono text-xs text-ink/50">
          {progress.succeeded}/{progress.total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ink/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${
              progress.total > 0
                ? (progress.succeeded / progress.total) * 100
                : 0
            }%`,
            background:
              progress.failed > 0
                ? "linear-gradient(90deg, var(--green), var(--amber))"
                : "var(--green)",
          }}
        />
      </div>
      <div className="flex gap-4 mt-2">
        <span className="font-mono text-xs text-green">
          ✓ {progress.succeeded} synced
        </span>
        {progress.failed > 0 && (
          <span className="font-mono text-xs text-red">
            ✗ {progress.failed} failed
          </span>
        )}
        {progress.skipped > 0 && (
          <span className="font-mono text-xs text-ink/40">
            – {progress.skipped} skipped
          </span>
        )}
      </div>
    </div>
  );

  const queueList = queue.map((item) => {
    const payload = item.payload;
    const typeLabel = getTypeLabel(payload);
    const description = (payload.description as string) ?? "";
    const lat = payload.latitude as number | undefined;
    const lng = payload.longitude as number | undefined;
    const hasGps = lat != null && lng != null;

    return (
      <div
        key={item.id}
        className="flex items-start gap-3 p-4 border border-ink/10 rounded-xl bg-panel"
      >
        {/* Type icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-accent/10">
          <Camera className="w-[18px] h-[18px] text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Type label + status */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">{typeLabel}</span>
            {item.lastError ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red/10 text-red">
                Failed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-ink/5 text-ink/50">
                Pending
              </span>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-ink/30" />
            <span className="font-mono text-[11px] text-ink/30">
              {timeAgo(item.queuedAt)}
            </span>
          </div>

          {/* GPS */}
          {hasGps && (
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-3 h-3 text-ink/30" />
              <span className="font-mono text-[11px] text-ink/30">
                {lat!.toFixed(4)}, {lng!.toFixed(4)}
              </span>
            </div>
          )}

          {/* Description preview */}
          {description && (
            <div className="flex items-start gap-1.5">
              <FileText className="w-3 h-3 text-ink/30 mt-0.5 shrink-0" />
              <span className="text-xs text-ink/50 leading-snug">
                {truncate(description, 80)}
              </span>
            </div>
          )}

          {/* Error message */}
          {item.lastError && (
            <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-red/5">
              <XCircle className="w-3 h-3 text-red mt-0.5 shrink-0" />
              <span className="text-[11px] text-red leading-tight">
                {truncate(item.lastError, 100)}
              </span>
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={() => handleRemove(item.id)}
          className="touch-target p-2 rounded-full hover:bg-ink/5 transition-colors shrink-0"
          aria-label="Remove queued report"
        >
          <X className="w-3.5 h-3.5 text-ink/30" />
        </button>
      </div>
    );
  });

  return (
    <DashboardLayoutWrapper
      pageTitle="Offline Queue"
      pageSubtitle={
        queue.length > 0
          ? `${queue.length} report${queue.length !== 1 ? "s" : ""} pending`
          : undefined
      }
    >
      <div className="space-y-6 pb-12 pt-2 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Offline Queue
            </h1>
            {queue.length > 0 && (
              <p className="text-xs font-medium text-ink/50 mt-1">
                {queue.length} report{queue.length !== 1 ? "s" : ""} pending
              </p>
            )}
          </div>
          {queue.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ink/50 hover:text-ink transition-colors rounded-lg hover:bg-ink/5"
              aria-label="Clear all queued reports"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-4">
            {/* Offline banner */}
            {queue.length > 0 && !navigator.onLine && offlineBanner}

            {/* Sync progress */}
            {syncProgressBanner}

            {/* Queue list or empty state */}
            {queue.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up"
                description="No offline reports waiting to sync. When you submit a report without internet, it will appear here."
                className="mt-16"
              />
            ) : (
              <div className="space-y-3">{queueList}</div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom bar with Sync Now button */}
      {queue.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 border-t border-ink/10 bg-page/85 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink m-0">
                {queue.length > BATCH_SIZE
                  ? `Syncing ${BATCH_SIZE} of ${queue.length} per batch`
                  : `${queue.length} report${queue.length !== 1 ? "s" : ""} to sync`}
              </p>
              {queue.length > BATCH_SIZE && (
                <p className="text-[11px] text-ink/40 mt-0.5 m-0">
                  {Math.ceil(queue.length / BATCH_SIZE)} batch
                  {Math.ceil(queue.length / BATCH_SIZE) > 1 ? "es" : ""} total
                </p>
              )}
            </div>

            <button
              onClick={handleSyncNow}
              disabled={syncing || !navigator.onLine}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              style={{
                background: syncing
                  ? "var(--ink)"
                  : "var(--accent)",
                color: syncing ? "var(--page)" : "#fff",
              }}
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : !navigator.onLine ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  Offline
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </DashboardLayoutWrapper>
  );
}
