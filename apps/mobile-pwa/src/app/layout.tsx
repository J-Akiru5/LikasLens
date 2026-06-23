import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Public_Sans,
  JetBrains_Mono,
} from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import "./globals.css";

// Distinctive display face for large titles — characterful grotesque, not a
// 2026 reflex font. Gives the app its editorial-native identity.
const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Warm humanist sans, designed for civic / government readability. Replaces
// the Geist reflex font. Carries body + labels.
const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Kept data face. Reserved STRICTLY for real numbers (eco-credits, counts,
// timestamps). Never for decorative labels.
const dataFont = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "LikasLens",
  description: "Report environmental issues. AI-powered civic reporting.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "LikasLens",
    title: "LikasLens — Protecting Nature Philippines",
    description:
      "AI-powered civic reporting platform protecting Philippine nature. Report environmental issues, track community impact, and hold agencies accountable.",
    images: [
      {
        url: "/twitter-image.jpg",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LikasLens",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b4332",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

import { AppleSplashScreens } from "@/components/apple-splash-screens";
import { SplashScreen } from "@/components/splash-screen";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${bodyFont.variable} ${dataFont.variable} h-full antialiased`}
      data-theme="civic"
      suppressHydrationWarning
    >
      <head>
        <AppleSplashScreens />
        <Script id="theme-initializer" strategy="beforeInteractive">
          {`try {
            var savedTheme = localStorage.getItem('likaslens-theme');
            if (savedTheme === 'ghost') {
              document.documentElement.setAttribute('data-theme', 'ghost');
            }
          } catch (e) {}`}
        </Script>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-page">
        <SplashScreen />
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
