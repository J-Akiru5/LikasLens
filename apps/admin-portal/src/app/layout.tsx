import type { Metadata } from "next";
import "./globals.css";
import { LikasyChat, OfflineBanner } from "@likaslens/shared";

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
    <html lang="en" className="h-full antialiased" data-theme="civic">
      <body className="min-h-full bg-background font-body flex flex-col">
        <OfflineBanner />
        <div className="flex-1">
          {children}
        </div>
        <LikasyChat 
          systemPrompt="You are Likasy, an AI assistant for analysts on the LikasLens admin portal. Your role is to help analysts understand how to process reports, verify evidence using the AI tools, manage NGO partnerships, and maintain public records. Be professional, concise, and helpful." 
          welcomeMessage="Hello, Analyst! I'm Likasy. Need help processing a report or navigating the admin portal?"
        />
      </body>
    </html>
  );
}
