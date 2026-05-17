import type { Metadata } from "next";
import "./globals.css";
import { LikasyChat } from "@likaslens/shared";
import { locales, type Locale } from "@likaslens/shared";

export const metadata: Metadata = {
  title: "LikasLens Admin",
  description: "Admin portal for LikasLens civic reporting platform",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  return (
    <html lang={params.locale === "ta" ? "ta" : params.locale} className="h-full antialiased" data-theme="civic">
      <body className="min-h-full bg-background font-body flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <LikasyChat persona="admin" locale={params.locale} />
      </body>
    </html>
  );
}
