# SEO Audit & Optimization Plan — LikasLens Frontend (v2)

**Date:** June 20, 2026
**Target URL:** `https://likaslens.syntaxure.dev/`
**Target Keywords:** "Protecting nature Philippines" (EN), localized equivalents per locale
**Scope:** `apps/frontend` only (Next.js App Router)

---

## 1. Current State Assessment

### What Exists

| Item | Status | Details |
|------|--------|---------|
| Root `layout.tsx` metadata | Bare-bones | `title: "LikasLens"`, `description: "Neuro-symbolic civic reporting platform"` |
| OG/Twitter image files | Present | `src/app/opengraph-image.jpg`, `src/app/twitter-image.jpg` (auto-detected by Next.js) |
| PWA manifest | Present | `public/manifest.json` with app name, icons, theme color |
| `opengraph-image.jpg` | Present | Dark cyberpunk banner: "LIKASLENS — From snapshot to solution" |
| `twitter-image.jpg` | Present | Same image as OG |
| `icon.png` | Present | `src/app/icon.png` (favicon) |
| i18n routing | Working | 6 locales: `en`, `fil`, `vi`, `id`, `ms`, `ta` with `next-intl` |
| `changelog/page.tsx` | Has metadata | Only page with its own `title`/`description` export (hardcoded English) |

### What Is Missing

| # | Missing Item | Impact |
|---|-------------|--------|
| 1 | `robots.ts` | No crawler directives — search engines index everything including auth-gated pages |
| 2 | `sitemap.ts` | No XML sitemap — Google can't discover all routes efficiently |
| 3 | `NEXT_PUBLIC_SITE_URL` env var | No canonical URL base defined |
| 4 | OpenGraph metadata config | OG image files exist but aren't referenced in metadata exports |
| 5 | Twitter Card metadata config | Same — files exist, no config |
| 6 | `alternates` / canonical URLs | No canonical URL or hreflang tags for i18n |
| 7 | Per-page localized `generateMetadata` | 22/23 pages rely on generic root metadata; no locale-aware metadata exists |
| 8 | JSON-LD structured data | Zero schema.org markup — no rich results in Google |
| 9 | Security headers in `next.config.ts` | No `X-Frame-Options`, `X-Content-Type-Options`, etc. |
| 10 | `robots` property in metadata | No `index`/`follow` directives |

---

## 2. Bugs in v1 Plan (Fixed in This Version)

### Bug 1: Home Page Metadata on Client Component

**Problem:** v1 Change 6 said to add `generateMetadata` directly to `src/app/[locale]/page.tsx`. But Home is a Client Component (`"use client"` on line 1). Client Components cannot export `metadata` or `generateMetadata` — Next.js will throw a build error.

**Fix:** Extract Home's client content into `HomeClient.tsx`, make `page.tsx` a server component that exports `generateMetadata` and renders `<HomeClient />`.

### Bug 2: Canonical URL Points to Wrong Place

**Problem:** v1 hardcoded `alternates.canonical: "https://likaslens.syntaxure.dev"` with no locale segment. Every locale variant would inherit the bare-domain canonical, telling Google all six language versions are duplicates — actively suppressing five locales.

**Fix:** Root `layout.tsx` sets `metadataBase` only. Each page's `generateMetadata` computes its own per-locale canonical: `` `${baseUrl}/${locale}/${path}` ``.

### Bug 3: Metadata Not Localized

**Problem:** Every metadata string was hardcoded English. A user landing on `/fil/impact` or `/ta/report` from Google would see English title and description.

**Fix:** All per-page metadata uses `getTranslations({ locale, namespace })` from `next-intl/server`. New SEO-specific keys added under a `seo` namespace in the shared message files.

---

## 3. Additional Fixes from Review

### Fix 4: Login/Register Contradiction

**Problem:** v1 `robots.ts` disallowed `/login` and `/register`, yet gave them SEO titles/descriptions.

**Resolution:** Remove login/register from per-page metadata work. They stay allowed in robots (low SEO value, but blocking them prevents crawlers from discovering the sign-up flow). No metadata effort wasted on pages that won't rank.

