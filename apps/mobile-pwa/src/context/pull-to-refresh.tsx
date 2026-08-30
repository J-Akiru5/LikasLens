"use client";

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react";

interface PullToRefreshContextValue {
  refreshFn: (() => Promise<void>) | null;
  setRefresh: (fn: (() => Promise<void>) | null) => void;
}

const PullToRefreshContext = createContext<PullToRefreshContextValue | null>(null);

export function PullToRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null);

  const setRefresh = useCallback((fn: (() => Promise<void>) | null) => {
    setRefreshFn(() => fn);
  }, []);

  return (
    <PullToRefreshContext.Provider value={{ refreshFn, setRefresh }}>
      {children}
    </PullToRefreshContext.Provider>
  );
}

export function usePullToRefresh(refreshFn: () => Promise<void> | void) {
  const ctx = useContext(PullToRefreshContext);
  const setRefresh = ctx?.setRefresh;

  useEffect(() => {
    if (!setRefresh) return;
    setRefresh(async () => {
      await refreshFn();
    });
    return () => {
      setRefresh(null);
    };
  }, [setRefresh, refreshFn]);
}

export function usePullToRefreshFn() {
  const ctx = useContext(PullToRefreshContext);
  return ctx?.refreshFn ?? null;
}
