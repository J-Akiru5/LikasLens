"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useGeminiChat, type ChatMessage } from "../../hooks/useGeminiChat";
import { cn } from "../../utils";

export function LikasyChat({ persona = "citizen", locale = "en", className }: { persona?: "citizen" | "admin"; locale?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const { messages, loading, sendMessage } = useGeminiChat(persona, locale);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, open]);

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
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "group fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16",
            className
          )}
          aria-label="Open Likasy chat"
        >
          {/* Outer glowing ripple */}
          <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping [animation-duration:3s]" />
          
          {/* Inner pulsating glow */}
          <div className="absolute -inset-1 rounded-full bg-accent/20 animate-pulse [animation-duration:2s]" />

          {/* Floating Logo Avatar without background circle */}
          <img 
            src="/images/likasy-logo.png" 
            alt="Likasy Chat" 
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
            className={cn("fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[28rem] max-h-[70vh] flex flex-col rounded-xl border border-border bg-panel shadow-lg overflow-hidden", className)}
          >
            <div className="flex items-center gap-2 px-4 py-3 shrink-0 bg-accent text-white">
              <div className="flex items-center justify-center w-8 h-8 shrink-0 drop-shadow-sm">
                 <img src="/images/likasy-logo.png" alt="Likasy" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Likasy</div>
                <div className="text-xs font-mono opacity-70">AI Assistant &bull; Online</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20 transition-colors" aria-label="Close chat">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-page">
              {messages.length === 0 && !loading && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted">Start a conversation with Likasy</p>
                </div>
              )}
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-7 h-7 shrink-0 mt-1 drop-shadow-sm">
                     <img src="/images/likasy-logo.png" alt="Likasy" className="w-full h-full object-contain animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-panel border border-border">
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 shrink-0 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Likasy..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg text-sm theme-input"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-white shrink-0 transition-all disabled:opacity-40"
                  aria-label="Send message"
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
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="px-1 py-0.5 bg-ink/10 rounded font-mono text-xs">{part.slice(1, -1)}</code>;
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
            return <ol key={blockIdx} className="list-decimal pl-5 space-y-1 my-1">{lines.map((line, i) => <li key={i} className="text-sm">{parseInlineStyles(line.trim().replace(/^\d+\.\s+/, ""))}</li>)}</ol>;
          }
          return <ul key={blockIdx} className="list-disc pl-5 space-y-1 my-1">{lines.map((line, i) => <li key={i} className="text-sm">{parseInlineStyles(line.trim().replace(/^[-*]\s+/, ""))}</li>)}</ul>;
        }
        if (trimmedBlock.startsWith("### ")) return <h4 key={blockIdx} className="text-sm font-semibold mt-3 mb-1">{parseInlineStyles(trimmedBlock.replace(/^###\s+/, ""))}</h4>;
        if (trimmedBlock.startsWith("## ")) return <h3 key={blockIdx} className="text-base font-semibold mt-4 mb-2">{parseInlineStyles(trimmedBlock.replace(/^##\s+/, ""))}</h3>;
        return <p key={blockIdx} className="mb-2">{lines.map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{parseInlineStyles(line)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-1 bg-ink shadow-sm">
          <User className="w-4 h-4 text-page" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-7 h-7 shrink-0 mt-1 drop-shadow-sm">
          <img src="/images/likasy-logo.png" alt="Likasy" className="w-full h-full object-contain" />
        </div>
      )}
      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${isUser ? "bg-ink text-page" : "bg-panel text-ink border border-border"}`}>
        {isUser ? <div className="whitespace-pre-wrap break-words">{message.content}</div> : <MarkdownRenderer content={message.content} />}
      </div>
    </div>
  );
}
