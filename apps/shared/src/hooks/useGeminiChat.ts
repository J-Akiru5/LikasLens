"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type Persona = "citizen" | "admin";

export function useGeminiChat(persona: Persona = "citizen", locale: string = "en") {
  const t = useTranslations("chat");
  const welcome = persona === "admin" ? t("welcomeAdmin") : t("welcomeCitizen");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: welcome },
  ]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const addAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.some((m) => m.content === content)) return prev;
      return [...prev, { id: crypto.randomUUID(), role: "assistant", content }];
    });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let currentHistory: Array<{ role: string; content: string }> = [];
    setMessages((prev) => {
      currentHistory = prev
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      return prev;
    });

    const startTime = Date.now();
    const minThinkingTime = 1400; // 1.4s minimum thinking display for 2026 cognitive perception

    try {
      const fetchPromise = fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          locale,
          messages: currentHistory,
        }),
      });

      const res = await fetchPromise;
      if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

      const data = await res.json();
      const reply = data?.reply || t("errorProcess");

      // Ensure minimum thinking window has elapsed so thinking steps are legibly visible
      const elapsed = Date.now() - startTime;
      if (elapsed < minThinkingTime) {
        await new Promise((resolve) => setTimeout(resolve, minThinkingTime - elapsed));
      }

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const elapsed = Date.now() - startTime;
      if (elapsed < minThinkingTime) {
        await new Promise((resolve) => setTimeout(resolve, minThinkingTime - elapsed));
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: t("errorFallback") }]);
    } finally {
      setLoading(false);
    }
  }, [locale, persona, t]);

  return { messages, loading, sendMessage, addAssistantMessage, setMessages };
}
