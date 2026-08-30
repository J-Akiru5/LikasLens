"""
OpenCode Zen client for MiMo-V2.5 Free.

Used as the default provider for hazard-summary generation with automatic
Gemini fallback. Liksi chat and law-embedding retrieval stay on Gemini
(OpenCode doesn't offer an embeddings endpoint for this model).

Endpoint: https://opencode.ai/zen/v1/chat/completions
Auth:     Authorization: Bearer <OPENCODE_API_KEY>
Shape:    Standard OpenAI chat/completions (messages → choices[0].message.content)

NOTE — Free-tier data-use caveat:
During the free period, OpenCode may use request data to improve the model.
The hazard analyzer only sends a hazard category string and a coarse place
name — never a photo, coordinate, or reporter identity — so this is an
acceptable trade-off for zero-cost inference.
"""

from __future__ import annotations

import logging
import time

import httpx

logger = logging.getLogger(__name__)

OPENCODE_BASE_URL = "https://opencode.ai/zen/v1/chat/completions"
OPENCODE_MODEL = "mimo-v2.5-free"
OPENCODE_TIMEOUT_SECONDS = 30


class OpenCodeError(Exception):
    """Raised when the OpenCode Zen API call fails.

    The caller (hazard_analyzer) catches this to fall back to Gemini.
    """

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"OpenCode Zen error {status_code}: {detail}")


async def generate_via_opencode(prompt: str, *, api_key: str) -> str:
    """Send a prompt to OpenCode Zen (MiMo-V2.5 Free) and return the text response.

    Raises:
        OpenCodeError: on non-200 status, timeout, or malformed response.
                        The caller is expected to catch this and fall back to Gemini.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENCODE_MODEL,
        "messages": [
            {"role": "user", "content": prompt},
        ],
    }

    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                OPENCODE_BASE_URL,
                json=payload,
                headers=headers,
                timeout=OPENCODE_TIMEOUT_SECONDS,
            )
    except httpx.TimeoutException as exc:
        raise OpenCodeError(0, f"Timeout after {OPENCODE_TIMEOUT_SECONDS}s") from exc
    except httpx.RequestError as exc:
        raise OpenCodeError(0, f"Connection error: {exc}") from exc

    elapsed_ms = (time.monotonic() - t0) * 1000

    if resp.status_code != 200:
        raise OpenCodeError(resp.status_code, resp.text[:500])

    try:
        body = resp.json()
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenCodeError(
            resp.status_code,
            f"Malformed response: {exc}",
        ) from exc

    if not content or not content.strip():
        raise OpenCodeError(resp.status_code, "Empty response content")

    logger.info(
        "OpenCode Zen served request in %.0fms (model=%s)",
        elapsed_ms,
        OPENCODE_MODEL,
    )
    return content.strip()
