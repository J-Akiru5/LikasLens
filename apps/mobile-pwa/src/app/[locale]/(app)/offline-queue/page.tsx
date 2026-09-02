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
  CircleCheck,
  XCircle,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn, showToast, submitCitizenReport, EmptyState } from "@likaslens/shared";
import { useParams, useRouter } from "next/navigation";
import { useHaptics } from "@/hooks/use-haptics";
import {
  getAllQueued,
  removeQueued,
  clearQueue,
  syncBatch,
  type QueuedReport,
  type SyncProgress,
} from "@likaslens/shared";

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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function OfflineQueuePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const haptic = useHaptics();

  const [queue, setQueue] = useState<QueuedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getAllQueued();
      // Sort newest-first
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

  // Refresh queue when user returns to this tab (e.g. after submitting a report)
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
    haptic("medium");

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
        haptic("success");
      }
      if (result.failed > 0) {
        showToast(
          `${result.failed} failed — they remain in your queue for retry.`,
          "error",
        );
      }

      // Reload to show updated queue
      await loadQueue();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Sync failed",
        "error",
      );
    } finally {
      setSyncing(false);
    }
  }, [syncing, queue.length, haptic, loadQueue]);

  const handleRemove = useCallback(
    async (id: string) => {
      haptic("light");
      await removeQueued(id);
      setQueue((prev) => prev.filter((item) => item.id !== id));
    },
    [haptic],
  );

  const handleClearAll = useCallback(async () => {
    haptic("light");
    await clearQueue();
    setQueue([]);
    showToast("Queue cleared.", "info");
  }, [haptic]);

  if (loading) {
    return (
      <div className="min-h-full pb-24 bg-page">
        <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
          <h1 className="ios-large-title ios-large-title--xl">Offline Queue</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-32 bg-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <div>
          <h1 className="ios-large-title ios-large-title--xl">Offline Queue</h1>
          {queue.length > 0 && (
            <p
              className="text-xs font-medium"
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--muted)",
                marginTop: 2,
              }}
            >
              {queue.length} report{queue.length !== 1 ? "s" : ""} pending
            </p>
          )}
        </div>
        {queue.length > 0 && (
          <button
            onClick={handleClearAll}
            className="touch-target p-2 rounded-full hover:bg-ink/5 transition-colors"
            aria-label="Clear all queued reports"
          >
            <Trash2
              style={{ width: 18, height: 18, color: "var(--muted)" }}
            />
          </button>
        )}
      </header>

      <main className="px-4 pt-4 space-y-4">
        {/* Offline explanation banner (only when offline + has items) */}
        {queue.length > 0 && !navigator.onLine && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: "color-mix(in oklab, var(--ink) 6%, transparent)",
              border: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)",
            }}
          >
            <WifiOff
              style={{
                width: 18,
                height: 18,
                color: "var(--muted)",
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--muted)",
                margin: 0,
              }}
            >
              You are offline. Reports will sync when a connection is available.
            </p>
          </div>
        )}

        {/* Sync progress summary */}
        {progress && (
          <div
            className="ios-grouped-list p-4"
            style={{
              border: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
              background: "color-mix(in oklab, var(--accent) 5%, var(--panel))",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                Sync complete
              </span>
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                {progress.succeeded}/{progress.total}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 rounded-full overflow-hidden"
              style={{ background: "color-mix(in oklab, var(--ink) 8%, transparent)" }}
            >
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
            <div className="flex gap-4 mt-2">
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--green)",
                }}
              >
                ✓ {progress.succeeded} synced
              </span>
              {progress.failed > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 11,
                    color: "var(--red)",
                  }}
                >
                  ✗ {progress.failed} failed
                </span>
              )}
              {progress.skipped > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 11,
                    color: "var(--muted)",
                  }}
                >
                  – {progress.skipped} skipped
                </span>
              )}
            </div>
          </div>
        )}

        {/* Queue list or empty state */}
        {queue.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            title="All caught up"
            description="No offline reports waiting to sync. When you submit a report without internet, it will appear here."
            className="mt-16"
          />
        ) : (
          <div className="space-y-3">
            {queue.map((item) => {
              const payload = item.payload;
              const typeLabel = getTypeLabel(payload);
              const description = (payload.description as string) ?? "";
              const lat = payload.latitude as number | undefined;
              const lng = payload.longitude as number | undefined;
              const hasGps = lat != null && lng != null;

              return (
                <div key={item.id} className="ios-grouped-list p-4">
                  <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "color-mix(in oklab, var(--accent) 10%, transparent)",
                      }}
                    >
                      <Camera
                        style={{
                          width: 18,
                          height: 18,
                          color: "var(--accent)",
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Type label + status */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--ink)",
                          }}
                        >
                          {typeLabel}
                        </span>
                        {item.lastError ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                            style={{
                              background: "color-mix(in oklab, var(--red) 12%, transparent)",
                              color: "var(--red)",
                            }}
                          >
                            Failed
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                            style={{
                              background: "color-mix(in oklab, var(--ink) 8%, transparent)",
                              color: "var(--muted)",
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock
                          style={{
                            width: 12,
                            height: 12,
                            color: "var(--muted-subtle)",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 11,
                            color: "var(--muted-subtle)",
                          }}
                        >
                          {timeAgo(item.queuedAt)}
                        </span>
                      </div>

                      {/* GPS */}
                      {hasGps && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin
                            style={{
                              width: 12,
                              height: 12,
                              color: "var(--muted-subtle)",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 11,
                              color: "var(--muted-subtle)",
                            }}
                          >
                            {lat!.toFixed(4)}, {lng!.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {/* Description preview */}
                      {description && (
                        <div className="flex items-start gap-1.5">
                          <FileText
                            style={{
                              width: 12,
                              height: 12,
                              color: "var(--muted-subtle)",
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 12,
                              color: "var(--muted)",
                              lineHeight: 1.4,
                            }}
                          >
                            {truncate(description, 80)}
                          </span>
                        </div>
                      )}

                      {/* Error message */}
                      {item.lastError && (
                        <div
                          className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg"
                          style={{
                            background: "color-mix(in oklab, var(--red) 6%, transparent)",
                          }}
                        >
                          <XCircle
                            style={{
                              width: 12,
                              height: 12,
                              color: "var(--red)",
                              marginTop: 1,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 11,
                              color: "var(--red)",
                              lineHeight: 1.3,
                            }}
                          >
                            {truncate(item.lastError, 100)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="touch-target p-2 rounded-full hover:bg-ink/5 transition-colors flex-shrink-0"
                      aria-label="Remove queued report"
                    >
                      <X
                        style={{
                          width: 15,
                          height: 15,
                          color: "var(--muted-subtle)",
                        }}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky bottom bar with Sync Now button */}
      {queue.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
          style={{
            background: "color-mix(in oklab, var(--page) 85%, transparent)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Batch info */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                {queue.length > BATCH_SIZE
                  ? `Syncing ${BATCH_SIZE} of ${queue.length} per batch`
                  : `${queue.length} report${queue.length !== 1 ? "s" : ""} to sync`}
              </p>
              {queue.length > BATCH_SIZE && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "var(--muted)",
                    margin: "1px 0 0",
                  }}
                >
                  {Math.ceil(queue.length / BATCH_SIZE)} batch
                  {Math.ceil(queue.length / BATCH_SIZE) > 1 ? "es" : ""} total
                </p>
              )}
            </div>

            <button
              onClick={handleSyncNow}
              disabled={syncing || !navigator.onLine}
              className="touch-target flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-40"
              style={{
                background: syncing
                  ? "color-mix(in oklab, var(--ink) 20%, transparent)"
                  : "var(--accent)",
                color: syncing ? "var(--muted)" : "#fff",
                fontFamily: "var(--font-body)",
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
    </div>
  );
}
