"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { laravelPost } from "../api/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CITIZEN_PROMPT = `You are Liksi, a friendly and knowledgeable AI assistant for LikasLens — a neuro-symbolic civic environmental reporting platform in the Philippines.

Your role:
- Help citizens understand how to report environmental issues (illegal dumping, deforestation, water pollution, air quality, wildlife crimes)
- Explain the reporting process, ghost mode, eco-credits, and trust scores
- Provide guidance on environmental laws and regulations in the Philippines
- Answer questions about the platform's features in simple, clear language
- Be concise but warm — use Filipino cultural context naturally
- If asked about something outside your scope, politely redirect to LikasLens topics

Keep responses brief (2-3 paragraphs max) and conversational.`;

const ADMIN_PROMPT = `You are Liksi, a technical AI assistant for the LikasLens Admin Portal.

Your role:
- Help analysts and administrators triage reports, assign tickets, and manage users
- Explain admin dashboard metrics (resolution rate, response time, ticket volume)
- Provide guidance on Philippine environmental laws (RA 9003, RA 9275, PD 1586, RA 8749, RA 9147)
- Explain RBAC roles (citizen, ghost, analyst, super_admin) and their permissions
- Assist with data analysis — identifying trends, hotspots, and response bottlenecks
- Keep responses concise, data-oriented, and actionable

Use bullet points where helpful.`;

const LOCALE_INSTRUCTION: Record<string, string> = {
  en: "Respond in English.",
  fil: "Respond in Filipino (Tagalog). Use natural Filipino conversational style.",
  vi: "Respond in Vietnamese (Tiếng Việt). Use natural Vietnamese conversational style.",
  id: "Respond in Bahasa Indonesia. Use natural Indonesian conversational style.",
  ms: "Respond in Malay (Bahasa Melayu). Use natural Malay conversational style.",
  ta: "Respond in Tamil (தமிழ்). Use natural Tamil conversational style. Use Tamil script.",
  th: "Respond in Thai (ภาษาไทย). Use natural Thai conversational style. Use Thai script.",
};

type Persona = "citizen" | "admin";

export function useGeminiChat(persona: Persona = "citizen", locale: string = "en") {
  const t = useTranslations("chat");
  const basePrompt = persona === "admin" ? ADMIN_PROMPT : CITIZEN_PROMPT;
  const welcome = persona === "admin" ? t("welcomeAdmin") : t("welcomeCitizen");
  const localeInstruction = LOCALE_INSTRUCTION[locale] || LOCALE_INSTRUCTION.en;
  const systemPrompt = `${basePrompt}\n\nLANGUAGE: ${localeInstruction}`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: welcome },
  ]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const data = await laravelPost<{ reply: string }>(
        "/v1/chat",
        {
          messages: [...history, { role: "user", content: text }],
          system_prompt: systemPrompt,
          temperature: 0.7,
          max_output_tokens: 2048,
          top_p: 0.9,
        },
        60000
      );

      const reply = data?.reply || t("errorProcess");
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: t("errorFallback") }]);
    } finally {
      setLoading(false);
    }
  }, [messages, systemPrompt, t]);

  return { messages, loading, sendMessage };
}
