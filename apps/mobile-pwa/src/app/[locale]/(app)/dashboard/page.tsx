"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DashboardSkeleton,
  laravelGet,
  getDashboardFeed,
  showToast,
  EmptyFeed,
} from "@likaslens/shared";
import type { DashboardStats, ApiResponse, ActivityFeedItem } from "@likaslens/shared";
import { Camera, ChevronRight, Gift, Award, Activity, Zap, Scale } from "lucide-react";
import { LargeTitle } from "@/components/native/large-title";
import { useHaptics } from "@/hooks/use-haptics";

const PARTNER_OFFERS = [
  { name: "7-Eleven", shortName: "7-ELEVEN", offer: "Free Coffee", points: 150 },
  { name: "SM Supermalls", shortName: "SM", offer: "₱50 GC", points: 500 },
  { name: "Jollibee Foundation", shortName: "JOLLIBEE", offer: "Meal Voucher", points: 300 },
  { name: "Globe Telecom", shortName: "GLOBE", offer: "1GB Data", points: 200 },
  { name: "Mercury Drug", shortName: "MERCURY", offer: "₱100 Off", points: 400 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const haptic = useHaptics();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [statsRes, feedRes] = await Promise.all([
          laravelGet<ApiResponse<DashboardStats>>("/dashboard/stats", controller.signal),
          getDashboardFeed(),
        ]);
        setStats(statsRes?.data ?? null);
        setFeed(feedRes?.data ?? []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load dashboard:", err);
          showToast("Failed to load dashboard data", "error");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  if (loading) {
    return (
      <div className="p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  const points = (stats as any)?.reward_points_balance ?? 0;
  const totalReports = stats?.total_reports ?? 0;
  const resolvedToday = stats?.resolved_today ?? 0;
  const activeIncidents = stats?.active_incidents ?? 0;

  return (
    <div className="pb-28">
      <div className="px-5">
        <LargeTitle
          title="Dashboard"
          subtitle="Welcome back. Here's your environmental record today."
          trailing={
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 11px",
                borderRadius: 9999,
                background: "color-mix(in oklab, var(--accent) 10%, transparent)",
              }}
            >
              <Award style={{ width: 14, height: 14, color: "var(--accent)" }} />
              <span style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                {points.toLocaleString()}
              </span>
            </div>
          }
        />
      </div>

      <div className="px-5">
        {/* ── Forensic photo banner with the primary action ─────────────────── */}
        <Link
          href={`/${locale}/report?quick=true`}
          onClick={() => haptic("medium")}
          className="m-banner-wrap block relative"
          style={{ marginBottom: 20, minHeight: 132 }}
        >
          <Image
            src="https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=900&q=80"
            alt="A river winding through forested Philippine highlands"
            fill
            sizes="100vw"
            priority
          />
          <div className="m-banner-scrim" />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 18px", gap: 4 }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start",
                fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.05em", textTransform: "uppercase",
                color: "var(--accent-bright)", marginBottom: 2,
              }}
            >
              <Zap style={{ width: 11, height: 11 }} /> Quick report
            </span>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#f0ede8", margin: 0, lineHeight: 1.1 }}>
              See something. Snap it.
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "rgba(240,237,232,0.7)", margin: 0 }}>
              Camera ready · AI routes it to the right agency
            </p>
          </div>
        </Link>

        {/* ── My Impact — grouped inset card, mono on numbers only ─────────── */}
        <section style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, padding: "0 2px" }}>
            <h2 className="ios-section-label">My impact</h2>
            <Link
              href={`/${locale}/impact`}
              className="flex items-center gap-0.5"
              style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
            >
              Details <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div className="ios-grouped-list" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: 0 }}>
            {[
              { label: "Reports", value: totalReports, color: "var(--ink)" },
              { label: "Resolved", value: resolvedToday, color: "var(--green)" },
              { label: "Active", value: activeIncidents, color: "var(--amber)" },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  borderRight: i < 2 ? "1px solid var(--border)" : "none",
                }}
              >
                <p style={{ fontFamily: "var(--font-data)", fontSize: 26, fontWeight: 700, color: item.color, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {item.value.toLocaleString()}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick actions rail ───────────────────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <div className="ios-grouped-list" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "10px 6px" }}>
            {[
              { href: `/${locale}/report`, label: "Report", Icon: Camera },
              { href: `/${locale}/wallet`, label: "Wallet", Icon: Gift },
              { href: `/${locale}/laws`, label: "Laws", Icon: Scale },
              { href: `/${locale}/impact`, label: "Impact", Icon: Activity },
            ].map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={() => haptic("light")}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="ios-row-icon" style={{ background: "color-mix(in oklab, var(--ink) 4%, transparent)", width: 40, height: 40, borderRadius: 12 }}>
                  <Icon style={{ width: 18, height: 18, color: "var(--ink)" }} />
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Partner offers rail (horizontal snap) ────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, padding: "0 2px" }}>
            <h2 className="ios-section-label">Redeem eco-credits</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide">
            {PARTNER_OFFERS.map((offer) => (
              <div
                key={offer.name}
                className="flex-shrink-0 snap-start"
                style={{ width: 148, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}
              >
                <div className="ios-row-icon" style={{ background: "color-mix(in oklab, var(--accent) 10%, transparent)", width: 36, height: 36 }}>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>
                    {offer.shortName.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{offer.offer}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>{offer.name}</p>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{offer.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent activity — grouped rows ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, padding: "0 2px" }}>
            <h2 className="ios-section-label">Recent activity</h2>
            <Link
              href={`/${locale}/history`}
              className="flex items-center gap-0.5"
              style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
            >
              All <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {feed.length === 0 ? (
            <EmptyFeed description="No recent activity" />
          ) : (
            <div className="ios-grouped-list">
              {feed.map((item) => {
                const dotColor =
                  item.type === "Critical" ? "var(--red)" :
                  item.type === "Warning" ? "var(--amber)" : "var(--green)";
                return (
                  <div key={item.id} className="ios-list-row">
                    <div className="ios-row-icon" style={{ background: `color-mix(in oklab, ${dotColor} 12%, transparent)` }}>
                      <span className="m-status-dot" style={{ background: dotColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.location || item.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{item.status}</p>
                      <p style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
