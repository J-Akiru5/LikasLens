"use client";

import { useState, useEffect } from "react";
import { ToastProvider, LiksiChat } from "@likaslens/shared";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="flex-1">{children}</div>
      {mounted && isAuthenticated && (
        <LiksiChat persona="admin" locale={locale} isAuthenticated={true} />
      )}
      <ToastProvider />
    </>
  );
}
