"use client";

import dynamic from "next/dynamic";
import { ToastProvider } from "@likaslens/shared";

const LiksiChat = dynamic(
  () => import("@likaslens/shared").then((m) => m.LiksiChat),
  { ssr: false }
);

interface LocaleLayoutClientProps {
  children: React.ReactNode;
  locale: string;
  isAuthenticated?: boolean;
}

export function LocaleLayoutClient({
  children,
  locale,
  isAuthenticated = false,
}: LocaleLayoutClientProps) {
  return (
    <>
      <div className="flex-1">{children}</div>
      {isAuthenticated && (
        <LiksiChat persona="admin" locale={locale} isAuthenticated={true} />
      )}
      <ToastProvider />
    </>
  );
}
