import { getChangelog } from "@/lib/changelog";
import { ScrollText } from "lucide-react";

export const metadata = {
  title: "Changelog — LikasLens Admin",
};

const SECTION_COLORS: Record<string, string> = {
  Added: "bg-green/10 text-green border-green/30",
  Fixed: "bg-amber/10 text-amber border-amber/30",
  Changed: "bg-secondary/10 text-secondary border-secondary/30",
  Removed: "bg-red-500/10 text-red-500 border-red-500/30",
  Deprecated: "bg-ink/10 text-ink/60 border-ink/20",
  Security: "bg-purple-500/10 text-purple-500 border-purple-500/30",
};

export default function AdminChangelogPage() {
  const versions = getChangelog();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-4 border-primary pb-4">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl font-black uppercase">Changelog</h1>
        </div>
        <p className="font-mono text-sm surface-muted mt-1">
          Track all changes, fixes, and improvements to LikasLens.
        </p>
      </div>

      {/* Versions */}
      <div className="space-y-10">
        {versions.map((version) => (
          <section key={version.version} className="p-6 rounded-xl bg-panel border-2 border-ink/10 shadow-[4px_4px_0px_#1b4332]">
            {/* Version Header */}
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="font-heading text-2xl font-black uppercase">
                v{version.version}
              </h2>
              <span className="font-mono text-xs text-ink/40 tracking-wider">
                {version.date}
              </span>
            </div>

            {/* Sections */}
            <div className="space-y-5">
              {Object.entries(version.entries).map(([section, entries]) => (
                <div key={section}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest border rounded ${
                        SECTION_COLORS[section] || "bg-ink/5 text-ink/60 border-ink/10"
                      }`}
                    >
                      {section}
                    </span>
                    <div className="flex-1 h-px bg-ink/5" />
                  </div>

                  <ul className="space-y-2 pl-4">
                    {entries.map((entry, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 mt-2 rounded-full bg-ink/20 shrink-0" />
                        <span className="font-mono text-sm text-ink/80 leading-relaxed">
                          <span className="font-bold text-ink">{entry.scope}:</span>{" "}
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
