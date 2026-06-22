"use client";

import { useState, useEffect } from "react";
import { ToastContainer } from "@likaslens/shared";
import { LiksiChat } from "@likaslens/shared";

interface LocaleLayoutClientProps {
  children: React.ReactNode;
  locale: string;
}

export function LocaleLayoutClient({
  children,
  locale,
}: LocaleLayoutClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="flex-1">{children}</div>
      {mounted && (
        <LiksiChat
          persona="admin"
          locale={locale}
          isAuthenticated={true}
        />
      )}
      <ToastContainer />
    </>
  );
}
