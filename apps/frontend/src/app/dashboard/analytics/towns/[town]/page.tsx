"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { createClient } from "@/utils/supabase/client";
import { isAnalystOrSuperAdmin, getRole } from "@/lib/roles";
import { getTownData } from "@/data/region6";
import type { TownData } from "@/data/region6";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Trees,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Fish,
  Leaf,
  Factory,
  Droplets,
  Scale,
  FileText,
  Search,
} from "lucide-react";

const RISK_STYLES: Record<string, { label: string; border: string; bg: string; text: string }> = {
  "low": { label: "Low", border: "border-secondary", bg: "bg-secondary/15", text: "text-secondary" },
  "moderate": { label: "Moderate", border: "border-accent", bg: "bg-accent/15", text: "text-accent" },
  "high": { label: "High", border: "border-accent", bg: "bg-accent/25", text: "text-accent" },
  "critical": { label: "Critical", border: "border-accent", bg: "bg-accent/30", text: "text-accent" },
};

const DRIVER_ICONS: Record<string, typeof Leaf> = {
  "Tourism": MapPin,
  "Coconut Farming": Trees,
  "Fishing": Fish,
  "Aquaculture": Droplets,
  "Rice Farming": Leaf,
  "Sugarcane": Factory,
  "Commerce": Building2,
  "Services": Scale,
  "Ecotourism": MapPin,
  "Mining": Factory,
  "Handicraft": FileText,
  "Handicraft Weaving": FileText,
  "Seaweed Farming": Droplets,
  "Livestock": Users,
  "Mango Farming": Trees,
  "Farming": Leaf,
};

function EnvScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-secondary" : score >= 50 ? "bg-accent" : "bg-accent";
  const textColor = score >= 75 ? "text-secondary" : "text-accent";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-4 bg-foreground/10 rounded overflow-hidden border-2 border-foreground/20">
        <div
          className={`h-full ${color} transition-all duration-500 shadow-[0_0_8px_var(--glow)]`}
          style={{ width: `${score}%`, "--glow": score >= 75 ? "rgba(45,225,194,0.6)" : "rgba(255,183,3,0.6)" } as React.CSSProperties}
        />
      </div>
      <span className={`font-mono text-sm font-bold ${textColor} w-8 text-right`}>
        {score}
      </span>
    </div>
  );
}

