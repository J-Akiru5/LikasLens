"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are Likasy, a friendly and knowledgeable AI assistant for LikasLens — a neuro-symbolic civic environmental reporting platform in the Philippines.

Your role:
- Help citizens understand how to report environmental issues (illegal dumping, deforestation, water pollution, air quality, wildlife crimes)
- Explain the reporting process, ghost mode, eco-credits, and trust scores
- Provide guidance on environmental laws and regulations in the Philippines
- Answer questions about the platform's features in simple, clear language
- Be concise but warm — use Filipino cultural context naturally
- If asked about something outside your scope, politely redirect to LikasLens topics

Keep responses brief (2-3 paragraphs max) and conversational.`;

export function useGeminiChat(customSystemPrompt?: string, customWelcomeMessage?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: customWelcomeMessage || "Hey! I'm Likasy, your AI guide to LikasLens. Ask me anything about reporting environmental issues, using the platform, or Philippine environmental laws!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const historyMessages = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL;
      if (!aiServiceUrl) throw new Error("AI service URL not configured");

      const res = await fetch(`${aiServiceUrl}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...historyMessages, { role: "user", content: text }],
          system_prompt: customSystemPrompt || DEFAULT_SYSTEM_PROMPT,
          temperature: 0.7,
          max_output_tokens: 2048,
          top_p: 0.9,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `API error ${res.status}`);
      }

      const data = await res.json();
      const reply = data?.reply?.trim() || "Sorry, I couldn't process that. Try again!";

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;

      const fallback: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Oops! I couldn't reach my brain right now. Please check your connection or try again later.",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  }, [messages, customSystemPrompt]);

  return { messages, loading, sendMessage };
}
