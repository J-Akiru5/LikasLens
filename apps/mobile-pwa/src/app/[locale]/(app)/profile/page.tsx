"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  User,
  LogOut,
  ChevronRight,
  Award,
  Settings,
  Edit2,
  History,
  BarChart3,
  TrendingUp,
  Scale,
  AlertCircle,
  Network,
  Map,
  FileText,
  WifiOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LargeTitle } from "@/components/native/large-title";
import { useHaptics } from "@/hooks/use-haptics";
import { usePullToRefresh } from "@/context/pull-to-refresh";
import { MobileProfileSkeleton } from "@likaslens/shared";
import { useTranslations } from "next-intl";

/* ─────────────────────────────────────────────────────────────────────────────
   Profile — identity header card + grouped inset list (iOS Settings pattern).
   Two grouped sections (Account, Citizen tools) + a separated destructive row.
   ───────────────────────────────────────────────────────────────────────────── */



export default function ProfilePage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const haptic = useHaptics();

  const ACCOUNT_ITEMS = [
    { href: "/history", label: t("reportHistory"), Icon: History, tint: "var(--accent)" },
    { href: "/offline-queue", label: t("offlineQueue"), Icon: WifiOff, tint: "var(--amber)" },
    { href: "/achievements", label: t("achievements"), Icon: Award, tint: "#b8860b" },
    { href: "/settings", label: t("settings"), Icon: Settings, tint: "var(--muted)" },
  ];

  const TOOL_ITEMS = [
    { href: "/incidents", label: t("incidents"), Icon: AlertCircle, tint: "var(--red)" },
    { href: "/analytics", label: t("analytics"), Icon: BarChart3, tint: "var(--accent)" },
    { href: "/reports", label: t("reportsAnalytics"), Icon: FileText, tint: "var(--accent)" },
    { href: "/impact", label: t("impact"), Icon: TrendingUp, tint: "var(--green)" },
    { href: "/map", label: t("mapView"), Icon: Map, tint: "#3b82f6" },
    { href: "/knowledge-graph", label: t("knowledgeGraph"), Icon: Network, tint: "#a78bfa" },
    { href: "/laws", label: t("lawsDatabase"), Icon: Scale, tint: "var(--secondary)" },
  ];
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  usePullToRefresh(load);

  async function handleSignOut() {
    haptic("warning");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  if (loading) {
    return <MobileProfileSkeleton />;
  }

  return (
    <div className="pb-28">
      <div className="px-5">
        <LargeTitle title={t("profile")} />
      </div>

      <div className="px-5">
        {/* ── Identity header card ────────────────────────────────────────── */}
        <div className="m-banner-wrap" style={{ position: "relative", minHeight: 132, marginBottom: 22, background: "#4a7c59" }}>
          <Link
            href={`/${locale}/profile/edit`}
            onClick={() => haptic("light")}
            aria-label={t("editProfile")}
            className="touch-target"
            style={{ position: "absolute", top: 12, right: 12, borderRadius: 9999, background: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)", zIndex: 2 }}
          >
            <Edit2 style={{ width: 16, height: 16, color: "#f0ede8" }} />
          </Link>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: 16, gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(240,237,232,0.12)", backdropFilter: "blur(6px)", border: "1px solid rgba(240,237,232,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User style={{ width: 28, height: 28, color: "#f0ede8" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#f0ede8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
              </p>
              <p style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "rgba(240,237,232,0.65)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* ── Account group ──────────────────────────────────────────────── */}
        <h2 className="ios-section-label" style={{ marginBottom: 8, padding: "0 4px" }}>{t("account")}</h2>
        <div className="ios-grouped-list" style={{ marginBottom: 22 }}>
          {ACCOUNT_ITEMS.map(({ href, label, Icon, tint }) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={() => haptic("light")}
              className="ios-list-row"
            >
              <div className="ios-row-icon" style={{ background: `color-mix(in oklab, ${tint} 13%, transparent)` }}>
                <Icon style={{ width: 16, height: 16, color: tint }} />
              </div>
              <span className="flex-1 font-medium text-[16px] text-ink tracking-tight">
                {label}
              </span>
              <ChevronRight style={{ width: 18, height: 18, color: "var(--muted-subtle)" }} />
            </Link>
          ))}
        </div>

        {/* ── Citizen tools group ────────────────────────────────────────── */}
        <h2 className="ios-section-label" style={{ marginBottom: 8, padding: "0 4px" }}>{t("citizenTools")}</h2>
        <div className="ios-grouped-list" style={{ marginBottom: 28 }}>
          {TOOL_ITEMS.map(({ href, label, Icon, tint }) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={() => haptic("light")}
              className="ios-list-row"
            >
              <div className="ios-row-icon" style={{ background: `color-mix(in oklab, ${tint} 13%, transparent)` }}>
                <Icon style={{ width: 16, height: 16, color: tint }} />
              </div>
              <span className="flex-1 font-medium text-[16px] text-ink tracking-tight">
                {label}
              </span>
              <ChevronRight style={{ width: 18, height: 18, color: "var(--muted-subtle)" }} />
            </Link>
          ))}
        </div>

        {/* ── Sign out — separated destructive row ───────────────────────── */}
        <button
          onClick={handleSignOut}
          className="ios-list-row"
          style={{ width: "100%", justifyContent: "center", gap: 8, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--red)", minHeight: 52 }}
        >
          <LogOut style={{ width: 17, height: 17 }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600 }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
