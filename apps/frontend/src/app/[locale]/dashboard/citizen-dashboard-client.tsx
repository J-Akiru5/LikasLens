"use client";

import { useEffect, useState } from "react";
import { StatsCards, ActivityFeed, PublicScoreboard, Card } from "@likaslens/shared";
import { Sidebar } from "@phosphor-icons/react";

interface CitizenDashboardProps {
  locale?: string;
  impact?: unknown;
  ghostModeActive?: boolean;
}

type Panel = "feed" | "scoreboard" | null;

export function CitizenDashboardClient({ locale, impact, ghostModeActive }: CitizenDashboardProps) {
  const [activePanel, setActivePanel] = useState<Panel>("feed");
  const [panelOpen, setPanelOpen] = useState(false);

  const togglePanel = (panel: Panel) => {
    if (activePanel === panel && panelOpen) {
      setPanelOpen(false);
    } else {
      setActivePanel(panel);
      setPanelOpen(true);
    }
  };

  return (
    <div className="space-y-20">
      <section className="space-y-6">
        <h1 className="font-semibold tracking-tight text-5xl md:text-6xl text-ink">Environmental Dashboard</h1>
        <p className="font-mono text-base md:text-lg text-muted max-w-xl leading-relaxed">
          Real-time monitoring of environmental incidents across your jurisdiction.
        </p>
        <StatsCards />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold tracking-tight text-3xl text-ink">Recent Activity</h2>
          <button
            onClick={() => togglePanel("feed")}
            className="flex items-center gap-1.5 font-mono text-sm text-muted hover:text-ink transition-colors"
          >
            {panelOpen && activePanel === "feed" ? (
              <><Sidebar className="w-3.5 h-3.5" /> Close</>
            ) : (
              <><Sidebar className="w-3.5 h-3.5" /> Details</>
            )}
          </button>
        </div>
        <ActivityFeed />
      </section>

      <section className="space-y-6">
        <h2 className="font-semibold tracking-tight text-3xl text-ink">Public Scoreboard</h2>
        <PublicScoreboard />
      </section>
    </div>
  );
}
