import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Space_Mono } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { LikasyChat } from "@/components/chat/LikasyChat";

const headingFont = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dataFont = Space_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "LikasLens",
  description: "Neuro-symbolic civic reporting platform",
  manifest: "/manifest.json",
  themeColor: "#10b981",
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
  themeColor: "#1B4332",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${dataFont.variable} h-full antialiased`}
      data-theme="civic"
    >
      <body className="min-h-full flex flex-col">
        <OfflineBanner />
        {children}
        <LikasyChat />
      </body>
    </html>
  );
}
