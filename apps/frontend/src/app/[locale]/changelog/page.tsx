import { getChangelog } from "@/lib/changelog";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  return {
    title: t("changelogTitle"),
    description: t("changelogDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/changelog`,
      languages: {
        en: `${baseUrl}/en/changelog`,
        fil: `${baseUrl}/fil/changelog`,
        vi: `${baseUrl}/vi/changelog`,
        id: `${baseUrl}/id/changelog`,
        ms: `${baseUrl}/ms/changelog`,
        ta: `${baseUrl}/ta/changelog`,
        "x-default": `${baseUrl}/en/changelog`,
      } as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "LikasLens",
      title: t("changelogTitle"),
      description: t("changelogDescription"),
      locale,
      url: `${baseUrl}/${locale}/changelog`,
      images: [
        {
          url: `${baseUrl}/twitter-image.jpg`,
          width: 1200,
          height: 630,
          alt: "LikasLens — From snapshot to solution",
        },
      ],
    },
  };
}

const SECTION_COLORS: Record<string, string> = {
  Added: "bg-green/10 text-green border-green/30",
  Fixed: "bg-amber/10 text-amber border-amber/30",
  Changed: "bg-secondary/10 text-secondary border-secondary/30",
  Removed: "bg-red-500/10 text-red-500 border-red-500/30",
  Deprecated: "bg-ink/10 text-ink/60 border-ink/20",
  Security: "bg-purple-500/10 text-purple-500 border-purple-500/30",
};

export default function ChangelogPage() {
  const versions = getChangelog();

  return (
    <main className="min-h-screen bg-page">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-accent transition-all mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>

          <div className="border-b-4 border-primary pb-4">
            <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase">
              Changelog
            </h1>
            <p className="font-mono text-sm surface-muted mt-2">
              Every update to LikasLens — documented.
            </p>
          </div>
        </div>

        {/* Versions */}
        <div className="space-y-12">
          {versions.map((version) => (
            <section key={version.version} className="relative">
              {/* Version Header */}
              <div className="flex items-baseline gap-4 mb-6">
                <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase">
                  v{version.version}
                </h2>
                <span className="font-mono text-xs text-ink/40 tracking-wider">
                  {version.date}
                </span>
              </div>

              {/* Sections */}
              <div className="space-y-6">
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

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-ink/10 text-center">
          <a
            href="https://github.com/J-Akiru5/LikasLens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-accent transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
