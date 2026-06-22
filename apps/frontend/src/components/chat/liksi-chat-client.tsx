"use client";

import type { ComponentProps } from "react";
import { useState, useEffect } from "react";
import { LiksiChat } from "@likaslens/shared";

type LiksiChatClientProps = ComponentProps<typeof LiksiChat>;

export function LiksiChatClient(props: LiksiChatClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <LiksiChat {...props} />;
}
