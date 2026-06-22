"use client";

import dynamic from "next/dynamic";
import { OfflineBanner, ToastProvider } from "@likaslens/shared";

const LiksiChat = dynamic(
  () => import("@likaslens/shared").then((m) => m.LiksiChat),
  { ssr: false }
);

interface LocaleLayoutClientProps {
  children: React.ReactNode;
  locale: string;
  isAuthenticated: boolean;
}

export function LocaleLayoutClient({
  children,
  locale,
  isAuthenticated,
}: LocaleLayoutClientProps) {
  return (
    <>
      <OfflineBanner />
      <div className="flex-1">{children}</div>
      <LiksiChat persona="citizen" locale={locale} isAuthenticated={isAuthenticated} />
      <ToastProvider />
    </>
  );
}
