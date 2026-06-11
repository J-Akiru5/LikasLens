import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import { LikasyChat } from "@likaslens/shared";
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
  title: "LikasLens Admin",
  description: "Admin portal for LikasLens civic reporting platform",
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
        <div className="flex-1">
          {children}
        </div>
        <LikasyChat persona="admin" locale={locale} />
      </body>
    </html>
  );
}
