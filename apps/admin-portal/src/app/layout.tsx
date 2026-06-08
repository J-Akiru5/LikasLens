import type { Metadata } from "next";
import "./globals.css";
import { LikasyChat, ToastContainer } from "@likaslens/shared";
import { locales, type Locale } from "@likaslens/shared";

export const metadata: Metadata = {
  title: "LikasLens Admin",
  description: "Admin portal for LikasLens civic reporting platform",
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
    <html lang={resolvedParams?.locale === "ta" ? "ta" : (resolvedParams?.locale || "en")} className="h-full antialiased" data-theme="civic">
      <body className="min-h-full bg-background font-body flex flex-col">
        <div className="flex-1">
          <ToastContainer />
          {children}
        </div>
        <LikasyChat persona="admin" locale={resolvedParams.locale} />
      </body>
    </html>
  );
}
