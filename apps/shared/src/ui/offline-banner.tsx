"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-[#081c15] px-4 py-2 flex items-center justify-center gap-2 font-mono text-sm font-bold shadow-[0_4px_12px_rgba(255,183,3,0.4)]">
      <WifiOff className="w-4 h-4" />
      <span>You are offline. Reports will be queued until connection is restored.</span>
    </div>
  );
}
