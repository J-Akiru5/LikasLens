"use client";

import { createContext, useContext, useCallback, useRef, type ReactNode } from "react";

interface PullToRefreshContextValue {
  setRefresh: (fn: (() => Promise<void>) | null) => void;
}

const PullToRefreshContext = createContext<PullToRefreshContextValue | null>(null);

export function PullToRefreshProvider({ children }: { children: ReactNode }) {
  const ref = useRef<(() => Promise<void>) | null>(null);

  const setRefresh = useCallback((fn: (() => Promise<void>) | null) => {
    ref.current = fn;
    (globalThis as any).__likaslens_refresh = fn;
  }, []);

  return (
    <PullToRefreshContext.Provider value={{ setRefresh }}>
      {children}
    </PullToRefreshContext.Provider>
  );
}

export function usePullToRefresh(refreshFn: () => Promise<void> | void) {
  const ctx = useContext(PullToRefreshContext);
  if (!ctx) return;

  ctx.setRefresh(async () => {
    await refreshFn();
  });
}

export function usePullToRefreshFn() {
  return (globalThis as any).__likaslens_refresh ?? null;
}
