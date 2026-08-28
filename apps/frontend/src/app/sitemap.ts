import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@likaslens/shared";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

const publicPages = [
  { path: "", changefreq: "daily" as const, priority: 1.0 },
  { path: "impact", changefreq: "weekly" as const, priority: 0.9 },
  { path: "laws", changefreq: "weekly" as const, priority: 0.8 },
  { path: "report", changefreq: "monthly" as const, priority: 0.9 },
  { path: "contact", changefreq: "monthly" as const, priority: 0.5 },
  { path: "changelog", changefreq: "weekly" as const, priority: 0.6 },
  { path: "privacy", changefreq: "yearly" as const, priority: 0.3 },
  { path: "terms", changefreq: "yearly" as const, priority: 0.3 },
  { path: "login", changefreq: "monthly" as const, priority: 0.4 },
  { path: "register", changefreq: "monthly" as const, priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of publicPages) {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = `${baseUrl}/${locale}/${page.path}`;
    }
    languages["x-default"] = `${baseUrl}/${defaultLocale}/${page.path}`;

    entries.push({
      url: `${baseUrl}/en/${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changefreq,
      priority: page.priority,
      alternates: { languages },
    });
  }

  return entries;
}
