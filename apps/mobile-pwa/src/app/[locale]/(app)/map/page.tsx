"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { EnhancedMap } from "@/components/map/enhanced-map";

export default function MapPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
        <h1 className="ios-large-title ios-large-title--xl">Map</h1>
      </header>

      <div className="p-4">
        {loaded ? (
          <EnhancedMap height="calc(100vh - 270px)" />
        ) : (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green" />
          </div>
        )}
      </div>
    </div>
  );
}
