"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Scale,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  Waves,
  Wind,
  Trees,
  Trash2,
  FileCheck2,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface AgencyBadge {
  name: string;
  role: string;
}

interface EnforcementAction {
  dispatchTime: string;
  orderType: string;
  verification: string;
  citation: string;
}

interface LawStatute {
  code: string;
  titleKey: string;
  agencyKey: string;
  icon: typeof Trash2;
  color: string;
  agencies: AgencyBadge[];
  actions: EnforcementAction;
  violations: string[];
}

const STATUTE_LIST: LawStatute[] = [
  {
    code: "RA 9003",
    titleKey: "ra9003Title",
    agencyKey: "ra9003Agency",
    icon: Trash2,
    color: "#059669", // Clean emerald
    agencies: [
      { name: "DENR-EMB", role: "Primary Enforcement" },
      { name: "LGU Solid Waste Board", role: "Local Jurisdiction" },
    ],
    actions: {
      dispatchTime: "Within 24–48 Hours",
      orderType: "Mandatory Site Inspection & Cleanup Notice",
      verification: "Public record resolution verified with before/after photos",
      citation: "DENR AO 2001-34 & LGU Environmental Code",
    },
    violations: ["Open Dumping", "Waste Incineration", "Unsegregated Waste", "Littering Waterways"],
  },
  {
    code: "RA 9275",
    titleKey: "ra9275Title",
    agencyKey: "ra9275Agency",
    icon: Waves,
    color: "#0284c7", // Clean ocean blue
    agencies: [
      { name: "DENR-EMB", role: "Water Quality Division" },
      { name: "Philippine Coast Guard", role: "Marine Environmental Protection" },
    ],
    actions: {
      dispatchTime: "Immediate Marine Dispatch",
      orderType: "Water Sampling & Cease-and-Desist Order (CDO)",
      verification: "Continuous waterway testing until safe water standards are met",
      citation: "Clean Water Act Implementing Rules (DAO 2005-10)",
    },
    violations: ["Industrial Effluent", "Chemical Runoff", "Oil Discharge", "Blackwater Disposal"],
  },
  {
    code: "RA 8749",
    titleKey: "ra8749Title",
    agencyKey: "ra8749Agency",
    icon: Wind,
    color: "#6366f1", // Clean slate indigo
    agencies: [
      { name: "DENR-EMB Air Quality", role: "Industrial Emissions" },
      { name: "LGU Environment Office", role: "Anti-Smoke Belching Unit" },
    ],
    actions: {
      dispatchTime: "Same-Day Taskforce Dispatch",
      orderType: "Smoke Opacity Audit & Facility Stop Order",
      verification: "Emission compliance certification on public record",
      citation: "Clean Air Act AO 2000-81 & National Air Quality Standards",
    },
    violations: ["Toxic Smoke Plumes", "Unlicensed Flaring", "Open Biomass Burning", "Dust Emission"],
  },
  {
    code: "PD 705",
    titleKey: "pd705Title",
    agencyKey: "pd705Agency",
    icon: Trees,
    color: "#0d9488", // Clean teal green
    agencies: [
      { name: "DENR Forest Management (FMB)", role: "Forest Ranger Task Force" },
      { name: "PCSD Enforcement", role: "Palawan Sustainable Dev Council" },
    ],
    actions: {
      dispatchTime: "Rapid Ranger Deployment",
      orderType: "Field Interception & Confiscation of Illicit Timber",
      verification: "Perpetual watershed protection filing logged to registry",
      citation: "Revised Forestry Code PD 705 Sec. 68 & EO 277",
    },
    violations: ["Illegal Logging", "Timber Smuggling", "Watershed Encroachment", "Mangrove Destruction"],
  },
];

