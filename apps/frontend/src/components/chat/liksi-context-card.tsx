"use client";

import { Leaf, MessageCircle } from "lucide-react";
import { cn } from "@likaslens/shared";

interface LiksiContextCardProps {
  page: "report" | "dashboard" | "public-record";
  className?: string;
  onOpenChat?: () => void;
}

const PAGE_CONTENT: Record<
  LiksiContextCardProps["page"],
  { tip: string; stats?: string; icon?: string }
> = {
  report: {
    tip: "You can report: Illegal dumping, Water pollution, Air pollution, Deforestation, Wildlife threats",
    stats: undefined,
    icon: "📸",
  },
  dashboard: {
    tip: "Check your submitted reports and track their status. Need help? Ask Liksi anything about environmental reporting.",
    stats: undefined,
    icon: "📊",
  },
  "public-record": {
    tip: "Browse verified environmental incidents in your community. Every report is reviewed by government officers.",
    stats: undefined,
    icon: "🌍",
  },
};

export function LiksiContextCard({
  page,
  className,
  onOpenChat,
}: LiksiContextCardProps) {
  const content = PAGE_CONTENT[page];

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-green/15 overflow-hidden transition-all",
        "hover:border-green/25 hover:shadow-sm",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(34,214,114,0.04) 0%, rgba(34,214,114,0.01) 100%)",
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(34,214,114,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative p-4 flex items-start gap-3">
        {/* Liksi icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(34,214,114,0.1)",
            border: "1px solid rgba(34,214,114,0.2)",
          }}
        >
          <Leaf className="w-5 h-5 text-green" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-green uppercase tracking-wider">
              Liksi suggests
            </span>
            <span className="text-sm">{content.icon}</span>
          </div>
          <p className="text-xs text-ink/60 leading-relaxed">
            {content.tip}
          </p>
          {content.stats && (
            <p className="text-xs font-mono font-bold text-green mt-1">
              {content.stats}
            </p>
          )}
        </div>

        {/* Chat button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-green bg-green/10 border border-green/20 hover:bg-green/15 transition-colors flex-shrink-0"
          >
            <MessageCircle className="w-3 h-3" />
            Ask
          </button>
        )}
      </div>
    </div>
  );
}
