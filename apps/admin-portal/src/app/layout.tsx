import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "LikasLens Admin",
  description: "Admin portal for LikasLens civic reporting platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">
        <Sidebar />
        <main className="lg:pl-64 min-h-screen p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}
