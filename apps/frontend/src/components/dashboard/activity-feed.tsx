"use client";

import { AlertTriangle, Info, Map } from "lucide-react";
import { useState } from "react";

interface FeedItem {
  id: string;
  display_id: string;
  type: string;
  title: string;
  location: string;
  time: string;
  status: string;
}

export function ActivityFeed({ feed }: { feed: FeedItem[] }) {
  const [displayedCount, setDisplayedCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + 3, feed.length));
      setIsLoading(false);
    }, 500);
  };

  const displayedIncidents = feed.slice(0, displayedCount);

  return (
    <div className="brutal-panel panel-surface p-0 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b-4 border-primary bg-background flex justify-between items-center">
        <h2 className="font-heading text-2xl font-black uppercase">Live Intelligence Feed</h2>
        {/* Glitch Animation Live Indicator - CSS responds to data-theme attribute */}
        <span className="flex h-3 w-3 relative items-center justify-center">
          <span className="status-dot-glitch absolute inline-flex h-3 w-3 rounded-full opacity-75 live-indicator-glitch"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 border-2 live-indicator-ring"></span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayedIncidents.map((item, idx) => (
          <div key={item.id} className="p-6 border-b-2 border-primary/10 hover:bg-secondary/10 transition-colors flex gap-6 group">
            <div className="hidden sm:flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded border-2 flex items-center justify-center shadow-[2px_2px_0px_#1b4332] group-hover:scale-110 transition-transform font-heading font-black ${
                  item.type === "Critical"
                    ? "bg-accent/20 border-accent text-accent"
                    : item.type === "Warning"
                    ? "bg-secondary/20 border-secondary text-secondary"
                    : "bg-primary/20 border-primary text-primary"
                }`}
              >
                {item.type === "Critical" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : item.type === "Warning" ? (
                  <Map className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>
              <div className={`w-0.5 ${idx === displayedIncidents.length - 1 ? 'hidden' : 'h-full'} bg-primary/20 mt-4`}></div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-xs font-bold surface-muted border border-primary/20 px-2 py-1 rounded inline-block surface-chip">
                  {item.id}
                </div>
                <div className="font-mono text-xs font-bold">{item.time}</div>
              </div>

              <h3 className="font-heading text-xl font-bold uppercase mb-1">{item.title}</h3>
              <p className="font-mono text-sm opacity-80 mb-4">{item.location}</p>

              <div className="flex items-center gap-2">
                <div className="text-xs font-mono font-bold uppercase tracking-widest border-2 border-primary px-3 py-1 rounded surface-chip shadow-[2px_2px_0px_#1b4332]">
                  Status: {item.status}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="p-6 text-center border-t-2 border-primary/10">
          {displayedCount < feed.length && (
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              aria-label={`Load older logs, ${feed.length - displayedCount} remaining`}
              className="brutal-button px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              {isLoading ? "Loading..." : `Load Older Logs (${feed.length - displayedCount} more)`}
            </button>
          )}
          {displayedCount >= feed.length && (
            <div className="font-mono text-xs text-foreground/60 uppercase tracking-widest">
              ✓ All {feed.length} incidents loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
