"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ScoreRow = {
  rank: number;
  agency: string;
  user: string;
  responseTime: string;
};

const scoreData: ScoreRow[] = [
  { rank: 1, agency: "Forest Guard", user: "Gov Agency North", responseTime: "14 minutes" },
  { rank: 2, agency: "Dept. Environment", user: "Gov Agency River", responseTime: "16 minutes" },
  { rank: 3, agency: "City Sanitation", user: "Gov Agency Metro", responseTime: "20 minutes" },
  { rank: 4, agency: "Coastal Watch", user: "Gov Agency Bay", responseTime: "23 minutes" },
];

export default function Home() {
  const [ghostMode, setGhostMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("likaslens-theme");
    setGhostMode(storedTheme === "ghost");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const themeValue = ghostMode ? "ghost" : "civic";
    document.documentElement.setAttribute("data-theme", themeValue);
    window.localStorage.setItem("likaslens-theme", themeValue);
  }, [ghostMode, mounted]);

  return (
    <main className="landing-shell min-h-screen">
      <header className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="landing-panel flex flex-col gap-4 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-heading text-2xl font-extrabold tracking-tight">LikasLens</div>
          <ul className="flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.08em]">
            <li><a href="#reporting" className="landing-link">Reporting</a></li>
            <li><a href="#scoreboard" className="landing-link">Scoreboard</a></li>
            <li><a href="#technology" className="landing-link">Technology</a></li>
            <li><a href="#rewards" className="landing-link">Rewards</a></li>
            <li><Link href="/login" className="landing-link">Login</Link></li>
          </ul>
          <button
            type="button"
            onClick={() => setGhostMode((value) => !value)}
            className="flex items-center gap-3 rounded-full border px-3 py-1.5 text-sm"
            aria-label="Toggle Ghost Mode"
          >
            <span className="font-body">Ghost Mode</span>
            <span className={`theme-switch ${ghostMode ? "is-on" : ""}`}>
              <span className="theme-switch-dot" />
            </span>
          </button>
        </nav>
      </header>

      <section id="reporting" className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <article className="landing-panel hero-panel rounded-2xl border p-6 sm:p-8">
          <p className="font-data text-xs uppercase tracking-[0.3em]">Civic Intelligence Grid</p>
          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-[1.06] sm:text-6xl">
            The Smart Watchdog for a Greener World.
          </h1>
          <p className="font-body mt-4 max-w-2xl text-base sm:text-lg">
            Communities can report environmental issues fast, route evidence to the right agency, and watch response times in a public accountability ledger.
          </p>
          <p className="font-data mt-3 text-xs tracking-wide">
            Ghost Mode safeguards: EXIF metadata is stripped on-device before transmission.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="cta-primary rounded-lg px-5 py-3 font-semibold uppercase tracking-wide">
              Get Involved
            </Link>
            <a href="#scoreboard" className="cta-secondary rounded-lg px-5 py-3 font-semibold uppercase tracking-wide">
              View Public Scoreboard
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatChip label="Cities Connected" value="38" />
            <StatChip label="Avg. Response" value="18m" />
            <StatChip label="Reports This Week" value="2,640" />
          </div>
        </article>

        <GhostPanel />
      </section>

      <section id="scoreboard" className="mx-auto w-full max-w-7xl px-4 pb-5 sm:px-6 lg:px-8">
        <article className="landing-panel rounded-2xl border p-6">
          <header className="mb-5">
            <h2 className="font-heading text-3xl font-extrabold">The Public Scoreboard</h2>
            <p className="font-body mt-1 text-sm">Recent issues resolved by agency</p>
          </header>

          <div className="grid gap-3">
            <div className="font-data hidden grid-cols-[0.4fr_1.6fr_1fr_1fr] rounded-md border px-3 py-2 text-xs uppercase tracking-[0.12em] sm:grid">
              <span>Rank</span>
              <span>Agency</span>
              <span>User Name</span>
              <span className="text-right">Response</span>
            </div>
            {scoreData.map((row) => (
              <div key={row.rank} className="score-row grid items-center gap-2 rounded-lg border px-3 py-3 sm:grid-cols-[0.4fr_1.6fr_1fr_1fr]">
                <span className="font-data text-2xl font-bold sm:text-xl">{row.rank}</span>
                <span className="font-body text-sm font-semibold sm:text-base">{row.agency}</span>
                <span className="font-body text-sm">{row.user}</span>
                <span className="font-data text-sm sm:text-right">{row.responseTime}</span>
              </div>
            ))}
          </div>
          <a href="#" className="landing-link mt-4 inline-block text-sm">Show more details</a>
        </article>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-[2fr_1fr] lg:px-8">
        <article id="technology" className="landing-panel rounded-2xl border p-6">
          <h3 className="font-heading text-3xl font-extrabold">Powered by AI Brain</h3>
          <p className="font-body mt-2 text-sm sm:text-base">Environmental photos are classified and routed with jurisdiction context in seconds.</p>
          <div className="bionic-frame mt-5 rounded-xl border p-4">
            <div className="font-data mb-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.12em]">
              <span>Object Detected: Illegal Dumping</span>
              <span>Location: Riverside Drive</span>
              <span>Jurisdiction: Dept. Environment</span>
            </div>
            <div className="relative h-48 overflow-hidden rounded-lg border sm:h-60">
              <div className="ai-grid absolute inset-0" />
              <div className="absolute left-4 top-4 rounded border px-2 py-1 text-xs uppercase tracking-[0.08em]">AI Scan Active</div>
              <div className="absolute bottom-4 right-4 rounded border px-2 py-1 text-xs uppercase tracking-[0.08em]">Local Law Match</div>
            </div>
          </div>
        </article>

        <article id="rewards" className="landing-panel rounded-2xl border p-6">
          <h3 className="font-heading text-3xl font-extrabold">Earn Rewards</h3>
          <p className="font-body mt-2 text-sm">Contributions grow your civic impact badge and unlock milestones.</p>
          <div className="mt-6 grid gap-3">
            <RewardTile title="Daily Reports" value="+10" />
            <RewardTile title="Verified Reports" value="+35" />
            <RewardTile title="Weekly Streak" value="+60" />
          </div>
          <div className="mt-6 flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="font-data text-sm uppercase tracking-[0.12em]">Rewards</span>
            <span className="font-data text-2xl font-bold">100</span>
          </div>
        </article>
      </section>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="landing-panel flex flex-col gap-3 rounded-xl border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="font-data text-xs uppercase tracking-[0.12em]">Legal | Social | Contact</div>
          <p className="font-body">Vigilance for the Wild</p>
        </div>
      </footer>
    </main>
  );
}

function GhostPanel() {
  return (
    <article className="landing-panel ghost-panel rounded-2xl border p-6">
      <h2 className="font-heading text-4xl font-extrabold leading-tight">
        Stay Protected
        <br />
        with <span className="text-accent">Ghost Mode</span>
      </h2>
      <p className="font-body mt-3 text-base">High-danger incidents can be filed with identity-safe handling and secure routing.</p>
      <div className="mt-8 flex items-center justify-center gap-6">
        <div className="avatar-dot" />
        <div className="font-data text-2xl">&rarr;</div>
        <div className="avatar-dot ghost" />
      </div>
      <p className="font-data mt-8 text-xs uppercase tracking-[0.14em]">Night Shadow to Ghost Amber transition</p>
    </article>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-data text-xs uppercase tracking-[0.12em]">{label}</p>
      <p className="font-heading mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function RewardTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="reward-tile flex items-center justify-between rounded-lg border px-3 py-3">
      <span className="font-body text-sm font-semibold">{title}</span>
      <span className="font-data text-base font-bold">{value}</span>
    </div>
  );
}
