"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { createClient } from "@/utils/supabase/client";
import { isAnalystOrSuperAdmin, getRole } from "@/lib/roles";
import { getTownsByProvince } from "@/data/region6";
import type { Province, TownData } from "@/data/region6";
import {
  MapPin,
  ChevronRight,
  Building2,
  Trees,
  AlertTriangle,
  Search,
} from "lucide-react";
import Link from "next/link";

const PROVINCE_INFO: Record<
  Province,
  { label: string; color: string; borderColor: string; towns: number }
> = {
  "Aklan": { label: "Aklan", color: "text-secondary", borderColor: "border-secondary", towns: 17 },
  "Antique": { label: "Antique", color: "text-accent", borderColor: "border-accent", towns: 18 },
  "Capiz": { label: "Capiz", color: "text-primary", borderColor: "border-primary", towns: 17 },
  "Guimaras": { label: "Guimaras", color: "text-secondary", borderColor: "border-secondary", towns: 5 },
  "Iloilo": { label: "Iloilo", color: "text-accent", borderColor: "border-accent", towns: 43 },
  "Negros Occidental": { label: "Negros Occidental", color: "text-primary", borderColor: "border-primary", towns: 32 },
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Record<Province, TownData[]>>({} as Record<Province, TownData[]>);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const role = getRole(user?.user_metadata as Record<string, unknown> | null);
      if (!isAnalystOrSuperAdmin(role)) {
        router.replace("/dashboard");
        return;
      }
      setAuthorized(true);
      setData(getTownsByProvince());
    }
    check();
  }, [router]);

  if (!authorized) return null;

  const provinces = Object.entries(data) as [Province, TownData[]][];
  const hasSearch = search.trim().length > 0;

  const filtered = hasSearch
    ? provinces.map(([prov, towns]) => [
        prov,
        towns.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase()),
        ),
      ] as [Province, TownData[]])
    : provinces;

  const totalTowns = Object.values(data).reduce((s, t) => s + t.length, 0);
  const totalBarangays = Object.values(data).reduce(
    (s, towns) => s + towns.reduce((s2, t) => s2 + t.totalBarangays, 0),
    0,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">Town Analytics</h1>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                <input
                  type="text"
                  placeholder="Search towns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="brutal-panel panel-surface p-4 border-2 border-primary shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Towns</div>
                <div className="font-heading text-3xl font-black mt-1">{totalTowns}</div>
              </div>
              <div className="brutal-panel panel-surface p-4 border-2 border-secondary shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Provinces</div>
                <div className="font-heading text-3xl font-black mt-1">6</div>
              </div>
              <div className="brutal-panel panel-surface p-4 border-2 border-accent shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Total Barangays</div>
                <div className="font-heading text-3xl font-black mt-1">{totalBarangays.toLocaleString()}</div>
              </div>
            </div>

            {filtered.map(([province, towns]) => {
              if (towns.length === 0) return null;
              const info = PROVINCE_INFO[province];
              const avgScore = Math.round(
                towns.reduce((s, t) => s + t.avgEnvironmentalScore, 0) / towns.length,
              );
              const totalIncidents = towns.reduce((s, t) => s + t.totalReportedIncidents, 0);
              const totalResolved = towns.reduce((s, t) => s + t.totalResolvedIncidents, 0);

              return (
                <div
                  key={province}
                  className={`brutal-panel panel-surface border-2 ${info.borderColor} shadow-[4px_4px_0px_#1b4332] overflow-hidden`}
                >
                  <div className={`p-4 border-b-2 ${info.borderColor} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-5 h-5 ${info.color}`} />
                      <h2 className="font-heading text-xl font-black uppercase tracking-wider">
                        {province}
                      </h2>
                      <span className="font-mono text-xs font-bold px-2 py-1 border-2 rounded surface-muted">
                        {towns.length} towns
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono font-bold uppercase tracking-widest surface-muted">
                      <span className="flex items-center gap-1">
                        <Trees className="w-3 h-3 text-secondary" />
                        {avgScore} avg
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-accent" />
                        {totalIncidents}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {towns.map((town) => {
                        const scoreColor =
                          town.avgEnvironmentalScore >= 75
                            ? "text-secondary"
                            : town.avgEnvironmentalScore >= 50
                            ? "text-accent"
                            : "text-accent";
                        return (
                          <Link
                            key={town.name}
                            href={`/dashboard/analytics/towns/${town.name.toLowerCase().replace(/\s+/g, "-")}`}
                            className="group flex items-center justify-between p-3 border-2 border-primary/20 hover:border-primary rounded transition-all hover:bg-primary/5 hover:shadow-[2px_2px_0px_#1b4332]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="w-4 h-4 shrink-0 surface-muted" />
                              <span className="font-bold text-sm truncate">{town.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-mono text-xs font-bold ${scoreColor}`}>
                                {town.avgEnvironmentalScore}
                              </span>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity surface-muted" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasSearch && filtered.every(([, towns]) => towns.length === 0) && (
              <div className="text-center py-12 surface-muted font-mono text-sm">
                No towns match "{search}".
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
