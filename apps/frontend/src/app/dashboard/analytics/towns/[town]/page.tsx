"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";
import { getTownById } from "@/data/region6";
import { ArrowLeft, BarChart3, Building2, FileText, Globe, Leaf, MapPin, Shield, TrendingUp, Users } from "lucide-react";

export default function TownDetailPage() {
  const params = useParams();
  const router = useRouter();
  const townId = params?.town as string;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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

  const town = getTownById(townId);

  const sortedBarangays = useMemo(() => {
    if (!town) return [];
    return [...town.barangays].sort((a, b) => {
      const aVal = a[sortField as keyof typeof a] ?? 0;
      const bVal = b[sortField as keyof typeof b] ?? 0;
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [town, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const townStats = useMemo(() => {
    if (!town) return null;
    const totalReports = town.barangays.reduce((s, b) => s + b.reportsFiled, 0);
    const totalResolved = town.barangays.reduce((s, b) => s + b.reportsResolved, 0);
    const totalPopulation = town.barangays.reduce((s, b) => s + b.population, 0);
    const avgEco = Math.round(town.barangays.reduce((s, b) => s + b.ecoScore, 0) / Math.max(1, town.barangays.length));
    const totalActive = town.barangays.reduce((s, b) => s + b.activeIssues, 0);
    return { totalReports, totalResolved, totalPopulation, avgEco, totalActive, resolutionRate: totalReports > 0 ? Math.round((totalResolved / totalReports) * 100) : 0 };
  }, [town]);

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

  if (!["analyst", "super_admin"].includes(userRole ?? "")) return null;

  if (!town) {
    return (
      <div className="flex h-screen overflow-hidden bg-background font-body">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="font-heading text-6xl font-black text-primary/30">404</div>
            <p className="font-mono surface-muted">Town not found</p>
            <Link href="/dashboard/analytics" className="inline-flex items-center gap-2 px-6 py-3 brutal-button rounded-lg font-heading font-black uppercase">
              <ArrowLeft className="w-4 h-4" /> Back to Analytics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sortIcon = (field: string) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/analytics"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors font-mono text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Analytics
              </Link>
              <span className="font-mono text-sm surface-muted">/</span>
              <span className="font-mono text-sm font-bold">{town.name}</span>
            </div>

            {/* Town Header */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-heading text-3xl md:text-5xl font-black uppercase">{town.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 font-mono text-sm surface-muted">
                        <Globe className="w-4 h-4" /> {town.province}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-primary/30" />
                      <span className="px-3 py-1 border border-primary/40 rounded font-mono text-xs font-bold">{town.classification}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-accent bg-accent/10 text-accent rounded w-fit font-mono text-xs font-bold uppercase tracking-widest shrink-0">
                  <Shield className="w-4 h-4" />
                  {userRole === "super_admin" ? "Super Admin" : "Analyst"}
                </div>
              </div>

              {/* Economic Drivers */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest mr-1">Economy:</span>
                {town.primaryEconomicDrivers.map((d) => (
                  <span key={d} className="px-3 py-1 border border-secondary/40 bg-secondary/10 text-secondary rounded font-mono text-xs font-bold">{d}</span>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="brutal-panel panel-surface p-4 text-center">
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-heading text-3xl font-black">{townStats!.totalReports.toLocaleString()}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Reports</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <TrendingUp className="w-5 h-5 text-secondary mx-auto mb-2" />
                <div className="font-heading text-3xl font-black">{townStats!.resolutionRate}%</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Resolution</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <FileText className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-heading text-3xl font-black">{townStats!.totalResolved.toLocaleString()}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Resolved</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-heading text-3xl font-black">{(townStats!.totalPopulation / 1000).toFixed(1)}K</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Population</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <Leaf className="w-5 h-5 text-secondary mx-auto mb-2" />
                <div className="font-heading text-3xl font-black">{townStats!.avgEco}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Avg Eco Score</div>
              </div>
              <div className="brutal-panel panel-surface p-4 text-center">
                <BarChart3 className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="font-heading text-3xl font-black">{townStats!.totalActive}</div>
                <div className="font-mono text-xs uppercase tracking-widest surface-muted">Active Issues</div>
              </div>
            </div>

            {/* Barangay Performance Table */}
            <div>
              <h2 className="font-heading text-2xl font-black uppercase mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Barangay Performance
              </h2>
              <div className="brutal-panel panel-surface overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-primary" style={{ backgroundColor: "#1b4332", color: "#f8f9fa" }}>
                      <Th className="text-left cursor-pointer" onClick={() => toggleSort("name")}>Barangay{sortIcon("name")}</Th>
                      <Th className="text-right cursor-pointer" onClick={() => toggleSort("population")}>Population{sortIcon("population")}</Th>
                      <Th className="text-right cursor-pointer" onClick={() => toggleSort("reportsFiled")}>Reports{sortIcon("reportsFiled")}</Th>
                      <Th className="text-right cursor-pointer" onClick={() => toggleSort("reportsResolved")}>Resolved{sortIcon("reportsResolved")}</Th>
                      <Th className="text-right cursor-pointer" onClick={() => toggleSort("resolutionRate")}>Rate{sortIcon("resolutionRate")}</Th>
                      <Th className="text-right cursor-pointer" onClick={() => toggleSort("ecoScore")}>Eco Score{sortIcon("ecoScore")}</Th>
                      <Th className="text-right cursor-pointer" onClick={() => toggleSort("activeIssues")}>Issues{sortIcon("activeIssues")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBarangays.map((b, i) => (
                      <tr key={b.name} className={`border-t border-primary/20 hover:bg-secondary/5 transition-colors ${i % 2 === 0 ? "bg-background/50" : ""}`}>
                        <Td className="font-bold">{b.name}</Td>
                        <Td className="text-right font-mono">{b.population.toLocaleString()}</Td>
                        <Td className="text-right font-mono">{b.reportsFiled}</Td>
                        <Td className="text-right font-mono">{b.reportsResolved}</Td>
                        <Td className="text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${b.resolutionRate >= 80 ? "text-secondary" : b.resolutionRate >= 60 ? "text-accent" : "text-red-400"}`}>
                            {b.resolutionRate}%
                          </span>
                        </Td>
                        <Td className="text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-primary/20 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${b.ecoScore >= 70 ? "bg-secondary" : b.ecoScore >= 50 ? "bg-accent" : "bg-red-400"}`} style={{ width: `${b.ecoScore}%` }} />
                            </div>
                            <span>{b.ecoScore}</span>
                          </div>
                        </Td>
                        <Td className="text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${b.activeIssues === 0 ? "text-secondary" : b.activeIssues <= 5 ? "text-accent" : "text-red-400"}`}>
                            {b.activeIssues}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Th({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <th className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest ${className ?? ""}`} onClick={onClick}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>;
}
