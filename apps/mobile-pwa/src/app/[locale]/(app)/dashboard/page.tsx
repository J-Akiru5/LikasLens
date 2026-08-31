"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DashboardSkeleton,
  getDashboardFeed,
  getTickets,
  showToast,
  formatDate,
  StatsCards,
  ActivityFeed,
  RevealSection,
  SpotlightCard,
  cn,
  getQueueCount,
} from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem, Ticket } from "@likaslens/shared";
import {
  Camera,
  ChevronRight,
  Activity,
  Scale,
  WifiOff,
  RefreshCw,
  Sparkles,
  Map,
  CheckCircle,
  Clock,
  TriangleAlert,
  TrendingUp,
  ArrowRight,
  MapPin,
  Loader2,
  CircleCheck,
  ShieldCheck,
  Globe,
  HelpCircle,
  Eye,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";
import { usePullToRefresh } from "@/context/pull-to-refresh";

const ViolationDonut = dynamic(
  () => import("@/components/charts/violation-donut").then((m) => ({ default: m.ViolationDonut })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[300px]"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div> }
);

const EnhancedMap = dynamic(
  () => import("@/components/map/enhanced-map").then((m) => ({ default: m.EnhancedMap })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[360px] bg-panel rounded-2xl border border-ink/5"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div> }
);

const QUICK_PROMPTS = [
  { label: "Trash & Burning", prompt: "What are the penalties for illegal dumping and open garbage burning?" },
  { label: "Tree Cutting", prompt: "How do I report illegal tree cutting or forest clearing?" },
  { label: "Dirty Water", prompt: "How fast will authorities respond to polluted water and waste dumping?" },
  { label: "Where to Report", prompt: "Which government office handles garbage, water pollution, or smoke?" },
  { label: "Illegal Quarrying", prompt: "How do I report illegal quarrying or mining in my area?" },
];

const TAB_ITEMS = [
  { id: "overview" as const, label: "Community Reports", icon: Globe },
  { id: "resolved" as const, label: "Resolved Cases", icon: CircleCheck },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(seconds / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Hero Stat Item
function HeroStat({ value, label, sublabel, accent }: { value: string; label: string; sublabel?: string; accent: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className={`text-2xl font-black tracking-tight ${accent}`}>{value}</span>
      <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider mt-0.5">{label}</span>
      {sublabel && <span className="text-[9px] text-white/60 font-mono">{sublabel}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "resolved">("overview");
  const [resolvedCases, setResolvedCases] = useState<Ticket[]>([]);
  const [userRole, setUserRole] = useState<string | undefined>();
  const haptic = useHaptics();

  const [userName, setUserName] = useState("Friend");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  const [timeState, setTimeState] = useState({ greeting: "Welcome,", dateStr: "" });
  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();
    setTimeState({
      greeting: hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,",
      dateStr: formatDate(date, "long", locale).toUpperCase(),
    });
  }, [locale]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [ticketsRes, feedRes, authRes] = await Promise.all([
        getTickets({ per_page: "100" }).catch(() => null),
        getDashboardFeed().catch(() => null),
        supabase.auth.getUser().catch(() => ({ data: { user: null } })),
      ]);

      const authUser = authRes?.data?.user;
      const allTickets: Ticket[] = ticketsRes?.success && ticketsRes?.data ? ticketsRes.data : [];

      const total = allTickets.length;
      const resolved = allTickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
      const active = allTickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;

      setStats({
        total_reports: total,
        resolved_today: resolved,
        active_incidents: active,
        avg_response_minutes: (() => {
          const resolvedTickets = allTickets.filter((t: any) => t.resolved_at && t.created_at);
          if (resolvedTickets.length === 0) return 0;
          const totalMinutes = resolvedTickets.reduce((sum: number, t: any) => {
            const diff = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000;
            return sum + Math.max(0, diff);
          }, 0);
          return Math.round(totalMinutes / resolvedTickets.length);
        })(),
        total_users: 0,
      } as any);

      // Filter resolved cases
      const rCases = allTickets.filter((t) => t.status === "resolved" || t.status === "closed");
      setResolvedCases(rCases);

      if (allTickets.length > 0) {
        const liveFeedItems: ActivityFeedItem[] = allTickets.slice(0, 7).map((t: any) => ({
          id: t.id,
          display_id: t.display_id || `RPT-${t.id.slice(0, 6).toUpperCase()}`,
          title: t.title || "Report Filed",
          description: t.description || `Reported at ${t.location || "field location"}`,
          time: timeAgo(t.created_at || new Date().toISOString()),
          timestamp: t.created_at || new Date().toISOString(),
          type: t.priority === "critical" ? "Urgent" : t.priority === "high" ? "Important" : "Notice",
          location: t.location || "Metro Manila",
          status: t.status === "resolved" || t.status === "closed" ? "Resolved" : t.status === "monitoring" ? "Monitoring" : t.status === "investigating" ? "Under Investigation" : t.status === "pending_review" ? "Pending Review" : t.status === "verified" ? "Verified" : "Received",
          reporter: "Community Member",
        }));
        setFeed(liveFeedItems);
      } else {
        setFeed(feedRes?.data ?? []);
      }

      try {
        const count = await getQueueCount();
        setQueueCount(count);
      } catch {}

      if (authUser) {
        const role = authUser.user_metadata?.role as string | undefined;
        setUserRole(role);
        const rawName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.user_metadata?.first_name ||
          (authUser.email ? authUser.email.split("@")[0] : "");
        if (rawName) {
          const first = rawName.split(" ")[0];
          setUserName(first.charAt(0).toUpperCase() + first.slice(1));
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getQueueCount().then(setQueueCount).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  usePullToRefresh(load);

  const handleOpenChat = (prompt?: string) => {
    haptic("light");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-liksi-chat", { detail: { prompt } }));
    }
  };

  const isAdmin = userRole === "super_admin" || userRole === "analyst" || userRole === "lgu" || userRole === "partner";

  const statCards = useMemo(() => [
    {
      id: "active-incidents",
      label: "Active Reports",
      value: String(stats?.active_incidents ?? 0),
      trend: (stats?.active_incidents ?? 0) === 0 ? ("up" as const) : ("down" as const),
      delta: "+4%",
      sparkline: [12, 8, 15, 6, 10, 9, stats?.active_incidents ?? 0],
      category: "Ongoing",
      icon: TriangleAlert,
      accent: "amber" as const,
    },
    {
      id: "resolved-today",
      label: "Fixed Today",
      value: String(stats?.resolved_today ?? 0),
      trend: "up" as const,
      delta: "+12%",
      sparkline: [3, 7, 4, 9, 6, 8, stats?.resolved_today ?? 0],
      category: "Resolved",
      icon: CheckCircle,
      accent: "green" as const,
    },
    {
      id: "avg-response",
      label: "Avg Response",
      value: `${stats?.avg_response_minutes ?? 14}m`,
      trend: "up" as const,
      delta: "Fast",
      sparkline: [5.2, 4.8, 4.5, 4.1, 3.8, 3.5, stats?.avg_response_minutes ?? 14],
      category: "Response Time",
      icon: Clock,
      accent: "accent" as const,
    },
    {
      id: "total-reports",
      label: "Total Reports",
      value: String(stats?.total_reports ?? 0),
      trend: "flat" as const,
      delta: `${stats?.total_users ?? 840} Citizens`,
      sparkline: [120, 145, 132, 158, 140, 165, stats?.total_reports ?? 0],
      category: "All-Time",
      icon: Activity,
      accent: "muted" as const,
    },
  ], [stats]);

  const feedItems = useMemo(() => {
    return feed.map((item, idx) => ({
      id: item.id || `feed-${idx}`,
      display_id: item.display_id || `RPT-${idx + 1}`,
      type: item.type || "Notice",
      title: item.title || "Environmental Report",
      location: item.location || "Metro Manila, Philippines",
      time: item.time || "Recently",
      status: item.status || "Active",
    }));
  }, [feed]);

  if (loading) {
    return <div className="p-4"><DashboardSkeleton /></div>;
  }

  if (isAdmin) {
    return (
      <div className="pb-28 px-5 pt-4">
        <div className="bg-panel border border-ink/10 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-3">Community Portal</h2>
          <p className="text-ink/60 mb-8 max-w-md mx-auto leading-relaxed text-sm">
            You are viewing the citizen mobile app as an Officer. Tap below to access the full officer dashboard.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "/admin"}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold tracking-wide hover:opacity-90 transition-opacity"
          >
            Open Officer Portal
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const resolvedToday = stats?.resolved_today ?? 0;
  const activeIncidents = stats?.active_incidents ?? 0;

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════
          HERO BANNER — Nature Background + Friendly Liksi Mascot
         ══════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: "#0b2014" }}
      >
        {/* Background Nature Image */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: "url('/images/landing_hero_bg_premium.webp')",
            opacity: 0.75,
          }}
        />
        {/* Soft dark gradient for easy reading */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(7,24,14,0.88) 0%, rgba(10,34,20,0.48) 45%, rgba(8,26,16,0.95) 100%)",
          }}
        />

        {/* ── Top bar: date + status ── */}
        <div className="relative z-10 px-5 pt-5 flex items-center gap-2">
          <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase">{timeState.dateStr}</span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-400/25 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live System
          </span>
        </div>

        {/* ── Greeting ── */}
        <div className="relative z-10 px-5 pt-2 pb-1">
          <h1 className="text-white text-[26px] font-black leading-tight" style={{ letterSpacing: "-0.02em" }}>
            {timeState.greeting} <span className="text-emerald-400">{userName}!</span>
          </h1>
          <p className="text-white/85 text-[12px] mt-1 font-medium">Protecting our nature, together.</p>
        </div>

        {/* ── Mascot + Friendly Speech Bubble ── */}
        <div className="relative z-10 flex items-end px-3 pt-1 pb-1" style={{ minHeight: 215 }}>
          {/* Liksi Mascot */}
          <div
            className="relative flex-shrink-0 cursor-pointer active:scale-95 transition-transform origin-bottom drop-shadow-2xl -ml-4"
            style={{ width: 175, height: 205 }}
            onClick={() => handleOpenChat()}
            title="Tap to talk to Liksi"
          >
            <Image
              src="/images/liksi-welcom.gif"
              alt="Liksi Assistant"
              fill
              priority
              loading="eager"
              className="object-contain object-bottom scale-[1.55] origin-bottom -translate-y-1"
              unoptimized
            />
          </div>

          {/* Speech bubble */}
          <div
            className="relative flex-1 mb-8 ml-2 cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => handleOpenChat()}
          >
            <svg
              width="16" height="24" viewBox="0 0 12 20" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-[-12px] bottom-[20px] z-10"
            >
              <path d="M12 20V0C8 6 2 12 0 20H12Z" fill="white" />
              <path d="M12 0C8 6 2 12 0 20" stroke="#bbf7d0" strokeWidth="1" />
            </svg>
            <div className="bg-white rounded-[22px] rounded-bl-xs p-4 shadow-2xl" style={{ border: "1.5px solid #bbf7d0" }}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-emerald-800 text-[12px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  Liksi AI Helper
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">Law Guide</span>
              </div>
              <p className="text-slate-800 text-[12px] font-semibold leading-snug">
                Hi! Ask me anything about environmental rules, penalties, or where to report violations.
              </p>
            </div>
          </div>
        </div>

        {/* ── Quick Question Chips (Simple Words) ── */}
        <div className="relative z-10 flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleOpenChat(qp.prompt)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer bg-white/20 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              {qp.label}
            </button>
          ))}
        </div>

        {/* ── Summary Counters ── */}
        <div className="relative z-10 mx-4 mb-4 rounded-2xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">Live Report Summary</span>
            </div>
            <Link href={`/${locale}/map`} className="text-[10px] font-bold text-emerald-300 flex items-center gap-0.5 hover:text-emerald-200 transition-colors">
              Open Map <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/10 py-1">
            <HeroStat value={String(activeIncidents)} label="Ongoing" sublabel="Reports" accent="text-amber-300" />
            <HeroStat value={String(resolvedToday)} label="Resolved" sublabel="Today" accent="text-emerald-300" />
            <HeroStat value={`${stats?.avg_response_minutes ?? 14}m`} label="Average" sublabel="Response" accent="text-sky-300" />
          </div>
        </div>

        {/* ── Primary Action Button ── */}
        <div className="relative z-10 px-4 pb-10">
          <Link
            href={`/${locale}/report`}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-black text-[15px] tracking-wide cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", boxShadow: "0 8px 28px rgba(34,197,94,0.40)" }}
          >
            <Camera className="w-5 h-5" />
            Report a Violation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ELEVATED CONTENT SHEET — Crisp White with Curved Top Edge
         ══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 -mt-6 w-full rounded-t-[36px] bg-panel dark:bg-panel border-t-2 border-emerald-500/30 shadow-[0_-14px_45px_rgba(8,30,18,0.25)] px-4 pt-4 pb-28 space-y-5">
        {/* Top edge notch indicator */}
        <div className="w-12 h-1 rounded-full bg-emerald-500/40 mx-auto -mt-1 mb-3" />

        {/* Offline queue banner */}
        {queueCount > 0 && (
          <Link href={`/${locale}/offline-queue`} className="flex items-center gap-3 p-3 rounded-2xl border border-amber-500/25 bg-amber-500/5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/15">
              <WifiOff className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink">{queueCount} saved report{queueCount > 1 ? "s" : ""} waiting to send</p>
              <p className="text-[10px] text-ink/50">Tap to review and send now</p>
            </div>
            <RefreshCw className="w-4 h-4 text-ink/30 shrink-0" />
          </Link>
        )}

        {/* Tab Selector with Edge Accents */}
        <div className="flex items-center gap-2 p-1.5 bg-ink/[0.04] dark:bg-white/[0.04] rounded-2xl border border-emerald-500/20 shadow-xs">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); haptic("light"); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                    : "text-ink/60 hover:text-ink hover:bg-ink/[0.03]"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════ TAB 1: COMMUNITY REPORTS ═══════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6 pb-2">

            {/* Community Numbers */}
            <RevealSection>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-ink leading-snug">Community Impact</h2>
                    <p className="text-[10px] text-ink/50 font-mono">Live summary across the country</p>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <StatsCards items={statCards} />
              </section>
            </RevealSection>

            {/* Quick Actions */}
            <RevealSection stagger={0.08}>
              <section className="space-y-3">
                <h2 className="font-bold text-base text-ink">Helpful Tools</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/${locale}/map`} className="flex flex-col gap-2 p-4 rounded-2xl bg-sky-500/8 border border-sky-500/15 active:scale-[0.97] transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
                      <Map className="w-4.5 h-4.5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Report Map</p>
                      <p className="text-[10px] text-ink/50">See reports near you</p>
                    </div>
                  </Link>
                  <Link href={`/${locale}/impact`} className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 active:scale-[0.97] transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Impact Numbers</p>
                      <p className="text-[10px] text-ink/50">Environmental progress</p>
                    </div>
                  </Link>
                  <Link href={`/${locale}/knowledge-graph`} className="flex flex-col gap-2 p-4 rounded-2xl bg-violet-500/8 border border-violet-500/15 active:scale-[0.97] transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                      <HelpCircle className="w-4.5 h-4.5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Law Network</p>
                      <p className="text-[10px] text-ink/50">See how rules connect</p>
                    </div>
                  </Link>
                  <Link href={`/${locale}/laws`} className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/15 active:scale-[0.97] transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <Scale className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Law Guide</p>
                      <p className="text-[10px] text-ink/50">Browse rules & penalties</p>
                    </div>
                  </Link>
                </div>
              </section>
            </RevealSection>

            {/* Recent Reports Feed */}
            <RevealSection stagger={0.12}>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-ink">Recent Reports</h2>
                    <p className="text-[10px] text-ink/50 font-mono">Live submissions from citizens</p>
                  </div>
                  <span className="text-[9px] font-bold font-mono text-ink/40">UPDATED</span>
                </div>
                <SpotlightCard spotlightColor="rgba(46,230,200,0.04)" className="rounded-2xl border border-ink/5 shadow-sm">
                  <div className="p-4">
                    <ActivityFeed items={feedItems} />
                  </div>
                </SpotlightCard>
              </section>
            </RevealSection>

            {/* Violation Breakdown */}
            <RevealSection stagger={0.15}>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-ink">Top Violation Types</h2>
                    <p className="text-[10px] text-ink/50 font-mono">What is reported most often</p>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[9px] font-bold font-mono">
                    <TrendingUp className="w-3 h-3" />
                    Breakdown
                  </span>
                </div>
                <SpotlightCard spotlightColor="rgba(52,211,153,0.04)" className="rounded-2xl border border-ink/5 shadow-sm">
                  <ViolationDonut />
                </SpotlightCard>
              </section>
            </RevealSection>

            {/* Incident Map Section */}
            <RevealSection stagger={0.18}>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base text-ink">Incident Map</h2>
                  <Link href={`/${locale}/map`} className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    View Full Map <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="rounded-2xl overflow-hidden border border-ink/5">
                  <EnhancedMap days={30} height="340px" />
                </div>
              </section>
            </RevealSection>
          </div>
        )}

        {/* ═══════════════ TAB 2: RESOLVED CASES ═══════════════ */}
        {activeTab === "resolved" && (
          <div className="space-y-4 pb-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-ink">Resolved Cases</h2>
                <p className="text-[10px] text-ink/50 font-mono">{resolvedCases.length} case{resolvedCases.length !== 1 ? "s" : ""} resolved</p>
              </div>
              {resolvedCases.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold font-mono">
                  <CircleCheck className="w-3 h-3" />
                  Action Completed
                </span>
              )}
            </div>

            {resolvedCases.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500/60" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">No Resolved Cases Yet</h3>
                  <p className="text-xs text-ink/50 max-w-xs mt-1 leading-relaxed">
                    Reports that have been verified and solved by authorities will show up here.
                  </p>
                </div>
                <Link
                  href={`/${locale}/report`}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-sm active:scale-95 transition-all"
                >
                  Report a Problem
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedCases.map((report) => (
                  <div key={report.id} className="p-4 rounded-2xl bg-panel border border-emerald-500/20 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                          Resolved
                        </span>
                        <span className="text-[10px] font-mono text-ink/40">{report.display_id || `RPT-${report.id.slice(0, 8)}`}</span>
                      </div>
                      <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink leading-snug">{report.title}</h3>
                      <p className="text-[11px] text-ink/60 line-clamp-2 mt-0.5">{report.description || "Action has been taken and this issue is now resolved."}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-ink/50">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{report.location || "Location Recorded"}</span>
                    </div>
                    <div className="pt-2.5 border-t border-ink/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-ink/40">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "Recently"}
                      </span>
                      <Link href={`/${locale}/history`} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all">
                        <Eye className="w-3 h-3" />
                        View Report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
