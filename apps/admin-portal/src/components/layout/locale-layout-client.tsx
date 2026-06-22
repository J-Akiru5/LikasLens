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
}

export function LocaleLayoutClient({
  children,
  locale,
}: LocaleLayoutClientProps) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <LiksiChat persona="admin" locale={locale} isAuthenticated={true} />
      <ToastProvider />
    </>
  );
}