### Fix 5: JSON-LD `applicationCategory` Invalid Property

**Problem:** `applicationCategory` belongs to `SoftwareApplication`, not `Organization`. Google's Rich Results Test ignores it silently.

**Fix:** Split into `Organization` + `WebApplication` (with `applicationCategory: "CivicEngagement"`) + `WebSite`.

### Fix 6: Missing `x-default` Hreflang

**Fix:** Added `x-default` pointing to `en` in both `sitemap.ts` and per-page `alternates.languages`.

### Fix 7: Security Headers Justification

**Problem:** v1 claimed "Security headers are a Google ranking signal." HTTPS is a confirmed minor signal; specific headers like `X-Frame-Options` are not.

**Fix:** Kept the headers (good security practice) but corrected the justification.

---

## 4. Keyword Strategy

### Primary Keyword: "Protecting nature Philippines"

This is a tagline-style phrase. People more commonly search:
- "Philippine environment protection"
- "report environmental violation Philippines"
- "deforestation Philippines" / "illegal dumping Philippines"
- "civic tech Philippines" / "environmental civic reporting"

**Strategy:** Primary keyword in title tag and homepage. Per-page metadata targets intent-driven queries (e.g., "Philippine environmental laws" for Laws page).

### Localized Keyword Strategy

| Locale | Strategy |
|--------|----------|
| `en` | "Protecting nature Philippines", "environmental reporting Philippines" |
| `fil` | Filipino environmental queries (e.g., "ulat sa kalikasan") |
| `vi` | Vietnamese environmental civic queries |
| `id` | Indonesian environmental reporting queries |
| `ms` | Malay environmental civic queries |
| `ta` | Tamil environmental civic queries |

---

## 5. Implementation Plan

### Change 1: Add `NEXT_PUBLIC_SITE_URL`

**Files:** `apps/frontend/.env.example`, `apps/frontend/.env`

```env
NEXT_PUBLIC_SITE_URL=https://likaslens.syntaxure.dev
```

### Change 2: Create `robots.ts`

**New file:** `apps/frontend/src/app/robots.ts`

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/profile", "/api", "/_next"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### Change 3: Create `sitemap.ts`

**New file:** `apps/frontend/src/app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@likaslens/shared";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

const publicPages = [
  { path: "", changefreq: "daily" as const, priority: 1.0 },
  { path: "impact", changefreq: "weekly" as const, priority: 0.9 },
  { path: "laws", changefreq: "weekly" as const, priority: 0.8 },
  { path: "scoreboard", changefreq: "daily" as const, priority: 0.8 },
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
```

### Change 4: Overhaul Root Metadata

**File:** `apps/frontend/src/app/layout.tsx`

Root layout sets `metadataBase`, title template, icons, manifest. NO `alternates.canonical` — that's per-page.

```ts
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev"
  ),
  title: {
    default: "LikasLens — Protecting Nature Philippines",
    template: "%s | LikasLens",
  },
  description:
    "AI-powered civic reporting platform protecting Philippine nature. Report environmental issues, track community impact, and hold agencies accountable.",
  keywords: [
    "protecting nature Philippines",
    "environmental reporting",
    "civic reporting Philippines",
    "AI environmental monitoring",
    "Philippine biodiversity",
    "citizen science Philippines",
    "nature conservation Philippines",
    "environmental accountability",
  ],
  authors: [{ name: "LikasLens" }],
  creator: "LikasLens",
  publisher: "LikasLens",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "LikasLens",
    title: "LikasLens — Protecting Nature Philippines",
    description:
      "AI-powered civic reporting platform protecting Philippine nature. Report environmental issues, track community impact, and hold agencies accountable.",
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "LikasLens — From snapshot to solution" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LikasLens — Protecting Nature Philippines",
    description:
      "AI-powered civic reporting platform protecting Philippine nature. Report environmental issues, track community impact.",
    images: ["/twitter-image.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LikasLens" },
};
```

### Change 5: JSON-LD Structured Data

**New file:** `apps/frontend/src/components/seo/JsonLd.tsx`

