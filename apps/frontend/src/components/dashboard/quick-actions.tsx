"use client";

import { Camera, MapPin, Share2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { icon: Camera, label: "New Report", desc: "Submit evidential data" },
  { icon: MapPin, label: "Geo-Tag", desc: "Mark hazard location" },
  { icon: Share2, label: "Broadcast", desc: "Alert local agencies" },
  { icon: ShieldAlert, label: "Ghost Mode", desc: "Anonymous submission" },
];

export function QuickActions() {
  return (
    <div className="brutal-panel bg-white p-6 h-full">
      <h2 className="font-heading text-xl font-black uppercase mb-6 border-b-2 border-primary/20 pb-2">Directives</h2>

      <motion.div 
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button 
              key={idx} 
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
              className="w-full flex items-center gap-4 p-4 border-2 border-primary hover:bg-primary hover:text-white transition-all group rounded text-left shadow-[2px_2px_0px_#1b4332] active:translate-y-[2px] active:shadow-none"
            >
              <div className="p-2 border-2 border-primary bg-background group-hover:border-white group-hover:text-primary transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono font-bold uppercase">{action.label}</div>
                <div className="text-xs opacity-70 font-mono mt-1">{action.desc}</div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      <div className="mt-8 p-4 bg-background border-2 border-primary font-mono text-xs text-primary">
        <strong>SYS_MSG:</strong> AI categorization module online. Processing capacity nominal.
      </div>
    </div>
  );
}
