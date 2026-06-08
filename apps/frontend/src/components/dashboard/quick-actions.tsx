"use client";

import { Camera, MapPin, ShareNetwork, ShieldWarning } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const actions = [
  { icon: Camera, label: "New Report", desc: "Submit evidential data", color: "border-accent" },
  { icon: MapPin, label: "Geo-Tag", desc: "Mark hazard location", color: "border-secondary" },
  { icon: ShareNetwork, label: "Broadcast", desc: "Alert local agencies", color: "border-accent" },
  { icon: ShieldWarning, label: "Ghost Mode", desc: "Anonymous submission", color: "border-accent" },
];

export function QuickActions() {
  return (
    <div className="panel p-6 h-full">
      <h2 className="font-semibold tracking-tight text-xl mb-6 border-b border-border pb-2">
        Directives
      </h2>

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
              className={`w-full flex items-center gap-4 p-4 border ${action.color} hover:bg-accent/10 transition-all group rounded-lg text-left`}
            >
              <div className={`p-2 border-2 ${action.color} bg-background group-hover:bg-accent/20 transition-colors`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono font-bold uppercase tracking-widest">{action.label}</div>
                <div className="text-xs opacity-70 font-mono mt-1">{action.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="mt-8 p-4 panel font-mono text-xs tracking-widest">
        <strong>SYS_MSG:</strong> AI categorization module online. Processing capacity nominal.
      </div>
    </div>
  );
}
