"use client";

import { Leaf } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-page">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(45, 225, 194, 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 70% 80%, rgba(27, 67, 50, 0.05) 0%, transparent 55%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/5 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shadow-[4px_4px_0px_#081c15]">
            <img src="/icons/icon-192x192.png" alt="LikasLens Logo" className="w-14 h-14 object-contain" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-accent uppercase">
            LIKASLENS
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent/40 mt-2 font-mono">
            Civic Environmental Intelligence
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
