"""
POST /api/v1/liksi/chat — Context-aware Liksi chat with Citizen and LGU modes.
Extends the existing /api/v1/chat endpoint with system prompt scoping + ticket context injection.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from auth.supabase_jwt import optional_auth
from db.connection import get_db
from db.models import Ticket
from services.liksi_service import build_lgu_context, get_system_prompt

router = APIRouter(prefix="/api/v1/liksi", tags=["liksi"])


class LiksiChatRequest(BaseModel):
    message: str
    context_mode: str = "citizen"  # "citizen" | "lgu"
    ticket_id: str | None = None   # LGU mode: inject ticket context
    conversation_id: str | None = None
    messages: list[dict] | None = None  # optional history


@router.post("/chat")
async def liksi_chat(
    body: LiksiChatRequest,
    db: AsyncSession = Depends(get_db),
    token: dict | None = Depends(optional_auth),
):
    """Context-aware chat endpoint for Liksi AI companion."""
    from chat_proxy import ChatRequest, generate_chat_reply

    system_prompt = get_system_prompt(body.context_mode)

    # LGU mode: inject ticket context into the system prompt
    if body.context_mode == "lgu" and body.ticket_id:
        try:
            result = await db.execute(
                select(Ticket).where(Ticket.id == uuid.UUID(body.ticket_id))
            )
            ticket = result.scalar_one_or_none()
            if ticket:
                ticket_context = build_lgu_context({
                    "ai_triage_summary": ticket.ai_triage_summary,
                    "ai_confidence": ticket.ai_confidence,
                    "ai_recommended_office": ticket.ai_recommended_office,
                    "status": ticket.status,
                    "description": ticket.description,
                })
                system_prompt = f"{system_prompt}\n\n{ticket_context}"
        except Exception:
            pass  # If ticket lookup fails, proceed with base prompt

    # Build message history
    history = body.messages or []
    history.append({"role": "user", "content": body.message})

    try:
        request = ChatRequest(
            messages=history,
            system_prompt=system_prompt,
            temperature=0.7,
            max_output_tokens=1024,
        )
        reply = await generate_chat_reply(request)
    except Exception as e:
        return {
            "reply": "Liksi is temporarily unavailable. Please try again later.",
            "error": str(e),
        }

    return {
        "success": True,
        "reply": reply,
        "context_mode": body.context_mode,
        "conversation_id": body.conversation_id or str(uuid.uuid4()),
    }
