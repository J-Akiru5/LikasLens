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
    model = _get_chat_model(request.system_prompt)

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
