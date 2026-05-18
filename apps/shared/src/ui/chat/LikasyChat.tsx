"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Leaf, User } from "lucide-react";
import { useGeminiChat, type ChatMessage } from "../../hooks/useGeminiChat";

export interface LikasyChatProps {
  systemPrompt?: string;
  welcomeMessage?: string;
}

export function LikasyChat({ systemPrompt, welcomeMessage }: LikasyChatProps) {
  const [open, setOpen] = useState(false);
  const { messages, loading, sendMessage } = useGeminiChat(systemPrompt, welcomeMessage);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Small delay so the panel renders before scrolling
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
      {/* Chat bubble button — fixed bottom-right */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-[4px_4px_0px_rgba(8,28,21,0.3)] transition-all duration-200 hover:scale-105 hover:shadow-[6px_6px_0px_rgba(8,28,21,0.4)] active:scale-95"
        style={{ background: "var(--secondary)", color: "#081c15" }}
        aria-label={open ? "Close chat" : "Open Likasy chat"}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[28rem] max-h-[70vh] flex flex-col rounded-xl shadow-[8px_8px_0px_rgba(8,28,21,0.2)] animate-slide-in overflow-hidden"
          style={{ background: "var(--panel)", border: "4px solid var(--panel-border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 py-3 shrink-0"
            style={{ background: "var(--secondary)", color: "#081c15" }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/30">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading text-sm font-black uppercase tracking-wider">Likasy</div>
              <div className="text-xs font-mono font-bold opacity-70">AI Assistant • Online</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-3 space-y-3"
            style={{ background: "var(--background)" }}
          >
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-1" style={{ background: "var(--secondary)" }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: "#081c15" }} />
                </div>
                <div className="flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: "var(--panel)", border: "2px solid var(--panel-border)" }}>
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--secondary)" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.15s]" style={{ background: "var(--secondary)" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.3s]" style={{ background: "var(--secondary)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 shrink-0" style={{ borderTop: "2px solid var(--panel-border)" }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Likasy..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-lg font-mono text-sm theme-input"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-all disabled:opacity-40"
                style={{ background: "var(--secondary)", color: "#081c15" }}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function parseInlineStyles(text: string): React.ReactNode[] {
  // Regex to split by bold (**text**), italics (*text*), or inline code (`code`)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-foreground/95">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono text-xs border border-primary/10">
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

        const isList = lines.every((line) => {
          const l = line.trim();
          return l.startsWith("- ") || l.startsWith("* ") || /^\d+\.\s/.test(l);
        });

        if (isList) {
          const listType = lines[0].trim().startsWith("- ") || lines[0].trim().startsWith("* ") ? "ul" : "ol";

          if (listType === "ul") {
            return (
              <ul key={blockIdx} className="list-disc pl-5 space-y-1 my-1">
                {lines.map((line, lineIdx) => {
                  const cleaned = line.trim().replace(/^[-*]\s+/, "");
                  return (
                    <li key={lineIdx} className="text-sm">
                      {parseInlineStyles(cleaned)}
                    </li>
                  );
                })}
              </ul>
            );
          } else {
            return (
              <ol key={blockIdx} className="list-decimal pl-5 space-y-1 my-1">
                {lines.map((line, lineIdx) => {
                  let cleaned = line.trim().replace(/^\d+\.\s+/, "");
                  cleaned = cleaned.trim().replace(/^[-*]\s+/, "");
                  return (
                    <li key={lineIdx} className="text-sm">
                      {parseInlineStyles(cleaned)}
                    </li>
                  );
                })}
              </ol>
            );
          }
        }

        if (trimmedBlock.startsWith("### ")) {
          return (
            <h4 key={blockIdx} className="font-heading text-sm font-black uppercase mt-3 mb-1 text-primary">
              {parseInlineStyles(trimmedBlock.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmedBlock.startsWith("## ")) {
          return (
            <h3 key={blockIdx} className="font-heading text-base font-black uppercase mt-4 mb-2 text-primary">
              {parseInlineStyles(trimmedBlock.replace(/^##\s+/, ""))}
            </h3>
          );
        }

        return (
          <p key={blockIdx} className="mb-2">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {parseInlineStyles(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-1"
        style={{ background: isUser ? "var(--accent)" : "var(--secondary)" }}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" style={{ color: "#081c15" }} />
        ) : (
          <Bot className="w-3.5 h-3.5" style={{ color: "#081c15" }} />
        )}
      </div>

      <div
        className="max-w-[80%] px-3 py-2 rounded-xl font-body text-sm leading-relaxed"
        style={{
          background: isUser ? "var(--accent)" : "var(--panel)",
          color: isUser ? "#081c15" : "var(--foreground)",
          border: isUser ? "none" : "2px solid var(--panel-border)",
        }}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}
