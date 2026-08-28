"use client";

import { useEffect, useState, useCallback } from "react";
import { Globe, RefreshCw, List, MapIcon } from "lucide-react";
import { laravelGet, cn } from "@likaslens/shared";
import { PublicRecordFeed } from "@/components/public-record/public-record-feed";
import { PublicRecordMap } from "@/components/public-record/public-record-map";
import { LiksiContextCard } from "@/components/chat/liksi-context-card";

interface PublicIncident {
  id: string;
  display_id?: string;
  title: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: string;
  category?: string;
  photo_url?: string | null;
  created_at: string;
  is_ghost?: boolean;
  ai_confidence?: number | null;
}

export default function PublicRecordPage() {
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [view, setView] = useState<"feed" | "map" | "split">("split");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await laravelGet<any>("/public/impact");
        if (!cancelled && res.success && res.data?.recent_verified) {
          const mapped = res.data.recent_verified.map((r: any, i: number) => ({
            id: r.id || `incident-${i}`,
            title: r.title || "Environmental Incident",
            location: r.location || "Unknown location",
            status: r.status || "open",
            created_at: r.date || new Date().toISOString(),
            category: r.category || r.type || undefined,
            photo_url: r.photo_url || r.image_url || null,
            latitude: r.latitude || undefined,
            longitude: r.longitude || undefined,
            is_ghost: r.is_ghost || false,
          }));
          setIncidents(mapped);
        }
      } catch {
        // API not available — show empty state
      } finally {
        if (!cancelled) setInitialLoad(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl text-ink">
            Public Record
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            {`${incidents.length} environmental incident${incidents.length === 1 ? "" : "s"} recorded`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl bg-ink/[0.04] p-1">
            <button
              onClick={() => setView("feed")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                view === "feed"
                  ? "bg-panel shadow-sm text-ink"
                  : "text-ink/50 hover:text-ink/80"
              )}
            >
              <List className="w-3.5 h-3.5" />
              Feed
            </button>
            <button
              onClick={() => setView("split")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                view === "split"
                  ? "bg-panel shadow-sm text-ink"
                  : "text-ink/50 hover:text-ink/80"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Split
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                view === "map"
                  ? "bg-panel shadow-sm text-ink"
                  : "text-ink/50 hover:text-ink/80"
              )}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ink/10 text-ink/50 hover:text-ink hover:bg-ink/[0.02] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Liksi suggestion */}
      <LiksiContextCard page="public-record" />

      {/* Content */}
      {view === "split" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="max-h-[600px] overflow-y-auto pr-2">
            <PublicRecordFeed
              incidents={incidents}
              highlightedId={highlightedId}
              onIncidentClick={setHighlightedId}
            />
          </div>
          <div className="lg:sticky lg:top-20">
            <PublicRecordMap
              incidents={incidents}
              highlightedId={highlightedId}
              onPinClick={setHighlightedId}
              height="500px"
            />
          </div>
        </div>
      ) : view === "feed" ? (
        <PublicRecordFeed
          incidents={incidents}
          highlightedId={highlightedId}
          onIncidentClick={setHighlightedId}
        />
      ) : (
        <PublicRecordMap
          incidents={incidents}
          highlightedId={highlightedId}
          onPinClick={setHighlightedId}
          height="600px"
        />
      )}
    </div>
  );
}
