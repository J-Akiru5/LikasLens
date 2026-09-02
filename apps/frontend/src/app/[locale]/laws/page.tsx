"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import {
  Scale,
  Search,
  ExternalLink,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  AlertTriangle,
  Building2,
  BookOpen,
} from "lucide-react";
import { RevealSection, EmptySearch, EmptyFeed, Skeleton } from "@likaslens/shared";
import { createClient } from "@/utils/supabase/client";

interface Law {
  id: string;
  law_code: string;
  title: string;
  summary: string;
  category: string;
  issuing_agency: string;
  jurisdiction_scope: string | null;
  penalties?: string;
  source_url: string | null;
  is_active: boolean;
}

const OFFICIAL_PHILIPPINE_LAWS: Law[] = [
  {
    id: "ra-9003",
    law_code: "Republic Act No. 9003",
    title: "Ecological Solid Waste Management Act of 2000",
    summary:
      "Mandates systematic, comprehensive, and ecological solid waste management. Prohibits open dumping, burning of waste, and littering. Enforces mandatory waste segregation at source and establishment of Materials Recovery Facilities (MRFs) in every barangay.",
    category: "Solid Waste",
    issuing_agency: "DENR-EMB · Local Government Units (LGUs)",
    jurisdiction_scope: "National / All Barangays & LGUs",
    penalties: "Fines from ₱300 to ₱500,000 and 1 day to 6 years imprisonment.",
    source_url: "https://emb.gov.ph/ra-9003/",
    is_active: true,
  },
  {
    id: "ra-9275",
    law_code: "Republic Act No. 9275",
    title: "Philippine Clean Water Act of 2004",
    summary:
      "Provides for a comprehensive water quality management system to protect water bodies from land-based pollution sources. Enforces wastewater discharge permits, effluent standards, and mandates sewerage systems in commercial and industrial establishments.",
    category: "Clean Water",
    issuing_agency: "DENR-EMB · Laguna Lake Development Authority (LLDA)",
    jurisdiction_scope: "All Philippine River Basins & Coastal Waters",
    penalties: "Fines up to ₱200,000 per day of continuous discharge and closure.",
    source_url: "https://emb.gov.ph/ra-9275/",
    is_active: true,
  },
  {
    id: "pd-705",
    law_code: "Presidential Decree No. 705",
    title: "Revised Forestry Code of the Philippines",
    summary:
      "Regulates the management and utilization of all forest lands, watersheds, and mangrove reserves. Prohibits unauthorized cutting, gathering, or transporting of timber and forest products, as well as slash-and-burn farming (kaingin) in forest zones.",
    category: "Forest Cover",
    issuing_agency: "DENR Forest Management Bureau (FMB) · Forest Rangers",
    jurisdiction_scope: "All Public Forest Lands & Protected Watersheds",
    penalties: "Confiscation of timber/machinery; imprisonment up to 20 years.",
    source_url: "https://forestry.denr.gov.ph/",
    is_active: true,
  },
  {
    id: "ra-8749",
    law_code: "Republic Act No. 8749",
    title: "Philippine Clean Air Act of 1999",
    summary:
      "Establishes a comprehensive air pollution management policy to achieve and maintain healthy air quality nationwide. Regulates stationary industrial emissions, vehicular smoke-belching, and explicitly bans municipal and hazardous waste incineration.",
    category: "Clean Air",
    issuing_agency: "DENR-EMB · Land Transportation Office (LTO)",
    jurisdiction_scope: "National Airsheds & Urban Corridors",
    penalties: "Fines up to ₱100,000 per day and revocation of operating permits.",
    source_url: "https://emb.gov.ph/ra-8749/",
    is_active: true,
  },
  {
    id: "ra-8550-10654",
    law_code: "Republic Act No. 8550 (as amended by RA 10654)",
    title: "The Philippine Fisheries Code of 1998",
    summary:
      "Protects municipal fisheries and marine resources. Strictly outlaws dynamite (blast) fishing, cyaniding, commercial trawling in municipal waters (15km), and unauthorized exploitation of coral reefs and marine sanctuaries.",
    category: "Marine & Fisheries",
    issuing_agency: "DA - Bureau of Fisheries and Aquatic Resources (BFAR) · PCG",
    jurisdiction_scope: "Municipal Waters (0–15 km) & Exclusive Economic Zone (EEZ)",
    penalties: "Fines up to ₱45M for commercial vessels; 20 years mandatory imprisonment.",
    source_url: "https://www.bfar.da.gov.ph/",
    is_active: true,
  },
  {
    id: "ra-9147",
    law_code: "Republic Act No. 9147",
    title: "Wildlife Resources Conservation and Protection Act",
    summary:
      "Regulates the collection, trade, and possession of Philippine flora and fauna. Enforces critical habitat protections for endangered species, including the Philippine Eagle, Tamaraw, Pangolin, and marine turtles (Pawikan).",
    category: "Wildlife",
    issuing_agency: "DENR Biodiversity Management Bureau (BMB) · PCSD",
    jurisdiction_scope: "National / Terrestrial & Marine Habitats",
    penalties: "Imprisonment up to 12 years and fines up to ₱1,000,000.",
    source_url: "https://bmb.gov.ph/",
    is_active: true,
  },
  {
    id: "ra-7586-11038",
    law_code: "Republic Act No. 11038 (E-NIPAS Act)",
    title: "Expanded National Integrated Protected Areas System Act",
    summary:
      "Provides legal classification and strict protection for 107 national parks, wildlife sanctuaries, and protected seascapes. Establishes Protected Area Management Boards (PAMB) and mandates dedicated trust funds for conservation.",
    category: "Protected Areas",
    issuing_agency: "DENR-BMB · Protected Area Management Boards (PAMB)",
    jurisdiction_scope: "107 Declared National Protected Areas",
    penalties: "Fines from ₱200,000 to ₱5,000,000 and 1 to 12 years imprisonment.",
    source_url: "https://bmb.gov.ph/e-nipas/",
    is_active: true,
  },
  {
    id: "ra-6969",
    law_code: "Republic Act No. 6969",
    title: "Toxic Substances and Hazardous Wastes Control Act",
    summary:
      "Regulates the importation, manufacture, processing, handling, storage, transportation, sale, distribution, and disposal of chemical substances and hazardous wastes that present unreasonable risk to health and the environment.",
    category: "Hazardous Waste",
    issuing_agency: "DENR Environmental Management Bureau (EMB)",
    jurisdiction_scope: "National Industrial & Chemical Zones",
    penalties: "Imprisonment from 6 months to 10 years and fines up to ₱500,000.",
    source_url: "https://emb.gov.ph/ra-6969/",
    is_active: true,
  },
  {
    id: "pd-1586",
    law_code: "Presidential Decree No. 1586",
    title: "Environmental Impact Statement (EIS) System",
    summary:
      "Requires all government agencies and private corporations to secure an Environmental Compliance Certificate (ECC) before initiating projects within environmentally critical areas or of environmentally critical scale.",
    category: "Environmental Compliance",
    issuing_agency: "DENR Environmental Management Bureau (EMB)",
    jurisdiction_scope: "All Environmentally Critical Projects (ECPs)",
    penalties: "Immediate Cease and Desist Orders (CDO) and daily administrative fines.",
    source_url: "https://eia.emb.gov.ph/",
    is_active: true,
  },
  {
    id: "ra-9729",
    law_code: "Republic Act No. 9729",
    title: "Climate Change Act of 2009",
    summary:
      "Mainstreams climate change into government policy formulation. Mandates Local Climate Change Action Plans (LCCAP) across all 1,700+ Philippine municipalities and establishes the People's Survival Fund for vulnerable communities.",
    category: "Climate Resilience",
    issuing_agency: "Climate Change Commission (CCC) · DILG",
    jurisdiction_scope: "National & Local Municipalities",
    penalties: "Administrative sanctions for non-compliance with LCCAP submissions.",
    source_url: "https://climate.gov.ph/",
    is_active: true,
  },
  {
    id: "ra-10121",
    law_code: "Republic Act No. 10121",
    title: "Philippine Disaster Risk Reduction and Management Act",
    summary:
      "Provides for the development of policies and plans to strengthen national disaster risk reduction and environmental hazard mitigation. Mandates 5% of local government budgets for disaster preparedness and ecological protection.",
    category: "Disaster Risk",
    issuing_agency: "NDRRMC · Office of Civil Defense (OCD)",
    jurisdiction_scope: "All Provinces, Cities, and Municipalities",
    penalties: "Administrative dismissal and criminal charges for misuse of DRRM funds.",
    source_url: "https://www.ndrrmc.gov.ph/",
    is_active: true,
  },
  {
    id: "ra-7942",
    law_code: "Republic Act No. 7942",
    title: "Philippine Mining Act of 1995",
    summary:
      "Governs the exploration, development, and utilization of mineral resources. Mandates environmental rehabilitation funds, progressive mine rehabilitation, and strict penalties for unauthorized open-pit mining or tailings dam breaches.",
    category: "Mining & Minerals",
    issuing_agency: "DENR Mines and Geosciences Bureau (MGB)",
    jurisdiction_scope: "All Mineral Reservations & Mining Concessions",
    penalties: "Immediate revocation of permits and fines up to ₱50M for toxic tailings spills.",
    source_url: "https://mgb.gov.ph/",
    is_active: true,
  },
];

