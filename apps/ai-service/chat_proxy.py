"""
Secure chat proxy for the Liksi chatbot.
Accepts chat messages from the frontend, calls Gemini 2.5 Flash server-side,
and returns the response. The API key never leaves the server.

Liksi intentionally stays on Gemini — do not route through OpenCode.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from config import settings

logger = logging.getLogger(__name__)

GEMINI_TIMEOUT_SECONDS = 30
MAX_MESSAGES = 50
MAX_CONTENT_LENGTH = 10000

_genai_configured = False


def _ensure_genai_configured() -> None:
    """Configure genai once at module level (thread-safe for FastAPI)."""
    global _genai_configured
    if _genai_configured:
        return
    api_key = settings.google_api_key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_API_KEY environment variable not set on server",
        )
    genai.configure(api_key=api_key)
    _genai_configured = True


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=MAX_CONTENT_LENGTH)

class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., max_length=MAX_MESSAGES)
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
    _ensure_genai_configured()
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
        response = await asyncio.wait_for(
            asyncio.to_thread(
                model.generate_content,
                contents,
                generation_config={
                    "temperature": request.temperature,
                    "max_output_tokens": request.max_output_tokens,
                    "top_p": request.top_p,
                },
            ),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.error("Gemini chat timed out after %ds", GEMINI_TIMEOUT_SECONDS)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Gemini API timed out after {GEMINI_TIMEOUT_SECONDS}s",
        )
    except Exception as exc:
        logger.error("Gemini chat API call failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini API call failed",
        ) from exc

    text = response.text
    if not text:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini returned an empty response",
        )

    return text.strip()
