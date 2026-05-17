"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { AlertTriangle, Filter, MoreVertical, Search } from "lucide-react";
import { useState, useMemo } from "react";

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const incidentsData = [
    { id: "INC-104", cat: "Deforestation", loc: "Northern Ridge", stat: "Critical" },
    { id: "INC-103", cat: "Water Pollution", loc: "Lake View", stat: "Investigating" },
    { id: "INC-102", cat: "Illegal Dumping", loc: "Highway 9", stat: "Resolved" },
    { id: "INC-101", cat: "Wildfire Risk", loc: "Sector 7", stat: "Monitoring" },
    { id: "INC-100", cat: "Wildlife Threat", loc: "National Park", stat: "Resolved" },
    { id: "INC-099", cat: "Air Quality", loc: "Downtown Core", stat: "Investigating" },
    { id: "INC-098", cat: "Noise Pollution", loc: "Industrial Zone", stat: "Monitoring" },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "border-2 border-secondary bg-secondary/15 text-secondary shadow-[0_0_12px_rgba(45,225,194,0.5)]";
      case "investigating":
      case "monitoring":
        return "border-2 border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,183,3,0.5)]";
      case "critical":
        return "border-2 border-accent bg-accent/25 text-accent shadow-[0_0_16px_rgba(255,183,3,0.7)] animate-pulse";
      default:
        return "border-2 border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(27,67,50,0.5)]";
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidentsData.filter((incident) => {
      const matchesSearch =
        !searchQuery ||
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.stat.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !selectedStatus || incident.stat === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, selectedStatus]);

  const statuses = Array.from(new Set(incidentsData.map((inc) => inc.stat)));

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">Reported Incidents</h1>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                  <input
                    type="text"
                    placeholder="Search ID, Category, Location, Status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
                  />
                </div>
                <button className="brutal-panel p-2 hover:bg-primary hover:text-white transition-colors cursor-pointer border-2 border-primary shadow-[2px_2px_0px_#1b4332]">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedStatus(null)}
                className={`px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-widest transition-all border-2 shadow-[2px_2px_0px_#1b4332] ${
                  selectedStatus === null
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-2 border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/40"
                }`}
              >
                All
              </button>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-widest transition-all border-2 shadow-[2px_2px_0px_#1b4332] ${
                    selectedStatus === status
                      ? getStatusColor(status)
                      : `border-2 border-foreground/20 text-foreground/80 hover:bg-foreground/10`
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-sm font-mono text-foreground/60 uppercase tracking-widest">
              Showing {filteredIncidents.length} of {incidentsData.length} incidents
            </div>

            {/* Incidents Table */}
            <div className="brutal-panel panel-surface p-0 overflow-hidden">
              <div className="grid grid-cols-12 font-mono font-bold text-xs sm:text-sm uppercase p-4 border-b-2 border-[#081c15]" style={{ backgroundColor: "#1b4332", color: "#f8f9fa" }}>
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((inc, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 items-center border-t-2 border-primary/20 p-4 hover:bg-secondary/10 transition-colors font-medium"
                  >
                    <div className="col-span-2 font-mono text-sm font-bold">{inc.id}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      {inc.stat === "Critical" && (
                        <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />
                      )}
                      {inc.cat}
                    </div>
                    <div className="col-span-3 surface-muted">{inc.loc}</div>
                    <div className="col-span-2">
                      <span className={`px-3 py-1.5 rounded text-xs font-bold uppercase font-mono tracking-widest transition-all ${getStatusColor(inc.stat)}`}>
                        {inc.stat}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <button className="p-1 hover:bg-primary/10 rounded transition-colors">
                        <MoreVertical className="w-5 h-5 text-primary" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 p-8 text-center col-span-12">
                  <div className="col-span-12 text-foreground/50 font-mono">
                    No incidents match your search criteria.
                  </div>
                </div>
              )}
            </div>

            {filteredIncidents.length > 0 && (
              <div className="flex justify-center mt-6">
                <button className="brutal-button px-6 py-3 rounded text-sm tracking-wider">
                  Load More Records
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
