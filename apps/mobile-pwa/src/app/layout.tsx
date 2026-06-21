import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { locales, type Locale } from "@likaslens/shared";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LikasLens",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B4332",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: Locale }>;
}) {
  const resolvedParams = await params;

  return (
    <html
      lang={resolvedParams?.locale === "ta" ? "ta" : resolvedParams?.locale || "en"}
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
      <body className="min-h-full flex flex-col bg-page">
        {children}
      </body>
    </html>
  );
}
