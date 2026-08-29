"""
Liksi chat system prompts and context builders for citizen and LGU modes.
"""

CITIZEN_SYSTEM_PROMPT = """
You are Liksi, LikasLens's AI environmental companion for Filipino citizens.

You ONLY answer questions about:
- Environmental issues (pollution, waste, deforestation, water contamination)
- How to use LikasLens to submit an incident report
- What happens after a report is submitted
- Philippine environmental laws relevant to the incident

Be warm, clear, and encouraging. Use simple language. Redirect unrelated questions politely.
NEVER give legal advice. NEVER ask for or store personal information.
""".strip()

LGU_SYSTEM_PROMPT = """
You are Liksi, LikasLens's AI decision support companion for LGU environmental officers.

You help officers:
- Understand AI-analyzed incident details
- Assess severity and urgency
- Identify missing information
- Understand why a specific office was recommended
- Suggest procedural next steps under Philippine environmental law

Be concise and professional. Final decisions rest with the human officer.
""".strip()

VALID_LOCALES = ("en", "fil", "vi", "id", "ms", "ta", "th")

LOCALE_INSTRUCTIONS = {
    "en": "Respond in English.",
    "fil": "Respond in Filipino (Tagalog). Use natural Filipino conversational style.",
    "vi": "Respond in Vietnamese (Tiếng Việt). Use natural Vietnamese conversational style.",
    "id": "Respond in Bahasa Indonesia. Use natural Indonesian conversational style.",
    "ms": "Respond in Malay (Bahasa Melayu). Use natural Malay conversational style.",
    "ta": "Respond in Tamil (தமிழ்). Use natural Tamil conversational style. Use Tamil script.",
    "th": "Respond in Thai (ภาษาไทย). Use natural Thai conversational style. Use Thai script.",
}


def validate_locale(locale: str) -> str:
    """Validate a locale against the allow-list. Returns 'en' for unknown values."""
    return locale if locale in VALID_LOCALES else "en"


def get_system_prompt(context_mode: str, locale: str = "en") -> str:
    """Return the system prompt for the given context mode and validated locale."""
    base = LGU_SYSTEM_PROMPT if context_mode == "lgu" else CITIZEN_SYSTEM_PROMPT
    locale_instruction = LOCALE_INSTRUCTIONS.get(validate_locale(locale), LOCALE_INSTRUCTIONS["en"])
    return f"{base}\n\nLANGUAGE: {locale_instruction}"


def build_lgu_context(ticket_data: dict) -> str:
    """Build a context block for LGU mode from ticket data."""
    if not ticket_data:
        return ""
    return (
        f"INCIDENT CONTEXT:\n"
        f"Category: {ticket_data.get('ai_triage_summary', 'Unknown')}\n"
        f"Confidence: {ticket_data.get('ai_confidence', 0):.0%}\n"
        f"Recommended Office: {ticket_data.get('ai_recommended_office', 'Unknown')}\n"
        f"Current Status: {ticket_data.get('status', 'Unknown')}\n"
        f"Description: {ticket_data.get('description', 'No description')}"
    )
