"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicScoreboard } from "@/components/scoreboard/public-scoreboard";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { dashboardAlerts, scoreboardRows } from "@/lib/mock-data";

const kpiCards = [
  { label: "Incoming Reports", value: "64", trend: "+9%" },
  { label: "Resolved Today", value: "27", trend: "+4%" },
  { label: "Avg Route Time", value: "18m", trend: "-2m" },
  { label: "High Risk Incidents", value: "6", trend: "+1" },
];

export default function DashboardPage() {
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    const themeValue = ghostMode ? "ghost" : "civic";
    document.documentElement.setAttribute("data-theme", themeValue);
    window.localStorage.setItem("likaslens-theme", themeValue);
  }, [ghostMode]);

  return (
    <main className="landing-shell min-h-screen">
      <header className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="landing-panel flex flex-col gap-4 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-data text-xs uppercase tracking-[0.2em]">LikasLens Command View</p>
            <h1 className="font-heading text-2xl font-extrabold">Agency Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="landing-link text-sm uppercase tracking-[0.08em]">Back to Landing</Link>
            <Link href="/login" className="landing-link text-sm uppercase tracking-[0.08em]">Account</Link>
            <ThemeToggle ghostMode={ghostMode} onToggle={() => setGhostMode((value) => !value)} />
          </div>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-5 sm:px-6 lg:grid-cols-4 lg:px-8">
        {kpiCards.map((card) => (
          <article key={card.label} className="landing-panel rounded-xl border p-4">
            <p className="font-data text-xs uppercase tracking-[0.14em]">{card.label}</p>
            <p className="font-heading mt-2 text-4xl font-extrabold">{card.value}</p>
            <p className="font-data mt-2 text-sm">Trend {card.trend}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-6 sm:px-6 lg:grid-cols-[1.8fr_1fr] lg:px-8">
        <article className="landing-panel rounded-2xl border p-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-3xl font-extrabold">Public Agency Leaderboard</h2>
              <p className="font-body mt-1 text-sm">Response quality and queue pressure</p>
            </div>
            <span className="font-data rounded border px-3 py-1 text-xs uppercase tracking-[0.12em]">Live Mock Feed</span>
          </header>
          <PublicScoreboard rows={scoreboardRows} showOpenCases />
        </article>

        <article className="landing-panel ghost-panel rounded-2xl border p-6">
          <h3 className="font-heading text-2xl font-extrabold">Ghost Queue</h3>
          <p className="font-body mt-2 text-sm">Priority incidents requiring masked reporter workflow.</p>
          <div className="mt-5 space-y-3">
            {dashboardAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-[rgba(248,249,250,0.35)] px-3 py-3">
                <p className="font-data text-xs uppercase tracking-[0.12em]">{alert.id} • {alert.priority}</p>
                <p className="font-body mt-1 text-sm">{formatCategory(alert.category)} in {alert.district}</p>
                <p className="font-data mt-2 text-xs uppercase tracking-[0.12em]">{alert.status} • {alert.reportedAt}</p>
              </div>
            ))}
          </div>
          <p className="font-data mt-5 text-xs uppercase tracking-[0.14em]">
            Identity-safe mode keeps citizen data masked while routing evidence.
          </p>
        </article>
      </section>
    </main>
  );
}

function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}