export function StatutoryGroundingBar() {
  const t = useTranslations("statutes");
  const [selectedStatute, setSelectedStatute] = useState<string | null>("RA 9003");

  const activeStatute = selectedStatute ? STATUTE_LIST.find((s) => s.code === selectedStatute) || null : null;

  return (
    <section id="laws" className="relative z-10 py-12 px-5 sm:px-8 scroll-mt-16 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
              <Scale className="w-3.5 h-3.5" />
              Legal Grounding & Jurisdiction
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-heading text-ink tracking-tight">
              {t("title")}
            </h3>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted bg-page px-3.5 py-2 rounded-xl border border-border self-start md:self-auto shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Zero-Hallucination Legal Mapping</span>
          </div>
        </div>

        {/* 4 Statute Selector Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STATUTE_LIST.map((statute) => {
            const isSelected = selectedStatute === statute.code;
            const Icon = statute.icon;

            return (
              <button
                key={statute.code}
                type="button"
                onClick={() => setSelectedStatute((prev) => (prev === statute.code ? null : statute.code))}
                aria-expanded={isSelected}
                className="w-full group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.98] select-none shadow-xs"
                style={{
                  background: isSelected ? "var(--page)" : "var(--page)",
                  borderColor: isSelected ? statute.color : "var(--border)",
                  boxShadow: isSelected
                    ? `0 0 0 1.5px ${statute.color}, 0 8px 20px -6px rgba(0,0,0,0.12)`
                    : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Clean Top Accent Line on Active */}
                {isSelected && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-4 right-4 h-1 rounded-b-full transition-all"
                    style={{ backgroundColor: statute.color }}
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? `color-mix(in srgb, ${statute.color} 16%, transparent)`
                        : "var(--panel)",
                      color: isSelected ? statute.color : "var(--muted)",
                      border: `1px solid ${isSelected ? `color-mix(in srgb, ${statute.color} 30%, transparent)` : "var(--border)"}`,
                    }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  <span
                    className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors"
                    style={{
                      backgroundColor: isSelected ? statute.color : "var(--panel)",
                      color: isSelected ? "#ffffff" : "var(--muted)",
                      border: isSelected ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {statute.code}
                  </span>
                </div>

                <p className="font-heading font-bold text-sm text-ink leading-tight line-clamp-2 min-h-[2.5rem]">
                  {t(statute.titleKey as any)}
                </p>

                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted">
                  <span className="font-mono text-[10px] uppercase truncate">
                    {statute.violations.length} Violation Classes
                  </span>
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: isSelected ? "rotate(180deg)" : "none",
                      color: isSelected ? statute.color : "var(--muted)",
                    }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Statute Detail Drawer */}
        <AnimatePresence>
          {activeStatute && (
            <m.div
              key="statute-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-2xl border border-border bg-page mt-4 shadow-lg"
            >
              {/* Inner Content with cross-fade animation when changing tabs */}
              <m.div
                key={activeStatute.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-7"
              >
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Column 1: Legal Citation & Enforcing Authority Chips (4 cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-xs"
                        style={{ backgroundColor: activeStatute.color }}
                      >
                        {activeStatute.code}
                      </span>
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">
                        Official Philippine Law
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-base sm:text-lg text-ink leading-snug">
                        {t(activeStatute.titleKey as any)}
                      </h4>
                      <p className="text-xs font-mono text-muted mt-1 leading-relaxed">
                        {activeStatute.actions.citation}
                      </p>
                    </div>

                    {/* Government Agency Badges */}
                    <div className="pt-2">
                      <p className="font-mono text-[10px] uppercase text-muted tracking-wider mb-2 font-bold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        Assigned Government Authority
                      </p>
                      <div className="space-y-1.5">
                        {activeStatute.agencies.map((agency, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-panel border border-border text-xs shadow-2xs"
                          >
                            <span className="font-bold text-ink font-heading">{agency.name}</span>
                            <span className="font-mono text-[10px] text-muted">{agency.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Official Government Enforcement Response (4 cols) */}
                  <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-panel border border-border shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Government Response Action</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted uppercase font-bold bg-page px-2 py-0.5 rounded border border-border">
                        Mandatory
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-muted uppercase tracking-wider">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>Dispatch SLA</span>
                        </div>
                        <p className="font-heading font-extrabold text-sm sm:text-base text-ink mt-0.5">
                          {activeStatute.actions.dispatchTime}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <span className="font-mono text-[10px] text-muted uppercase tracking-wider">Enforcement Order</span>
                        <p className="font-heading font-bold text-xs sm:text-sm text-ink mt-0.5 leading-snug">
                          {activeStatute.actions.orderType}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-border flex items-center gap-1.5 text-[10px] font-mono text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{activeStatute.actions.verification}</span>
                    </div>
                  </div>

                  {/* Column 3: Automatically Triaged Violation Classes (4 cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase text-muted tracking-wider font-bold flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                        Triaged Violation Classes
                      </p>
                      <span
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${activeStatute.color} 15%, transparent)`,
                          color: activeStatute.color,
                        }}
                      >
                        {activeStatute.violations.length} Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeStatute.violations.map((v, i) => (
                        <div
                          key={i}
                          className="group p-2.5 rounded-xl bg-panel border border-border hover:border-ink/20 transition-all flex items-center gap-2 shadow-2xs"
                        >
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${activeStatute.color} 20%, transparent)`,
                              color: activeStatute.color,
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-semibold text-ink transition-colors truncate">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-muted leading-relaxed pt-1">
                      Reports mapped to these violations automatically include legal citations in the government docket.
                    </p>
                  </div>

                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
