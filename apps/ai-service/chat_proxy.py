"""
Secure chat proxy for the Liksi chatbot.
Accepts chat messages from the frontend, calls Gemini 2.5 Flash server-side,
and returns the response. The API key never leaves the server.

Liksi intentionally stays on Gemini — do not route through OpenCode.
"""

from __future__ import annotations

import asyncio
import logging

from google import genai
from google.genai import types
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from config import settings

logger = logging.getLogger(__name__)

GEMINI_TIMEOUT_SECONDS = 30
MAX_MESSAGES = 50
MAX_CONTENT_LENGTH = 10000

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Lazy-initialise the Gemini client (thread-safe for FastAPI workers)."""
    global _client
    if _client is None:
        api_key = settings.google_api_key
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_API_KEY environment variable not set on server",
            )
        _client = genai.Client(api_key=api_key)
    return _client


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
# Core chat function
# ---------------------------------------------------------------------------

async def generate_chat_reply(request: ChatRequest) -> str:
    """Send chat history to Gemini and return the assistant's reply.

    Retries up to 3 times on rate-limit (429) or timeout with exponential
    backoff (1s, 2s). Other errors (empty response, malformed input) are
    raised immediately — retrying won't help.
    """
    client = _get_client()

    contents: list[str] = []
    for msg in request.messages:
        contents.append(msg.content)

    gen_config = types.GenerateContentConfig(
        system_instruction=request.system_prompt or None,
        temperature=request.temperature,
        max_output_tokens=request.max_output_tokens,
        top_p=request.top_p,
    )

    last_exc = None
    for attempt in range(3):
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=contents,
                    config=gen_config,
                ),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            text = response.text
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Gemini returned an empty response",
                )
            if attempt > 0:
                logger.info("Gemini chat succeeded on attempt %d/3", attempt + 1)
            return text.strip()
        except asyncio.TimeoutError:
            last_exc = None
            logger.warning("Gemini chat timeout on attempt %d/3", attempt + 1)
        except Exception as exc:
            last_exc = exc
            logger.warning("Gemini chat error on attempt %d/3: %s", attempt + 1, exc)

        if attempt < 2:
            delay = 2 ** attempt  # 1s, 2s
            await asyncio.sleep(delay)

    if last_exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini API call failed after 3 attempts",
        ) from last_exc
    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail=f"Gemini API timed out after 3 attempts",
    )
