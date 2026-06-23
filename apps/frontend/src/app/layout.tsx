import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Public_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { ThemeInitializer } from "@/components/theme-initializer";

// Distinctive display face — characterful grotesque, not a 2026 reflex font.
const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Warm humanist sans, designed for civic / government readability. Replaces the
// Inter reflex monoculture. Carries headings + body.
const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Already-committed data face. Reserved STRICTLY for real data (IDs, coords,
// timestamps, confidence %). Identity-preserving.
const dataFont = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "LikasLens — From snapshot to solution",
      },
    ],
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

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LikasLens",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b4332",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${bodyFont.variable} ${dataFont.variable} h-full antialiased`}
      data-theme="civic"
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ThemeInitializer />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
