"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import {
  AlertTriangle,
  Filter,
  MoreVertical,
  Search,
  Eye,
  CheckCircle,
  ArrowUpRight,
  UserPlus,
  X,
} from "lucide-react";

type IncidentStatus = "Critical" | "Investigating" | "Resolved" | "Monitoring";

type Incident = {
  id: string;
  cat: string;
  loc: string;
  stat: IncidentStatus;
};

const ALL_INCIDENTS: Incident[] = [
  { id: "INC-104", cat: "Deforestation", loc: "Northern Ridge", stat: "Critical" },
  { id: "INC-103", cat: "Water Pollution", loc: "Lake View", stat: "Investigating" },
  { id: "INC-102", cat: "Illegal Dumping", loc: "Highway 9", stat: "Resolved" },
  { id: "INC-101", cat: "Wildfire Risk", loc: "Sector 7", stat: "Monitoring" },
  { id: "INC-100", cat: "Wildlife Threat", loc: "National Park", stat: "Resolved" },
  { id: "INC-099", cat: "Mining Spill", loc: "Copper Basin", stat: "Critical" },
  { id: "INC-098", cat: "Air Pollution", loc: "Industrial Zone 4", stat: "Investigating" },
  { id: "INC-097", cat: "Deforestation", loc: "Eastern Grove", stat: "Monitoring" },
  { id: "INC-096", cat: "River Pollution", loc: "Crystal Creek", stat: "Critical" },
  { id: "INC-095", cat: "Illegal Dumping", loc: "Backstreet Alley", stat: "Resolved" },
  { id: "INC-094", cat: "Poaching", loc: "Reserve 9", stat: "Investigating" },
  { id: "INC-093", cat: "Wildfire Risk", loc: "Hilltop Camp", stat: "Monitoring" },
  { id: "INC-092", cat: "Water Pollution", loc: "Blue Lagoon", stat: "Resolved" },
  { id: "INC-091", cat: "Toxic Waste", loc: "Warehouse 7", stat: "Critical" },
  { id: "INC-090", cat: "Deforestation", loc: "Riverbank Trail", stat: "Investigating" },
];

const STATUSES: IncidentStatus[] = ["Critical", "Investigating", "Monitoring", "Resolved"];
const CATEGORIES = [...new Set(ALL_INCIDENTS.map((i) => i.cat))];

const ITEMS_PER_PAGE = 5;

export default function IncidentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = ALL_INCIDENTS.filter((inc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      inc.id.toLowerCase().includes(q) ||
      inc.cat.toLowerCase().includes(q) ||
      inc.loc.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || inc.stat === statusFilter;
    const matchesCategory = !categoryFilter || inc.cat === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const statusBadge = (stat: IncidentStatus) => {
    const base =
      "px-2 py-1 rounded text-xs font-bold border-2 uppercase font-mono tracking-widest";
    if (stat === "Critical") return `${base} border-accent text-accent`;
    if (stat === "Resolved") return `${base} border-secondary text-primary`;
    return `${base} border-primary text-primary`;
  };

  const handleAction = (action: string, id: string) => {
    setOpenMenuId(null);
    alert(`${action} triggered for ${id}`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setShowFilters(false);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const hasActiveFilters = search || statusFilter || categoryFilter;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">
                Reported Incidents
              </h1>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  <input
                    type="text"
                    placeholder="Search ID or Keyword..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setVisibleCount(ITEMS_PER_PAGE);
                    }}
                    className="pl-9 pr-4 py-2 border-2 border-primary rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-secondary shadow-[2px_2px_0px_#1b4332] bg-background text-foreground"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`brutal-panel p-2 transition-colors cursor-pointer border-2 border-primary shadow-[2px_2px_0px_#1b4332] ${showFilters ? "bg-primary text-white" : "hover:bg-primary hover:text-white"}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="p-2 border-2 border-accent text-accent hover:bg-accent hover:text-white transition-colors rounded shadow-[2px_2px_0px_#1b4332]"
                    title="Clear all filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="brutal-panel bg-white p-4 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-xs font-bold uppercase text-primary/70">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as IncidentStatus | "");
                      setVisibleCount(ITEMS_PER_PAGE);
                    }}
                    className="border-2 border-primary rounded px-3 py-2 font-mono text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-xs font-bold uppercase text-primary/70">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setVisibleCount(ITEMS_PER_PAGE);
                    }}
                    className="border-2 border-primary rounded px-3 py-2 font-mono text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="font-mono text-xs text-primary/50 ml-auto self-end">
                  {filtered.length} incident{filtered.length !== 1 ? "s" : ""} found
                </div>
              </div>
            )}

            <div className="brutal-panel bg-white p-0 overflow-hidden">
              <div className="grid grid-cols-12 bg-primary text-white font-mono font-bold text-xs sm:text-sm uppercase p-4">
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {displayed.length === 0 ? (
                <div className="p-8 text-center font-mono text-primary/50">
                  No incidents match your filters.
                </div>
              ) : (
                displayed.map((inc) => (
                  <div
                    key={inc.id}
                    className="grid grid-cols-12 items-center border-t-2 border-primary/20 p-4 hover:bg-secondary/10 transition-colors font-medium"
                  >
                    <div className="col-span-2 font-mono text-sm font-bold">
                      {inc.id}
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      {inc.stat === "Critical" && (
                        <AlertTriangle className="w-4 h-4 text-accent" />
                      )}
                      {inc.cat}
                    </div>
                    <div className="col-span-3 opacity-80">{inc.loc}</div>
                    <div className="col-span-2">
                      <span className={statusBadge(inc.stat)}>{inc.stat}</span>
                    </div>
                    <div className="col-span-2 text-right relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === inc.id ? null : inc.id
                          )
                        }
                        className="p-1 hover:bg-primary/10 rounded transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-5 h-5 text-primary" />
                      </button>

                      {openMenuId === inc.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-primary shadow-[4px_4px_0px_#1b4332] z-50 rounded font-mono text-sm"
                        >
                          <button
                            onClick={() => handleAction("View", inc.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-primary/10 transition-colors text-left cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {inc.stat !== "Resolved" && (
                            <button
                              onClick={() => handleAction("Resolve", inc.id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-primary/10 transition-colors text-left cursor-pointer border-t border-primary/10"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Resolved
                            </button>
                          )}
                          {inc.stat !== "Critical" && (
                            <button
                              onClick={() => handleAction("Escalate", inc.id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-primary/10 transition-colors text-left cursor-pointer border-t border-primary/10"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                              Escalate
                            </button>
                          )}
                          <button
                            onClick={() => handleAction("Assign", inc.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-primary/10 transition-colors text-left cursor-pointer border-t border-primary/10"
                          >
                            <UserPlus className="w-4 h-4" />
                            Assign
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-center mt-6">
              {hasMore ? (
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="brutal-button px-6 py-3 rounded text-sm tracking-wider cursor-pointer"
                >
                  Load More Records ({filtered.length - displayed.length} remaining)
                </button>
              ) : (
                filtered.length > ITEMS_PER_PAGE && (
                  <span className="font-mono text-sm text-primary/50">
                    All {filtered.length} records shown
                  </span>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
