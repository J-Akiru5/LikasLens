"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { useState, useEffect } from "react";

const LiksiChatBase = dynamic(
  () => import("@likaslens/shared").then((m) => m.LiksiChat),
  { ssr: false }
);

interface LiksiChatClientProps extends Omit<ComponentProps<typeof LiksiChatBase>, "ref"> {
  persona?: "citizen" | "admin";
  locale?: string;
  isAuthenticated?: boolean;
  className?: string;
}

export function LiksiChatClient(props: LiksiChatClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <LiksiChatBase {...props} />;
}
