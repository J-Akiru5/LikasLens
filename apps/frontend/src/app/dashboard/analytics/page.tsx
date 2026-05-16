"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";
import { allProvinces, allTowns, getProvinceSummary, overallSummary } from "@/data/region6";
import { BarChart3, Globe, MapPin, Search, Shield } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role ?? "citizen";
      setUserRole(role);
      setChecking(false);
      if (!["analyst", "super_admin"].includes(role)) {
        router.replace("/dashboard");
      }
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen overflow-hidden bg-background font-body">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-primary" />
        </div>
      </div>
    );
  }

  if (!["analyst", "super_admin"].includes(userRole ?? "")) {
    return null;
  }

  const filteredTowns = allTowns.filter((t) => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.province.toLowerCase().includes(search.toLowerCase());
    const matchesProvince = !selectedProvince || t.province === selectedProvince;
    return matchesSearch && matchesProvince;
  });

  const summary = overallSummary();

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3 border-b-4 border-primary pb-4">
              <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-black uppercase">Town Analytics</h1>
                <p className="font-mono text-sm surface-muted">Region VI — Western Visayas</p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-accent bg-accent/10 text-accent rounded w-fit font-mono text-xs font-bold uppercase tracking-widest">
              <Shield className="w-4 h-4" />
              {userRole === "super_admin" ? "Super Admin" : "Analyst"} Access
            </div>

            {/* Region Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="brutal-panel panel-surface p-4 text-center">
                <div className="font-heading text-3xl font-black">{summary.totalProvinces}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Provinces</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <div className="font-heading text-3xl font-black">{summary.totalTowns}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Towns</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <div className="font-heading text-3xl font-black">{summary.totalBarangays.toLocaleString()}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Barangays</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <div className="font-heading text-3xl font-black">{summary.totalReports.toLocaleString()}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Reports Filed</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <div className="font-heading text-3xl font-black">{summary.totalResolved.toLocaleString()}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Resolved</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <div className="font-heading text-3xl font-black">
                  {summary.totalReports > 0
                    ? Math.round((summary.totalResolved / summary.totalReports) * 100)
                    : 0}%
                </div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Resolution</div>
              </div>
            </div>

            {/* Province Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProvinces.map((prov) => {
                const ps = getProvinceSummary(prov);
                return (
                  <div key={prov} className="brutal-panel panel-surface p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="w-5 h-5 text-primary" />
                      <h3 className="font-heading font-black text-lg uppercase">{prov}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-mono font-bold">{ps.totalTowns}</span> <span className="font-mono text-xs surface-muted">towns</span></div>
                      <div><span className="font-mono font-bold">{ps.totalBarangays.toLocaleString()}</span> <span className="font-mono text-xs surface-muted">barangays</span></div>
                      <div><span className="font-mono font-bold">{ps.totalReports.toLocaleString()}</span> <span className="font-mono text-xs surface-muted">reports</span></div>
                      <div><span className="font-mono font-bold">{ps.avgEcoScore}</span> <span className="font-mono text-xs surface-muted">avg eco score</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Town Selection */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-heading text-2xl font-black uppercase flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Towns
                </h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                    <input
                      type="text"
                      placeholder="Search town or province..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={selectedProvince ?? ""}
                    onChange={(e) => setSelectedProvince(e.target.value || null)}
                    className="brutal-panel theme-input px-3 py-2 rounded font-mono text-sm"
                  >
                    <option value="">All Provinces</option>
                    {allProvinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTowns.map((town) => (
                  <Link
                    key={town.id}
                    href={`/dashboard/analytics/towns/${town.id}`}
                    className="brutal-panel panel-surface p-5 hover:border-secondary hover:shadow-[4px_4px_0px_#2de1c2] transition-all border-2 border-transparent"
                  >
                    <div className="font-heading font-black text-lg">{town.name}</div>
                    <div className="font-mono text-xs uppercase tracking-widest surface-muted mt-1">{town.province}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 border border-primary/30 rounded text-xs font-mono font-bold">{town.classification}</span>
                      <span className="px-2 py-0.5 border border-primary/30 rounded text-xs font-mono">{town.totalBarangays} brgys</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {town.primaryEconomicDrivers.slice(0, 2).map((d) => (
                        <span key={d} className="text-[10px] font-mono surface-muted px-1.5 py-0.5 rounded bg-primary/5">{d}</span>
                      ))}
                      {town.primaryEconomicDrivers.length > 2 && (
                        <span className="text-[10px] font-mono surface-muted">+{town.primaryEconomicDrivers.length - 2}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {filteredTowns.length === 0 && (
                <div className="text-center py-12 font-mono surface-muted">No towns match your filters.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
