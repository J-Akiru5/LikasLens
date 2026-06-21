"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OnlineStatusBar() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [show, setShow] = useState(false);

  useEffect(() => {
    const goOffline = () => { setIsOnline(false); setShow(true); };
    const goOnline = () => { setIsOnline(true); setTimeout(() => setShow(false), 3000); };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!show || isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-accent px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium text-white shadow-lg">
      <WifiOff className="w-4 h-4" />
      You are offline. Reports will queue and sync when connection returns.
    </div>
  );
}
