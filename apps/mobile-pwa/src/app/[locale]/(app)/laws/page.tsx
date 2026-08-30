"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Scale, Search, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { laravelGet, type PaginatedResponse } from "@likaslens/shared";

interface Law {
  id: string;
  law_code: string;
  title: string;
  summary: string;
  issuing_agency: string;
  jurisdiction_scope: string | null;
  source_url: string | null;
  is_active: boolean;
  category?: string;
  penalties?: string;
}

const CATEGORIES = [
  "All", "Solid Waste", "Clean Water", "Forest Cover", "Clean Air",
  "Marine & Fisheries", "Wildlife", "Protected Areas", "Hazardous Waste",
];

const OFFICIAL_PHILIPPINE_LAWS: Law[] = [
  { id: "ra-9003", law_code: "RA 9003", title: "Ecological Solid Waste Management Act of 2000", summary: "Provides for an ecological solid waste management program, creation of institutional mechanisms and incentives, and prohibition against the use of non-environmentally acceptable materials.", issuing_agency: "DENR-EMB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/2000/12/20/republic-act-no-9003/", is_active: true, category: "Solid Waste", penalties: "P300,000 fine and/or 6 years imprisonment" },
  { id: "ra-9275", law_code: "RA 9275", title: "Philippine Clean Water Act of 2004", summary: "Provides for the prevention, control and abatement of water pollution, and for the preservation of the quality of water.", issuing_agency: "DENR-EMB / LLDA", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/2004/03/22/republic-act-no-9275/", is_active: true, category: "Clean Water", penalties: "P200,000/day fine for continuous violation" },
  { id: "pd-705", law_code: "P.D. 705", title: "Revised Forestry Code of the Philippines", summary: "Revising and consolidating laws and regulations related to the conservation, management, development and proper use of the country's forest resources.", issuing_agency: "DENR-FMB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/1975/05/29/presidential-decree-no-705-s-1975/", is_active: true, category: "Forest Cover", penalties: "P500,000 fine and/or 12 years imprisonment" },
  { id: "ra-8749", law_code: "RA 8749", title: "Philippine Clean Air Act of 1999", summary: "Provides for a comprehensive national air pollution control program and for other purposes.", issuing_agency: "DENR-EMB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/1999/06/23/republic-act-no-8749/", is_active: true, category: "Clean Air", penalties: "P100,000/day fine for stationary sources" },
  { id: "ra-8550", law_code: "RA 8550", title: "Philippine Fisheries Code of 1998", summary: "Provides for the conservation, management, development and proper utilization of Philippine fishery and aquatic resources.", issuing_agency: "BFAR", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/1998/02/25/republic-act-no-8550/", is_active: true, category: "Marine & Fisheries", penalties: "P100,000 fine and/or 6 years imprisonment" },
  { id: "ra-9147", law_code: "RA 9147", title: "Wildlife Resources Conservation and Protection Act", summary: "Provides for the conservation, protection and sustainable management of Philippine wildlife and their habitats.", issuing_agency: "DENR-WMB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/2001/07/30/republic-act-no-9147/", is_active: true, category: "Wildlife", penalties: "P100,000 fine and/or 6 years imprisonment" },
  { id: "ra-11038", law_code: "RA 11038", title: "Expanded National Integrated Protected Areas System Act", summary: "Expanding the coverage of the National Integrated Protected Areas System and strengthening its management.", issuing_agency: "DENR-PAWB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/2018/07/01/republic-act-no-11038/", is_active: true, category: "Protected Areas", penalties: "P1,000,000 fine and/or 12 years imprisonment" },
  { id: "ra-6969", law_code: "RA 6969", title: "Toxic Substances and Hazardous and Nuclear Wastes Control Act", summary: "Regulates, restricts or prohibits the importation, manufacture, processing, distribution, use, transport, treatment and disposal of toxic substances and hazardous wastes.", issuing_agency: "DENR-EMB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/1990/10/23/republic-act-no-6969/", is_active: true, category: "Hazardous Waste", penalties: "P100,000 fine and/or 12 years imprisonment" },
  { id: "pd-1586", law_code: "P.D. 1586", title: "Philippine Environmental Impact Assessment System", summary: "Establishing an Environmental Impact Assessment System for certain projects and activities.", issuing_agency: "DENR-EMB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/1978/06/11/presidential-decree-no-1586/", is_active: true, category: "Protected Areas", penalties: "P50,000 fine and/or imprisonment" },
  { id: "ra-9729", law_code: "RA 9729", title: "Climate Change Act of 2009", summary: "Mainstreaming climate change into development policy frameworks and establishing the framework for climate change planning.", issuing_agency: "CCDENR", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/2009/10/28/republic-act-no-9729/", is_active: true, category: "Protected Areas", penalties: "P100,000 fine" },
  { id: "ra-10121", law_code: "RA 10121", title: "Philippine Disaster Risk Reduction and Management Act", summary: "Establishing the national disaster risk reduction and management framework and institutionalizing the disaster risk reduction and management system.", issuing_agency: "NDRRMC", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/2010/05/27/republic-act-no-10121/", is_active: true, category: "Protected Areas", penalties: "P500,000 fine" },
  { id: "ra-7942", law_code: "RA 7942", title: "Philippine Mining Act of 1995", summary: "An act instituting a reform of the mining sector, providing guidelines for sustainable development.", issuing_agency: "DENR-MGB", jurisdiction_scope: "National", source_url: "https://www.officialgazette.gov.ph/1995/03/03/republic-act-no-7942/", is_active: true, category: "Forest Cover", penalties: "P100,000 fine and/or 12 years imprisonment" },
];

const ITEMS_PER_PAGE = 6;

export default function LawsPage() {
  const [apiLaws, setApiLaws] = useState<Law[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { per_page: "50" };
        if (search) params.search = search;
        const qs = "?" + new URLSearchParams(params).toString();
        const res = await laravelGet<PaginatedResponse<Law>>(`/laws${qs}`);
        if (res.success) setApiLaws(res.data);
      } catch (err) {
        console.error("Failed to fetch laws:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const allLaws = useMemo(() => {
    const merged = [...OFFICIAL_PHILIPPINE_LAWS];
    apiLaws.forEach((apiLaw) => {
      const existing = merged.find((l) => l.law_code === apiLaw.law_code);
      if (existing) {
        Object.assign(existing, apiLaw);
      } else {
        merged.push(apiLaw);
      }
    });
    return merged.filter((l) => l.is_active);
  }, [apiLaws]);

  const filtered = useMemo(() => {
    let result = allLaws;
    if (selectedCategory !== "All") {
      result = result.filter((l) => l.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.law_code.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.issuing_agency.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allLaws, selectedCategory, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedLaws = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, selectedCategory]);

  return (
    <div className="min-h-full pb-20 bg-page">
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center h-16 px-4">
          <h1 className="text-xl font-bold text-ink tracking-tight">Environmental Laws</h1>
        </div>
      </div>

      <div className="p-4 space-y-5 mt-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text"
            placeholder="Search by title, code, agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-panel border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald-500 rounded-2xl shadow-xs transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-xl font-mono text-[10px] uppercase tracking-wider py-1.5 px-3 transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-panel border border-ink/10 text-ink/60 hover:border-emerald-500/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[11px] text-ink/50 font-bold uppercase tracking-wider">
            {filtered.length} active record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : paginatedLaws.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-6">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-ink/40" />
            </div>
            <p className="font-bold text-lg text-ink">No laws found</p>
            <p className="text-sm text-ink/50">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedLaws.map((law) => (
                <div key={law.id} className="bg-panel rounded-2xl p-4 border border-ink/[0.08] dark:border-white/10 shadow-xs active:scale-[0.99] transition-all space-y-3">
                  {/* Category + Active badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                        {law.category || "Environmental"}
                      </span>
                      <span className="text-[9px] font-mono text-ink/30">Active Statute</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Scale className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                  {/* Law code + Title */}
                  <div>
                    <p className="font-mono text-xs text-emerald-600 mb-1 uppercase tracking-wider font-bold">{law.law_code}</p>
                    <h3 className="font-bold text-sm text-ink leading-snug">{law.title}</h3>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-ink/60 line-clamp-3 leading-relaxed">{law.summary}</p>

                  {/* Penalty callout */}
                  {law.penalties && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider mb-0.5">Statutory Penalties</p>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{law.penalties}</p>
                    </div>
                  )}

                  {/* Agency + Source */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-ink/5">
                    <span className="text-[10px] font-mono text-ink/40 uppercase tracking-wider">{law.issuing_agency}</span>
                    {law.source_url && (
                      <a
                        href={law.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-panel border border-ink/10 text-ink disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-panel border border-ink/10 text-ink/60 hover:border-emerald-500/40"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-panel border border-ink/10 text-ink disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
