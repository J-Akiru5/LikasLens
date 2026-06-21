"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    
    // Auto-dismiss after 2.5 seconds (matches the redirect timer in root page)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-page overflow-hidden"
        >
      {/* High-tech radial background */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(45, 225, 194, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 60%, rgba(27, 67, 50, 0.05) 0%, transparent 60%)",
          }}
        />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(27, 67, 50, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(27, 67, 50, 0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative flex flex-col items-center gap-8 z-10 w-full max-w-sm px-8">
        
        {/* TOP: Logo + Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Logo container with controlled size */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Subtle glow instead of giant orb */}
            <div className="absolute inset-0 bg-accent/5 rounded-full blur-xl animate-pulse" />
            <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-20 h-20 object-contain drop-shadow-md relative z-10" />
          </div>

          {/* Brand Name */}
          <motion.h1
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="tracking-[0.25em] flex items-center justify-center uppercase text-accent drop-shadow-sm"
            style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800 }}
          >
            LIK<span className="font-bold mx-[2px] text-[#2ee6c8]">Λ</span>S LENS
          </motion.h1>
        </motion.div>

        {/* MIDDLE: Horizontal Tagline (Wraps on very small screens) */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-8 max-w-[280px]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            className="text-accent/80 font-bold tracking-[0.15em] text-[12px] uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Capture.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
            className="text-accent/80 font-bold tracking-[0.15em] text-[12px] uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Protect.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 1.1 }}
            className="text-accent/80 font-bold tracking-[0.15em] text-[12px] uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Resolve.
          </motion.div>
        </div>

        {/* BOTTOM: Loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-6 flex items-center gap-1.5 justify-center"
        >
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0 }} 
            className="w-1.5 h-1.5 rounded-full bg-accent/60" 
          />
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} 
            className="w-1.5 h-1.5 rounded-full bg-accent/60" 
          />
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} 
            className="w-1.5 h-1.5 rounded-full bg-accent/60" 
          />
        </motion.div>
      </div>

      {/* Industry Standard "From [Team]" Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-center gap-1"
      >
        <span className="text-[10px] text-accent/40 font-medium tracking-widest uppercase">
          By
        </span>
        <span className="text-xs font-bold tracking-[0.2em] text-accent uppercase" style={{ fontFamily: "var(--font-heading)" }}>
          Syntaxure SEA
        </span>
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
