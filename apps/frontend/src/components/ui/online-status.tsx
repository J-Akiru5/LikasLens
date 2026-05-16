"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export function OnlineStatusBar() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
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

  return (
    <AnimatePresence>
      {show && !isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-accent text-[#081C15] font-bold font-mono text-sm py-3 px-4 flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          You are offline. Reports will queue and sync when connection returns.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
