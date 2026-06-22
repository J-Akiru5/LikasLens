"use client";

import { useState, useEffect } from "react";
import { OfflineBanner, ToastContainer } from "@likaslens/shared";
import { LiksiChat } from "@likaslens/shared";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <OfflineBanner />
      <div className="flex-1">{children}</div>
      {mounted && (
        <LiksiChat
          persona="citizen"
          locale={locale}
          isAuthenticated={isAuthenticated}
        />
      )}
      <ToastContainer />
    </>
  );
}
