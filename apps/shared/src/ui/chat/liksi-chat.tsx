"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, Scale, Camera, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useGeminiChat, type ChatMessage } from "../../hooks/useGeminiChat";
import { cn } from "../../utils";

function getThinkingSteps(query: string, locale: string = "en"): string[] {
  const q = query.toLowerCase().trim();
  const isFil = locale === "fil" || /^(ano|paano|saan|bakit|sino|kumusta|magandang|paki|tulungan)/.test(q);

  // 1. Legal / Statute / Penalty queries
  if (
    q.includes("law") ||
    q.includes("batas") ||
    q.includes("ra ") ||
    q.includes("ra9") ||
    q.includes("ra8") ||
    q.includes("pd ") ||
    q.includes("penalty") ||
    q.includes("multa") ||
    q.includes("kulong") ||
    q.includes("fine") ||
    q.includes("legal") ||
    q.includes("denr") ||
    q.includes("emb") ||
    q.includes("cenro") ||
    q.includes("lgu") ||
    q.includes("statute") ||
    q.includes("violation") ||
    q.includes("paglabag")
  ) {
    if (isFil) {
      return [
        "Sinusuri ang mga kaugnay na batas sa kalikasan...",
        "Tinitingnan ang hurisdiksyon ng DENR at LGU...",
        "Inihahanda ang wastong gabay ayon sa batas...",
      ];
    }
    return [
      "Reviewing relevant environmental statutes...",
      "Checking DENR and LGU jurisdictional mandates...",
      "Synthesizing statutory guidance...",
    ];
  }

  // 2. Incident reporting / How to report / Upload photo / Ghost Mode
  if (
    q.includes("report") ||
    q.includes("ulat") ||
    q.includes("sumbong") ||
    q.includes("photo") ||
    q.includes("larawan") ||
    q.includes("camera") ||
    q.includes("ghost") ||
    q.includes("anonymous") ||
    q.includes("submit") ||
    q.includes("paano") ||
    q.includes("how to") ||
    q.includes("gps") ||
    q.includes("location")
  ) {
    if (isFil) {
      return [
        "Inihahanda ang gabay sa pag-uulat...",
        "Sinusuri ang mga hakbang sa LikasLens...",
        "Binubuo ang maayos na paliwanag...",
      ];
    }
    return [
      "Preparing reporting workflow guidance...",
      "Checking LikasLens submission steps...",
      "Formulating helpful instructions...",
    ];
  }

  // 3. Environmental issues (pollution, waste, smoke, mining, flood, etc.)
  if (
    q.includes("basura") ||
    q.includes("waste") ||
    q.includes("plastic") ||
    q.includes("usok") ||
    q.includes("smoke") ||
    q.includes("hangin") ||
    q.includes("air") ||
    q.includes("tubig") ||
    q.includes("water") ||
    q.includes("ilog") ||
    q.includes("river") ||
    q.includes("dagat") ||
    q.includes("ocean") ||
    q.includes("puno") ||
    q.includes("tree") ||
    q.includes("logging") ||
    q.includes("quarry") ||
    q.includes("mining") ||
    q.includes("mina")
  ) {
    if (isFil) {
      return [
        "Sinusuri ang isyung pangkalikasan...",
        "Tinitingnan ang mga pamantayan sa proteksyon...",
        "Inihahanda ang rekomendasyon para sa inyo...",
      ];
    }
    return [
      "Analyzing environmental context...",
      "Checking environmental protection guidelines...",
      "Drafting practical recommendations...",
    ];
  }

  // 4. Default / General / Greetings / Casual chat
  if (isFil) {
    return [
      "Pinoproseso ang inyong mensahe...",
      "Inihahanda ang sagot para sa inyo...",
    ];
  }
  return [
    "Thinking and preparing a response...",
    "Drafting a helpful reply...",
  ];
}

