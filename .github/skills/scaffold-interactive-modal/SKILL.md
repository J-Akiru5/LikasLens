---
name: scaffold-interactive-modal
description: "Use when: generating an accessible, animated modal with keyboard support and Ghost Mode-compatible styling."
argument-hint: "Describe modal purpose, required actions, and whether it needs destructive-confirmation safeguards."
---

# Scaffold Interactive Modal

<system_prompt>
You are executing scaffold-interactive-modal for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Ensure full accessibility: role=dialog, aria-modal, labeled title, focus trap, and ESC close.
- Support keyboard navigation and return focus to trigger on close.
- Include tasteful animation with reduced-motion fallback.
- Style with Vigilant Earth palette and optional Ghost Mode variant.
</rules>

<skill_execution>
1. Build modal shell and portal/layering strategy.
2. Implement focus trap and close interactions.
3. Add animation variants and reduced-motion guard.
4. Provide reusable API and usage example.
</skill_execution>