```tsx
export default function JsonLd({ locale }: { locale: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LikasLens",
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    description: "AI-powered civic reporting platform protecting Philippine nature.",
    sameAs: [],
    foundingDate: "2026",
  };

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LikasLens",
    url: `${baseUrl}/${locale}`,
    applicationCategory: "CivicEngagement",
    operatingSystem: "Web",
    description: "Report environmental issues with AI-powered analysis.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "PHP" },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LikasLens",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/en?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
```

### Change 6: Per-Page Localized Metadata via `generateMetadata`

**Pattern:** For client component pages, create `layout.tsx` in each page directory exporting `generateMetadata` using `getTranslations()`. Home page converts to server component wrapping `<HomeClient />`.

### Change 7: New Translation Keys (`seo` namespace)

Add `seo` namespace to all 6 locale message files with localized metadata strings.

### Change 8: Security Headers

**File:** `apps/frontend/next.config.ts` — add `headers()`.

---

## 6. Files Summary (24 files)

### New Files (11)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/robots.ts` | Crawler rules |
| 2 | `src/app/sitemap.ts` | Dynamic i18n-aware XML sitemap |
| 3 | `src/components/seo/JsonLd.tsx` | JSON-LD (Organization + WebApplication + WebSite) |
| 4 | `src/app/[locale]/HomeClient.tsx` | Home client content (extracted) |
| 5 | `src/app/[locale]/impact/layout.tsx` | Impact metadata |
| 6 | `src/app/[locale]/laws/layout.tsx` | Laws metadata |
| 7 | `src/app/[locale]/scoreboard/layout.tsx` | Scoreboard metadata |
| 8 | `src/app/[locale]/report/layout.tsx` | Report metadata |
| 9 | `src/app/[locale]/contact/layout.tsx` | Contact metadata |
| 10 | `src/app/[locale]/privacy/layout.tsx` | Privacy metadata |
| 11 | `src/app/[locale]/terms/layout.tsx` | Terms metadata |

### Modified Files (13)

| # | File | Change |
|---|------|--------|
| 12 | `.env.example` | Add `NEXT_PUBLIC_SITE_URL` |
| 13 | `.env` | Add `NEXT_PUBLIC_SITE_URL` |
| 14 | `src/app/layout.tsx` | Rich metadata (metadataBase, title template, OG, Twitter, robots) |
| 15 | `src/app/[locale]/layout.tsx` | Import `<JsonLd locale={locale} />` |
| 16 | `src/app/[locale]/page.tsx` | Convert to server component, wrap HomeClient, export generateMetadata |
| 17 | `src/app/[locale]/changelog/page.tsx` | Convert static metadata to generateMetadata |
| 18 | `next.config.ts` | Security headers |
| 19-24 | `apps/shared/src/i18n/messages/{en,fil,vi,id,ms,ta}.json` | Add `seo` namespace |

---

## 7. Verification Checklist

- [ ] `pnpm --filter frontend build` succeeds
- [ ] `pnpm --filter frontend lint` passes
- [ ] `/robots.txt` returns proper directives
- [ ] `/sitemap.xml` returns XML with all pages x 6 locales + x-default
- [ ] `/en` source has OG, Twitter, JSON-LD, canonical (`/en`), hreflang
- [ ] `/fil` source has Filipino title/description, canonical (`/fil`)
- [ ] Google Rich Results Test passes
- [ ] `/dashboard` returns noindex
- [ ] Lighthouse SEO audit targets 100/100

---

## 8. Core Web Vitals (Follow-Up)

17 of 23 routes are Client Components. Heavy use of `dynamic()` with `{ ssr: false }` hurts LCP.

**Follow-up:** Audit Home/Report performance, consider server-rendering hero, add lazy loading.

---

## 9. Google Search Console Registration

1. Add property: `https://likaslens.syntaxure.dev`
2. Verify via HTML tag or DNS
3. Submit sitemap: `https://likaslens.syntaxure.dev/sitemap.xml`
4. Request indexing for key pages
5. Monitor after 2-4 weeks