export default function TownDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [town, setTown] = useState<TownData | null>(null);
  const [barangaySearch, setBarangaySearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "environmentalScore" | "reportedIncidents" | "population">("name");
  const [sortAsc, setSortAsc] = useState(true);

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

      const slug = params.town as string;
      const data = getTownData(slug);
      setTown(data ?? null);
    }
    check();
  }, [router, params.town]);

  if (!authorized) return null;

  if (!town) {
    return (
      <div className="flex h-screen overflow-hidden bg-background font-body">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="smoke-overlay" />
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 relative z-10">
            <div className="max-w-7xl mx-auto text-center py-20">
              <div className="font-heading text-2xl font-black mb-2">Town Not Found</div>
              <div className="font-mono text-sm surface-muted mb-6">
                No data available for "{params.town}".
              </div>
              <Link
                href="/dashboard/analytics"
                className="brutal-button inline-flex items-center gap-2 px-6 py-3 rounded font-bold uppercase text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Towns
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const resolutionRate = town.totalReportedIncidents > 0
    ? Math.round((town.totalResolvedIncidents / town.totalReportedIncidents) * 100)
    : 0;

  const filteredBarangays = town.barangays
    .filter((b) =>
      !barangaySearch ||
      b.name.toLowerCase().includes(barangaySearch.toLowerCase()) ||
      b.riskLevel.includes(barangaySearch.toLowerCase()),
    )
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * mul;
      if (sortKey === "environmentalScore") return (a.environmentalScore - b.environmentalScore) * mul;
      if (sortKey === "reportedIncidents") return (a.reportedIncidents - b.reportedIncidents) * mul;
      return (a.population - b.population) * mul;
    });

  const atRisk = town.barangays.filter((b) => b.riskLevel === "high" || b.riskLevel === "critical").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4 border-b-4 border-primary pb-4">
              <Link
                href="/dashboard/analytics"
                className="p-2 border-2 border-primary rounded hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm font-mono font-bold uppercase tracking-widest surface-muted mb-1">
                  <MapPin className="w-4 h-4" />
                  {town.province}
                  <span className="mx-2">/</span>
                  <span className={town.classification === "city" ? "text-secondary" : "text-accent"}>
                    {town.classification}
                  </span>
                </div>
                <h1 className="font-heading text-4xl font-black uppercase tracking-tighter">
                  {town.name}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="brutal-panel panel-surface p-4 border-2 border-primary shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Barangays</div>
                <div className="font-heading text-3xl font-black mt-1 flex items-center gap-2">
                  {town.totalBarangays}
                  <Building2 className="w-5 h-5 surface-muted" />
                </div>
              </div>
              <div className="brutal-panel panel-surface p-4 border-2 border-secondary shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Env. Score</div>
                <div className="font-heading text-3xl font-black mt-1 flex items-center gap-2">
                  {town.avgEnvironmentalScore}
                  <Trees className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="brutal-panel panel-surface p-4 border-2 border-accent shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Reported</div>
                <div className="font-heading text-3xl font-black mt-1 flex items-center gap-2">
                  {town.totalReportedIncidents}
                  <AlertTriangle className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="brutal-panel panel-surface p-4 border-2 border-secondary shadow-[3px_3px_0px_#1b4332]">
                <div className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">Resolution</div>
                <div className="font-heading text-3xl font-black mt-1 flex items-center gap-2">
                  {resolutionRate}%
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="brutal-panel panel-surface p-6 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
                <h2 className="font-heading text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-secondary" />
                  Primary Economic Drivers
                </h2>
                <div className="flex flex-wrap gap-2">
                  {town.economicDrivers.map((driver) => {
                    const Icon = DRIVER_ICONS[driver] || FileText;
                    return (
                      <span
                        key={driver}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-primary/30 rounded font-mono text-xs font-bold uppercase tracking-wider bg-background/50"
                      >
                        <Icon className="w-3.5 h-3.5 text-secondary" />
                        {driver}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="brutal-panel panel-surface p-6 border-2 border-accent shadow-[4px_4px_0px_#1b4332]">
                <h2 className="font-heading text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                  Risk Overview
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold uppercase tracking-wider">At-Risk Barangays</span>
                    <span className="font-heading text-2xl font-black text-accent">{atRisk}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold uppercase tracking-wider">of {town.totalBarangays} total</span>
                    <span className="font-mono text-sm font-bold">
                      {town.totalBarangays > 0 ? Math.round((atRisk / town.totalBarangays) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-foreground/10 rounded overflow-hidden border-2 border-foreground/20 mt-2">
                    <div
                      className="h-full bg-accent transition-all duration-500 shadow-[0_0_8px_rgba(255,183,3,0.5)]"
                      style={{ width: `${town.totalBarangays > 0 ? (atRisk / town.totalBarangays) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="brutal-panel panel-surface border-2 border-secondary shadow-[4px_4px_0px_#1b4332] overflow-hidden">
              <div className="p-4 border-b-2 border-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-heading text-xl font-black uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Barangay Performance
                </h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                    <input
                      type="text"
                      placeholder="Search barangay..."
                      value={barangaySearch}
                      onChange={(e) => setBarangaySearch(e.target.value)}
                      className="pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332] w-48"
                    />
                  </div>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                    className="brutal-panel theme-input px-3 py-2 rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
                  >
                    <option value="name">Name</option>
                    <option value="environmentalScore">Score</option>
                    <option value="reportedIncidents">Incidents</option>
                    <option value="population">Population</option>
                  </select>
                  <button
                    onClick={() => setSortAsc((v) => !v)}
                    className="brutal-button px-3 py-2 rounded text-sm font-bold"
                  >
                    {sortAsc ? "ASC" : "DESC"}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b-2 border-primary/20 bg-primary/5">
                      <th className="text-left p-3 font-bold uppercase tracking-wider text-xs">Barangay</th>
                      <th className="text-left p-3 font-bold uppercase tracking-wider text-xs">Class</th>
                      <th className="text-right p-3 font-bold uppercase tracking-wider text-xs">Population</th>
                      <th className="text-right p-3 font-bold uppercase tracking-wider text-xs">Land (km²)</th>
                      <th className="text-center p-3 font-bold uppercase tracking-wider text-xs">Env. Score</th>
                      <th className="text-center p-3 font-bold uppercase tracking-wider text-xs">Risk</th>
                      <th className="text-right p-3 font-bold uppercase tracking-wider text-xs">Incidents</th>
                      <th className="text-right p-3 font-bold uppercase tracking-wider text-xs">Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBarangays.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center surface-muted">
                          No barangays match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredBarangays.map((b, i) => {
                        const rs = RISK_STYLES[b.riskLevel];
                        const resolvePct = b.reportedIncidents > 0
                          ? Math.round((b.resolvedIncidents / b.reportedIncidents) * 100)
                          : 0;
                        return (
                          <tr
                            key={b.name}
                            className={`border-t border-primary/10 hover:bg-primary/5 transition-colors ${
                              i % 2 === 0 ? "bg-background" : "bg-background/50"
                            }`}
                          >
                            <td className="p-3 font-bold">{b.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${
                                b.classification === "urban"
                                  ? "border-secondary text-secondary"
                                  : "border-primary text-primary"
                              }`}>
                                {b.classification}
                              </span>
                            </td>
                            <td className="p-3 text-right">{b.population.toLocaleString()}</td>
                            <td className="p-3 text-right">{b.landAreaKm2}</td>
                            <td className="p-3">
                              <EnvScoreBar score={b.environmentalScore} />
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${rs.border} ${rs.bg} ${rs.text}`}>
                                {rs.label}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold">{b.reportedIncidents}</td>
                            <td className="p-3 text-right">
                              <span className={resolvePct >= 70 ? "text-secondary" : "text-accent"}>
                                {b.resolvedIncidents}
                              </span>
                              <span className="surface-muted text-xs ml-1">({resolvePct}%)</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
