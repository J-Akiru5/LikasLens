"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-white">
      <WifiOff className="w-4 h-4" />
      <span>You are offline. Reports will be queued until connection is restored.</span>
    </div>
  );
}
