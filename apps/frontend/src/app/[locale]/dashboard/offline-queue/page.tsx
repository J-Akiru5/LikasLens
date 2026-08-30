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
import { showToast, EmptyState, submitCitizenReport } from "@likaslens/shared";
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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function OfflineQueuePage() {
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
    return () => document.removeEventListener("visibilitychange", handleVisibility);
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
        showToast(
          `Synced ${result.succeeded} of ${result.total}.`,
          "success",
        );
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

  const handleRemove = useCallback(async (id: string) => {
    await removeQueued(id);
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearQueue();
    setQueue([]);
    showToast("Queue cleared.", "info");
  }, []);

  if (loading) {
    return (
      <DashboardLayoutWrapper pageTitle="Offline Queue">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green" />
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper pageTitle="Offline Queue">
      <div className="space-y-6">
        {/* Header with count + clear button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-ink/40 uppercase tracking-wider mb-1">
              Queue Status
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Offline Queue
              {queue.length > 0 && (
                <span className="ml-2 text-sm font-mono text-ink/40 font-normal">
                  {queue.length} report{queue.length !== 1 ? "s" : ""} pending
                </span>
              )}
            </h1>
          </div>
          {queue.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 border border-ink/10 text-sm text-ink/50 hover:text-ink transition-colors rounded-lg"
              aria-label="Clear all queued reports"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        {/* Offline explanation banner */}
        {queue.length > 0 && !navigator.onLine && (
          <div className="flex items-center gap-3 p-4 border border-ink/10 rounded-xl bg-ink/[0.02]">
            <WifiOff className="w-5 h-5 text-ink/40 flex-shrink-0" />
            <p className="font-mono text-xs text-ink/50">
              You are offline. Reports will sync when a connection is available.
            </p>
          </div>
        )}

        {/* Sync progress summary */}
        {progress && (
          <div className="border border-accent/20 rounded-xl p-5 bg-accent/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-ink">Sync complete</span>
              <span className="font-mono text-xs text-ink/50">
                {progress.succeeded}/{progress.total}
              </span>
            </div>
            <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.total > 0 ? (progress.succeeded / progress.total) * 100 : 0}%`,
                  background:
                    progress.failed > 0
                      ? "linear-gradient(90deg, var(--green), var(--amber))"
                      : "var(--green)",
                }}
              />
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-green">✓ {progress.succeeded} synced</span>
              {progress.failed > 0 && (
                <span className="text-red">✗ {progress.failed} failed</span>
              )}
              {progress.skipped > 0 && (
                <span className="text-ink/40">– {progress.skipped} skipped</span>
              )}
            </div>
          </div>
        )}

        {/* Queue list or empty state */}
        {queue.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="No offline reports waiting to sync. When you submit a report without internet, it will appear here."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => {
              const payload = item.payload;
              const typeLabel = getTypeLabel(payload);
              const description = (payload.description as string) ?? "";
              const lat = payload.latitude as number | undefined;
              const lng = payload.longitude as number | undefined;
              const hasGps = lat != null && lng != null;

              return (
                <div
                  key={item.id}
                  className="border border-ink/10 rounded-xl p-5 bg-panel hover:border-ink/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5 text-accent" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Type label + status */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">
                          {typeLabel}
                        </span>
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
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink/30" />
                        <span className="font-mono text-xs text-ink/40">
                          {timeAgo(item.queuedAt)}
                        </span>
                      </div>

                      {/* GPS */}
                      {hasGps && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-ink/30" />
                          <span className="font-mono text-xs text-ink/40">
                            {lat!.toFixed(4)}, {lng!.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {/* Description preview */}
                      {description && (
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-ink/30 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-ink/50 leading-relaxed">
                            {truncate(description, 100)}
                          </span>
                        </div>
                      )}

                      {/* Error message */}
                      {item.lastError && (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red/[0.04]">
                          <XCircle className="w-3.5 h-3.5 text-red mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-red/80 leading-relaxed">
                            {truncate(item.lastError, 120)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-lg hover:bg-ink/5 transition-colors flex-shrink-0"
                      aria-label="Remove queued report"
                    >
                      <X className="w-4 h-4 text-ink/30" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sync Now bar (sticky at bottom) */}
        {queue.length > 0 && (
          <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-t border-ink/10 bg-page/90 backdrop-blur-lg">
            <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
              {/* Batch info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink">
                  {queue.length > BATCH_SIZE
                    ? `Syncing ${BATCH_SIZE} of ${queue.length} per batch`
                    : `${queue.length} report${queue.length !== 1 ? "s" : ""} to sync`}
                </p>
                {queue.length > BATCH_SIZE && (
                  <p className="font-mono text-xs text-ink/40 mt-0.5">
                    {Math.ceil(queue.length / BATCH_SIZE)} batch
                    {Math.ceil(queue.length / BATCH_SIZE) > 1 ? "es" : ""} total
                  </p>
                )}
              </div>

              <button
                onClick={handleSyncNow}
                disabled={syncing || !navigator.onLine}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-white hover:opacity-90"
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
      </div>
    </DashboardLayoutWrapper>
  );
}
