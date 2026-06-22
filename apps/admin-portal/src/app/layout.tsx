import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import "./globals.css";

const bodyFont = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

const dataFont = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://admin.likaslens.syntaxure.dev"
  ),
  title: "LikasLens Admin",
  description: "Admin portal for LikasLens civic reporting platform",
  openGraph: {
    type: "website",
    siteName: "LikasLens Admin",
    title: "LikasLens Admin — Protecting Nature Philippines",
    description:
      "Admin portal for LikasLens AI-powered civic reporting platform.",
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
    title: "LikasLens Admin",
    description: "Admin portal for LikasLens civic reporting platform.",
    images: ["/twitter-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B4332",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${bodyFont.variable} ${dataFont.variable} h-full antialiased`}
      data-theme="civic"
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {`try {
            var theme = localStorage.getItem('likaslens-theme');
            if (theme === 'ghost') {
              document.documentElement.setAttribute('data-theme', 'ghost');
            }
          } catch (e) {}`}
        </Script>
      </head>
      <body className="min-h-full bg-page font-body flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <div id="main-content" className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
