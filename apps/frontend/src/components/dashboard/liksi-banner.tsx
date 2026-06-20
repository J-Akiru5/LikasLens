"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface LiksiBannerProps {
  userName: string;
}

export function LiksiBanner({ userName }: LiksiBannerProps) {
  const chatMessages = [
    "Welcome back! I'm Liksi, your AI assistant. 🌿",
    "Ready to make an impact today? Every report counts! 🌍",
    "See something wrong? Tap the Report tab below! ⚡",
    "I'll route your reports to the right agency! 🤖",
  ];
  const [chatIndex, setChatIndex] = useState(0);

  const [timeState, setTimeState] = useState({ greeting: "Welcome,", dateStr: "" });
  
  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();
    setTimeState({
      greeting: hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,",
      dateStr: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()
    });
  }, []);

  return (
    <div className="mb-14 mt-24 sm:mt-36 px-4 sm:px-0 w-full">
      <div className="relative w-full">
        
        {/* Greeting positioned above the banner, shifted right to avoid the mascot */}
        <div className="absolute bottom-[100%] mb-4 left-[140px] sm:left-[240px] z-40">
          <p className="text-[10px] sm:text-xs font-bold text-ink/40 tracking-widest uppercase mb-1 min-h-[15px]">
            {timeState.dateStr}
          </p>
          <h1 className="text-xl sm:text-[32px] font-medium tracking-tight text-ink m-0" style={{ letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            {timeState.greeting} <strong className="font-bold">{userName}!</strong>
          </h1>
        </div>

        {/* Theme-aware Banner */}
        <div 
          className="rounded-[24px] shadow-sm w-full min-h-[130px] flex items-center pl-[150px] sm:pl-[240px] pr-4 sm:pr-8 py-6 relative z-10 transition-colors duration-500"
          style={{ background: "var(--accent)" }}
        >
          
          {/* Chat Bubble Area */}
          <div 
            className="relative max-w-2xl p-4 sm:p-5 cursor-pointer transition-transform active:scale-[0.99] shadow-sm z-20"
            style={{ borderRadius: "24px", background: "var(--page)" }}
            onClick={(e) => {
              e.preventDefault();
              setChatIndex((prev) => (prev + 1) % chatMessages.length);
            }}
          >
            {/* Clean SVG Tail pointing left from the vertical center */}
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 -translate-y-1/2 -left-[10px] z-10">
              <path d="M12 0L0 8L12 16V0Z" fill="var(--page)" />
            </svg>

            <h3 
              className="text-[12px] sm:text-[13px] font-bold uppercase tracking-wider mb-1 m-0 pl-1"
              style={{ color: "var(--accent)" }}
            >
              Liksi
            </h3>
            <p className="text-[13px] sm:text-[15px] font-medium text-ink m-0 leading-snug pl-1">
              {chatMessages[chatIndex]}
            </p>
          </div>
        </div>

        {/* Mascot anchored to bottom-left, popping out of the banner massively */}
        <div 
          className="absolute bottom-0 -left-6 sm:bottom-0 sm:-left-6 w-[200px] h-[240px] sm:w-[260px] sm:h-[300px] flex-shrink-0 cursor-pointer transition-transform active:scale-95 origin-bottom drop-shadow-md z-20 pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            setChatIndex((prev) => (prev + 1) % chatMessages.length);
          }}
        >
          <Image 
            src="/images/liksi-welcom.gif" 
            alt="Liksi Mascot" 
            fill 
            className="object-contain object-bottom scale-[1.65] sm:scale-[1.65] origin-bottom"
            priority={true}
            unoptimized
          />
        </div>

      </div>
    </div>
  );
}
