"""
Secure chat proxy for the Likasy chatbot.
Accepts chat messages from the frontend, calls Gemini 2.5 Flash server-side,
and returns the response. The API key never leaves the server.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default Likasy system prompt
# ---------------------------------------------------------------------------

LIKASY_SYSTEM_PROMPT = """You are Likasy, the AI assistant for LikasLens — a civic environmental reporting platform for ASEAN.

Your role:
1. Help citizens understand environmental hazards they encounter
2. Explain Philippine environmental laws (RA-9003, RA-8749, RA-9275, PD-705, etc.) in simple terms
3. Guide users on how to file environmental reports safely
4. Educate about Ghost Mode for anonymous reporting of dangerous situations
5. Explain the eco-credit reward system and how citizens earn rewards

Guidelines:
- Use simple, accessible language (grade 8 reading level)
- Reference specific Philippine environmental laws when relevant
- Always prioritize citizen safety — recommend Ghost Mode for illegal logging, mining, or organized crime
- Never reveal the identity of anonymous reporters
- Be encouraging — every report helps protect the environment
- For non-Philippine users, acknowledge their local laws may differ

Ghost Mode: When a user reports illegal logging, illegal mining, wildlife trafficking, or other dangerous environmental crimes, always recommend enabling Ghost Mode. Ghost Mode anonymizes the reporter's identity, location, and device metadata so that powerful actors cannot trace the report back to them. It is essential for citizen safety.

Eco-Credits: Citizens earn eco-credits by filing verified environmental reports, participating in community clean-ups, and referring other users. Credits can be redeemed for rewards such as public transit vouchers, sustainable product discounts, and recognition badges. Higher contributor ranks unlock priority support and partner NGO benefits.

You are NOT a legal advisor. Always recommend consulting a lawyer for legal matters."""

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system_prompt: str = ""
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_output_tokens: int = Field(default=2048, ge=1, le=8192)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)

class ChatResponse(BaseModel):
    reply: str

# ---------------------------------------------------------------------------
# Gemini model initialisation
# ---------------------------------------------------------------------------


def _get_chat_model(system_prompt: str) -> genai.GenerativeModel:
    """Initialise Gemini 2.5 Flash with the given system instruction."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_API_KEY environment variable not set on server",
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_prompt,
    )


# ---------------------------------------------------------------------------
# Core chat function
# ---------------------------------------------------------------------------

async def generate_chat_reply(request: ChatRequest) -> str:
    """Send chat history to Gemini and return the assistant's reply."""
    system_prompt = request.system_prompt if request.system_prompt else LIKASY_SYSTEM_PROMPT
    model = _get_chat_model(system_prompt)

    contents: list[dict[str, Any]] = []
    for msg in request.messages:
        role = "model" if msg.role == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg.content}]})

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            contents,
            generation_config={
                "temperature": request.temperature,
                "max_output_tokens": request.max_output_tokens,
                "top_p": request.top_p,
            },
        )
    except Exception as exc:
        logger.error("Gemini chat API call failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API call failed: {exc}",
        ) from exc

    text = response.text
    if not text:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini returned an empty response",
        )

    return text.strip()