export function LiksiChat({
  persona = "citizen",
  locale = "en",
  isAuthenticated = true,
  className,
}: {
  persona?: "citizen" | "admin";
  locale?: string;
  isAuthenticated?: boolean;
  className?: string;
}) {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { messages, loading, sendMessage, addAssistantMessage } = useGeminiChat(persona, locale);
  const [input, setInput] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const activeThinkingSteps = useMemo(() => {
    return getThinkingSteps(lastQuery, locale);
  }, [lastQuery, locale]);

  // Rotate thinking steps when loading
  useEffect(() => {
    if (!loading) {
      setThinkingIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % activeThinkingSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading, activeThinkingSteps.length]);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      }
      if (bottomAnchorRef.current) {
        bottomAnchorRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      }
    });
  }, []);

  // Listen for global custom event to open Liksi and send/prime a prompt or insert an instant message
  useEffect(() => {
    const handleOpenLiksi = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string; instantMessage?: string }>;
      setOpen(true);
      if (customEvent.detail?.instantMessage) {
        addAssistantMessage(customEvent.detail.instantMessage);
        setTimeout(() => scrollToBottom(true), 50);
      } else if (customEvent.detail?.prompt) {
        setLastQuery(customEvent.detail.prompt);
        sendMessage(customEvent.detail.prompt);
        setTimeout(() => scrollToBottom(true), 50);
      }
    };
    window.addEventListener("open-liksi-chat", handleOpenLiksi as EventListener);
    return () => window.removeEventListener("open-liksi-chat", handleOpenLiksi as EventListener);
  }, [sendMessage, addAssistantMessage, scrollToBottom]);

  useEffect(() => {
    if (open) {
      scrollToBottom(false);
      const timer = setTimeout(() => scrollToBottom(true), 60);
      return () => clearTimeout(timer);
    }
  }, [messages.length, open, loading, scrollToBottom]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLastQuery(text);
    sendMessage(text);
    scrollToBottom(false);
    setTimeout(() => scrollToBottom(true), 40);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (
    pathname &&
    (pathname.includes("/login") || pathname.includes("/register") || pathname.includes("/auth"))
  ) {
    return null;
  }

  const localePrefix = pathname ? `/${pathname.split("/")[1] || "en"}` : "/en";

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "group fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 cursor-pointer",
            className
          )}
          aria-label={t("openChat")}
        >
          {/* Outer glowing ripple */}
          <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping [animation-duration:3s]" />

          {/* Inner pulsating glow */}
          <div className="absolute -inset-1 rounded-full bg-accent/20 animate-pulse [animation-duration:2s]" />

          {/* Floating Logo Avatar without background circle */}
          <img
            src="/images/liksi-logo.webp"
            alt="Liksi Chat"
            className="w-full h-full object-contain drop-shadow-xl animate-float relative z-10 transition-transform duration-300 group-hover:scale-110 active:scale-95"
          />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[30rem] max-h-[75vh] flex flex-col rounded-2xl border border-ink/10 bg-panel shadow-2xl overflow-hidden backdrop-blur-md",
              className
            )}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 py-3 shrink-0 bg-accent text-white shadow-xs"
            >
              <div className="flex items-center justify-center w-8 h-8 shrink-0 drop-shadow-sm">
                <img src="/images/liksi-logo.webp" alt="Liksi" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold tracking-tight leading-none mb-0.5">{t("title")}</div>
                <div className="text-[11px] font-mono opacity-90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Statutory Legal AI &bull; {t("online")}</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/15 transition-colors cursor-pointer text-white/80 hover:text-white"
                aria-label={t("closeChat")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Container */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-page/70 relative">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-1">
                    <Scale className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <p className="text-xs text-ink/60 font-medium max-w-xs">{t("subtitle")}</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isLatest={idx === messages.length - 1}
                  localePrefix={localePrefix}
                  onScrollNeeded={() => {
                    scrollToBottom(true);
                  }}
                />
              ))}

              {/* Multi-Step 2026 Smart Thinking Indicator */}
              {loading && (
                <div className="flex items-start gap-2.5 animate-fade-in">
                  <div className="flex items-center justify-center w-7 h-7 shrink-0 mt-1 drop-shadow-sm">
                    <img src="/images/liksi-logo.webp" alt="Liksi" className="w-full h-full object-contain animate-pulse" />
                  </div>
                  <div className="bg-panel border border-ink/10 px-3.5 py-2.5 rounded-2xl shadow-xs max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                      </div>
                      <span className="text-[11px] font-medium text-ink/70 transition-all duration-300">
                        {activeThinkingSteps[thinkingIndex % activeThinkingSteps.length]}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Auto-Scroll Anchor */}
              <div ref={bottomAnchorRef} className="h-px w-full pointer-events-none" />
            </div>

            {/* Input Bar */}
            <div className="p-3 shrink-0 border-t border-ink/10 bg-panel">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("placeholder")}
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm bg-page border border-ink/10 text-ink placeholder:text-ink/40 focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-35 cursor-pointer shadow-sm"
                  aria-label={t("send")}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function parseInlineStyles(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1 py-0.5 bg-ink/10 rounded font-mono text-xs text-teal-700 dark:text-teal-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownRenderer({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, blockIdx) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;
        const lines = trimmedBlock.split(/\n/);
        const isList = lines.every((line) => /^[-*]\s|^\d+\.\s/.test(line.trim()));
        if (isList) {
          const isOrdered = /^\d+\./.test(lines[0].trim());
          if (isOrdered) {
            return (
              <ol key={blockIdx} className="list-decimal pl-5 space-y-1 my-1">
                {lines.map((line, i) => (
                  <li key={i} className="text-sm">
                    {parseInlineStyles(line.trim().replace(/^\d+\.\s+/, ""))}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={blockIdx} className="list-disc pl-5 space-y-1 my-1">
              {lines.map((line, i) => (
                <li key={i} className="text-sm">
                  {parseInlineStyles(line.trim().replace(/^[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }
        if (trimmedBlock.startsWith("### ")) {
          return (
            <h4 key={blockIdx} className="text-sm font-semibold mt-3 mb-1 text-ink">
              {parseInlineStyles(trimmedBlock.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmedBlock.startsWith("## ")) {
          return (
            <h3 key={blockIdx} className="text-base font-semibold mt-4 mb-2 text-ink">
              {parseInlineStyles(trimmedBlock.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        return (
          <p key={blockIdx} className="mb-2">
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {parseInlineStyles(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// Cache of streamed message IDs to prevent re-streaming already completed messages
const streamedMessageIds = new Set<string>();

function ChatBubble({
  message,
  isLatest,
  localePrefix,
  onScrollNeeded,
}: {
  message: ChatMessage;
  isLatest: boolean;
  localePrefix: string;
  onScrollNeeded: () => void;
}) {
  const isUser = message.role === "user";
  const [isStreaming, setIsStreaming] = useState(() => {
    return !isUser && !streamedMessageIds.has(message.id) && message.id !== "welcome";
  });
  const [displayedContent, setDisplayedContent] = useState(() => {
    // If user message or already streamed, show full content immediately
    if (isUser || streamedMessageIds.has(message.id) || message.id === "welcome") {
      return message.content;
    }
    return "";
  });

  // 2026 Smooth typewriter streaming (~36ms per word) for incoming assistant messages
  useEffect(() => {
    if (isUser || streamedMessageIds.has(message.id) || message.id === "welcome") {
      setDisplayedContent(message.content);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    const words = message.content.split(" ");
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx += 1; // Stream 1 word per tick for natural reading cadence
      if (currentIdx >= words.length) {
        setDisplayedContent(message.content);
        setIsStreaming(false);
        streamedMessageIds.add(message.id);
        clearInterval(interval);
      } else {
        setDisplayedContent(words.slice(0, currentIdx).join(" "));
      }
      onScrollNeeded();
    }, 36);

    return () => clearInterval(interval);
  }, [message.content, message.id, isUser, onScrollNeeded]);

  // Ensure scroll is triggered after the new text chunk is rendered in the DOM
  useEffect(() => {
    if (displayedContent) {
      onScrollNeeded();
    }
  }, [displayedContent, onScrollNeeded]);

  // Check if message discusses an environmental violation to offer a 1-tap report button
  const hasViolationContext = useMemo(() => {
    if (isUser || message.id === "welcome") return false;
    const text = message.content.toLowerCase();
    return (
      text.includes("ra 9003") ||
      text.includes("ra 9275") ||
      text.includes("pd 705") ||
      text.includes("fine") ||
      text.includes("penalty") ||
      text.includes("violation") ||
      text.includes("denr") ||
      text.includes("illegal")
    );
  }, [message.content, isUser, message.id]);

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-1 bg-ink text-panel shadow-sm">
          <User className="w-4 h-4" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-7 h-7 shrink-0 mt-1 drop-shadow-sm">
          <img src="/images/liksi-logo.webp" alt="Liksi" className="w-full h-full object-contain" />
        </div>
      )}

      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
          isUser
            ? "bg-ink text-panel font-medium"
            : "bg-panel text-ink border border-ink/10"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div>
            <MarkdownRenderer content={displayedContent || message.content} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-teal-500 rounded-xs animate-pulse align-middle" />
            )}

            {/* One-Tap Report Handoff Card */}
            {hasViolationContext && !isStreaming && (
              <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-between animate-fade-in">
                <Link
                  href={`${localePrefix}/report`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-mono text-[11px] font-bold hover:bg-teal-700 transition-all shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>File Incident Report</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
