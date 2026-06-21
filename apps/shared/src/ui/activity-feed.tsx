"use client";

import { AlertTriangle, Info, MapPin, AlertCircle } from "lucide-react";
import { useState } from "react";

interface FeedItem {
  id: string;
  type: "Critical" | "Warning" | "Info";
  title: string;
  location: string;
  time: string;
  status: string;
}

const typeColor: Record<string, string> = {
  Critical: "text-red",
  Warning: "text-amber",
  Info: "text-accent",
};

const typeDot: Record<string, string> = {
  Critical: "bg-red",
  Warning: "bg-amber",
  Info: "bg-accent",
};

export function ActivityFeed({ items, loading, error }: { items?: FeedItem[]; loading?: boolean; error?: string }) {
  const [displayedCount, setDisplayedCount] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const allItems = items || [
    { id: "INC-092", type: "Critical" as const, title: "Illegal Dumping Detected", location: "Sector 4, Riverside", time: "10 mins ago", status: "Routing to Agency" },
    { id: "INC-091", type: "Warning" as const, title: "Air Quality Drop", location: "Downtown Core", time: "45 mins ago", status: "Monitoring" },
    { id: "INC-090", type: "Info" as const, title: "Resolution Confirmed", location: "Park District", time: "2 hours ago", status: "Archived" },
    { id: "INC-089", type: "Warning" as const, title: "Water Contamination Alert", location: "Riverside Industrial", time: "3 hours ago", status: "Investigating" },
    { id: "INC-088", type: "Critical" as const, title: "Deforestation Zone Detected", location: "Northern Ridge Forest", time: "5 hours ago", status: "Critical Review" },
    { id: "INC-087", type: "Info" as const, title: "Noise Level Normalized", location: "Downtown Core", time: "6 hours ago", status: "Resolved" },
    { id: "INC-086", type: "Warning" as const, title: "Wildfire Risk Assessment", location: "Sector 7, Forest Zone", time: "8 hours ago", status: "Monitoring" },
    { id: "INC-085", type: "Critical" as const, title: "Illegal Wildlife Trafficking", location: "National Park Boundary", time: "10 hours ago", status: "Active Investigation" },
    { id: "INC-084", type: "Info" as const, title: "Air Quality Improved", location: "Downtown Core", time: "12 hours ago", status: "Resolved" },
  ];

  if (loading) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between pb-5 border-b border-border mb-3">
          <div className="h-7 w-48 rounded-lg bg-ink/5 animate-pulse" />
          <div className="h-4 w-16 rounded bg-ink/5 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative pl-7 pb-6 animate-pulse">
            <div className="absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full bg-ink/5" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-ink/5" />
              <div className="h-5 w-48 rounded bg-ink/5" />
              <div className="h-4 w-36 rounded bg-ink/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red/20 bg-red/5 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red mb-2 fill-red" />
        <p className="text-sm text-red">{error}</p>
        <p className="text-xs text-muted mt-1">Try refreshing the page.</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Info className="mx-auto h-8 w-8 text-muted mb-2" />
        <p className="text-sm text-muted">No activity yet</p>
      </div>
    );
  }

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + 3, allItems.length));
      setIsLoadingMore(false);
    }, 500);
  };

  const displayed = allItems.slice(0, displayedCount);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-5 border-b border-border mb-3">
        <h2 className="text-2xl font-semibold text-ink">Live Intelligence Feed</h2>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green animate-[breathe_4s_ease-in-out_infinite]" />
          <span className="font-mono text-sm text-muted">Live</span>
        </span>
      </div>

      {displayed.map((item, idx) => (
        <div key={item.id} className="relative pl-7 pb-6">
          {idx < displayed.length - 1 && (
            <div className="absolute left-[9px] top-3 bottom-0 w-px bg-border" />
          )}
          <div className={`absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 border-border ${typeDot[item.type]} flex items-center justify-center`}>
            <div className={`w-[8px] h-[8px] rounded-full ${typeDot[item.type]}`} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-sm text-muted">{item.id}</span>
                <span className={`font-mono text-sm font-medium ${typeColor[item.type]}`}>{item.type}</span>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-1">{item.title}</h3>
              <p className="font-mono text-sm text-muted mb-2">{item.location}</p>
              <span className="font-mono text-sm text-muted">{item.status}</span>
            </div>
            <span className="font-mono text-sm text-muted shrink-0">{item.time}</span>
          </div>
        </div>
      ))}

      <div className="pt-3">
        {displayedCount < allItems.length && (
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="font-mono text-sm text-muted hover:text-ink transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : `Load Older Logs (${allItems.length - displayedCount} more)`}
          </button>
        )}
        {displayedCount >= allItems.length && (
          <span className="font-mono text-sm text-muted">All {allItems.length} incidents loaded</span>
        )}
      </div>
    </div>
  );
}
