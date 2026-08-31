// apps/admin-portal/src/app/[locale]/(dashboard)/changelog/page.tsx
// Phase 6 sub-page sweep: section labels already styled; no CTAs/KPIs
import { getChangelog } from "@/lib/changelog";
import { ScrollText } from "lucide-react";

export const metadata = {
  title: "Changelog — LikasLens Admin",
};

const SECTION_COLORS: Record<string, string> = {
  Added: "bg-green/10 text-green",
  Fixed: "bg-amber/10 text-amber",
  Changed: "bg-ink/[0.04] text-ink/60",
  Removed: "bg-red/10 text-red",
  Deprecated: "bg-ink/[0.04] text-ink/70",
  Security: "bg-green/10 text-green",
};

export default function AdminChangelogPage() {
  const versions = getChangelog();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-ink/70" />
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">Changelog</h1>
        </div>
        <p className="font-mono text-base text-muted mt-1">
          Track all changes, fixes, and improvements to LikasLens.
        </p>
      </div>

      <div className="space-y-10">
        {versions.map((version) => (
          <section key={version.version} className="bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="font-semibold tracking-tight text-2xl text-ink">
                v{version.version}
              </h2>
              <span className="font-mono text-xs text-ink/70 tracking-wider">
                {version.date}
              </span>
            </div>

            <div className="space-y-5">
              {Object.entries(version.entries).map(([section, entries]) => (
                <div key={section}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="label-pill label-pill-light inline-block">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full ${
                        SECTION_COLORS[section] || "bg-ink/[0.04] text-ink/60"
                      }`}>
                        {section}
                      </span>
                    </span>
                    <div className="flex-1 h-px bg-ink/5" />
                  </div>

                  <ul className="space-y-2 pl-4">
                    {entries.map((entry, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 mt-2 rounded-full bg-ink/20 shrink-0" />
                        <span className="font-mono text-sm text-ink/70 leading-relaxed">
                          <span className="font-medium text-ink">{entry.scope}:</span>{" "}
                          {entry.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