const CATEGORIES = [
  "All Categories",
  "Solid Waste",
  "Clean Water",
  "Forest Cover",
  "Clean Air",
  "Marine & Fisheries",
  "Wildlife",
  "Protected Areas",
  "Hazardous Waste",
];

const ITEMS_PER_PAGE = 9;

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>(OFFICIAL_PHILIPPINE_LAWS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchDatabaseLaws() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("environmental_laws_ph")
          .select("*")
          .order("law_code", { ascending: true });

        if (!error && data && data.length > 0) {
          // Database is the source of truth — show ONLY database laws
          // so admin CRUD (create/update/delete) is fully synced here.
          const dbLaws: Law[] = data.map((d: any) => ({
            id: d.id,
            law_code: d.law_code || d.code || "Republic Act",
            title: d.title,
            summary: d.summary || d.description || "",
            category: d.category || "Environmental Law",
            issuing_agency: d.issuing_agency || d.agency || "DENR",
            jurisdiction_scope: d.jurisdiction_scope || "National",
            penalties: d.penalties || "Statutory fines and imprisonment under Philippine jurisprudence.",
            source_url: d.source_url || null,
            is_active: d.is_active ?? true,
          }));
          setLaws(dbLaws);
        } else {
          // Database empty — use hardcoded as seed/initial data
          setLaws(OFFICIAL_PHILIPPINE_LAWS);
        }
      } catch {
        setLaws(OFFICIAL_PHILIPPINE_LAWS);
      } finally {
        setLoading(false);
      }
    }
    fetchDatabaseLaws();
  }, []);

  const filteredLaws = useMemo(() => {
    return laws.filter((law) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        law.law_code?.toLowerCase().includes(q) ||
        law.title?.toLowerCase().includes(q) ||
        law.summary?.toLowerCase().includes(q) ||
        law.issuing_agency?.toLowerCase().includes(q) ||
        law.category?.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        law.category?.toLowerCase() === selectedCategory.toLowerCase();

      return law.is_active && matchesSearch && matchesCategory;
    });
  }, [laws, search, selectedCategory]);

  // Reset to page 1 whenever search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredLaws.length / ITEMS_PER_PAGE));
  const paginatedLaws = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLaws.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLaws, currentPage]);

  const startCount = filteredLaws.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endCount = Math.min(currentPage * ITEMS_PER_PAGE, filteredLaws.length);
  const hasActiveFilters = Boolean(search || selectedCategory !== "All Categories");

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All Categories");
    setShowFilters(false);
  };

  return (
    <DashboardLayoutWrapper
      pageTitle="Environmental Laws"
      pageSubtitle="Philippine statutory jurisprudence and environmental enforcement mandates."
    >
      <div className="space-y-4">
        {/* Top Row: Search Input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              inputMode="search"
              placeholder="Search statute title, RA number, keywords, or issuing agency (e.g. RA 9003, Clean Water, DENR)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-panel/90 border border-ink/10 text-ink placeholder:text-ink/35 focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 rounded-xl shadow-xs transition-all"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3.5 py-2.5 border border-ink/10 text-ink/60 hover:text-ink transition-colors rounded-xl bg-panel shadow-xs shrink-0 cursor-pointer text-xs font-bold flex items-center gap-1.5"
              title="Clear filters"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Row Below: Naturally Wrapping Category Filter Pills (No Scrollbar, All Visible) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All Categories"
                ? laws.length
                : laws.filter((l) => l.category?.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-accent text-page shadow-xs"
                    : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                    isSelected
                      ? "bg-page/20 text-page border border-page/30 shadow-xs"
                      : "bg-ink/[0.06] dark:bg-white/10 text-ink/70 border border-ink/10"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter Summary */}
        <div className="bento-grid">
          <div className="span-12">
            <div className="flex items-center justify-between text-xs text-ink/50 font-mono">
              <span>
                Showing {startCount}–{endCount} of {filteredLaws.length} statutes
              </span>
              {totalPages > 1 && (
                <span>Page {currentPage} of {totalPages}</span>
              )}
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-panel rounded-2xl p-5 border border-ink/10 space-y-4 shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Laws Grid Cards */}
        {!loading && (
          <div className="space-y-6">
            {filteredLaws.length === 0 ? (
              search ? (
                <EmptySearch query={search} onClear={clearFilters} />
              ) : (
                <EmptyFeed
                  title="No statutes found"
                  description="No environmental laws match the selected criteria."
                />
              )
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedLaws.map((law) => (
                  <div
                    key={law.id}
                    className="p-5 rounded-2xl bg-panel border border-ink/15 shadow-sm hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          {law.category}
                        </span>

                        <span className="text-[10px] font-mono text-ink/40 uppercase font-semibold">
                          Active Statute
                        </span>
                      </div>

                      {/* Title & Law Code */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-500/15 transition-colors">
                          <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] uppercase tracking-wider font-bold text-teal-700 dark:text-teal-300">
                            {law.law_code}
                          </div>
                          <h3 className="font-bold text-base text-ink tracking-tight leading-snug mt-0.5">
                            {law.title}
                          </h3>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-ink/65 leading-relaxed mb-4 line-clamp-3 font-normal">
                        {law.summary}
                      </p>

                      {/* Statutory Penalty Callout */}
                      {law.penalties && (
                        <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 mb-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Statutory Penalties</span>
                          </div>
                          <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                            {law.penalties}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Authority & Official Link */}
                    <div className="pt-3.5 border-t border-ink/10 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink/60 truncate">
                        <Building2 className="w-3.5 h-3.5 text-ink/40 shrink-0" />
                        <span className="truncate">{law.issuing_agency}</span>
                      </div>

                      {law.source_url && (
                        <a
                          href={law.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-ink/[0.05] hover:bg-teal-500 hover:text-white text-ink/75 rounded-lg text-xs font-mono font-medium transition-all shadow-xs shrink-0"
                        >
                          <span>Statute</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls (Matching Incidents page exactly) */}
            {totalPages > 1 && (
              <div className="bento-grid pt-2">
                <div className="span-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-ink/10 bg-panel text-xs font-medium text-ink/70 hover:text-ink hover:bg-ink/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const hasGap = prev && page - prev > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {hasGap && (
                              <span className="px-1.5 text-ink/30 text-xs font-mono">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center ${
                                currentPage === page
                                  ? "bg-ink text-panel font-bold shadow-md scale-105"
                                  : "bg-panel border border-ink/10 text-ink/70 hover:text-ink hover:bg-ink/[0.04]"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-ink/10 bg-panel text-xs font-medium text-ink/70 hover:text-ink hover:bg-ink/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
