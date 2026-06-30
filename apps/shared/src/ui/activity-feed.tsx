"use client";

import { AlertTriangle, Info, MapPin, AlertCircle, Activity } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyFeed } from "./empty-state";

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
  const t = useTranslations("dashboard");
  const [displayedCount, setDisplayedCount] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const allItems = items || [];

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
        <p className="text-xs text-muted mt-1">{t("tryRefreshing")}</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyFeed 
        title={t("noActivityYet")}
        description={t("noActivityDesc")}
      />
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
        <h2 className="text-2xl font-semibold text-ink">{t("liveIntelligenceFeed")}</h2>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green animate-[breathe_4s_ease-in-out_infinite]" />
          <span className="font-mono text-sm text-muted">{t("liveLabel")}</span>
        </span>
      </div>

      {displayed.map((item, idx) => (
        <div key={item.id} className="relative pl-8 pb-6 group">
          {idx < displayed.length - 1 && (
            <div className="absolute left-[9px] top-4 bottom-[-16px] w-[2px] bg-ink/5 group-hover:bg-accent/20 transition-colors" />
          )}
          <div className={`absolute left-0 top-1.5 w-[20px] h-[20px] rounded-full ring-4 ring-page bg-page flex items-center justify-center shadow-sm`}>
            <div className={`w-[10px] h-[10px] rounded-full shadow-sm ${typeDot[item.type]}`} />
          </div>
          
          <div className="flex items-start justify-between gap-4 bg-panel border border-ink/5 p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-ink/10 transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-ink/[0.04] font-mono text-[10px] font-semibold text-ink/50 uppercase tracking-widest">{item.id}</span>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                  item.type === 'Critical' ? 'bg-red/10 text-red' :
                  item.type === 'Warning' ? 'bg-amber/10 text-amber' :
                  'bg-accent/10 text-accent'
                }`}>{item.type}</span>
              </div>
              <h3 className="text-[15px] font-bold text-ink mb-1.5 group-hover:text-accent transition-colors leading-snug">{item.title}</h3>
              <p className="text-xs font-medium text-ink/50 mb-3 flex items-center gap-1.5">
                 <MapPin className="w-3.5 h-3.5 opacity-40" />
                 {item.location}
              </p>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink/60 bg-ink/5 px-2.5 py-1 rounded-full tracking-wide">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Open' ? 'bg-red' : 'bg-green'}`} />
                  {item.status}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-ink/40 shrink-0 uppercase tracking-widest pt-1">{item.time}</span>
          </div>
        </div>
      ))}

      <div className="pt-4 pb-2">
        {displayedCount < allItems.length && (
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border border-ink/5 bg-panel hover:bg-ink/[0.02] hover:border-ink/10 hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)] font-bold text-[11px] uppercase tracking-widest text-ink/60 hover:text-ink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group transform hover:-translate-y-0.5"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-ink/20 border-t-ink/60 animate-spin" />
                {t("retrievingLogs")}
              </span>
            ) : (
              <>
                {t("loadOlderLogs")}
                <span className="bg-ink/5 text-ink/50 group-hover:bg-accent/10 group-hover:text-accent px-2 py-0.5 rounded-md transition-colors text-[10px]">
                  {allItems.length - displayedCount} {t("moreLabel")}
                </span>
              </>
            )}
          </button>
        )}
        {displayedCount >= allItems.length && (
          <div className="flex items-center justify-center gap-4 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest">
            <div className="h-px w-12 bg-ink/5" />
            {t("endOfFeed")}
            <div className="h-px w-12 bg-ink/5" />
          </div>
        )}
      </div>
    </div>
  );
}
