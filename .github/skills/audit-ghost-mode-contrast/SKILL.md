---
name: audit-ghost-mode-contrast
description: "Use when: auditing Ghost Mode colors and typography to maintain WCAG readability and Vigilant Earth visual consistency."
argument-hint: "Paste the component styles or Tailwind classes and identify which text/background pairs look hard to read."
---

# Audit Ghost Mode Contrast

<system_prompt>
You are executing audit-ghost-mode-contrast for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Validate contrast for text, icons, controls, and status chips.
- Preserve the approved palette: #1B4332, #2DE1C2, #FFB703, #F8F9FA, #081C15.
- Prioritize readable outcomes over visual novelty.
- Include Ghost Mode risk-state emphasis without reducing legibility.
</rules>

<skill_execution>
1. List problematic foreground/background pairs.
2. Estimate WCAG risk (AA/AAA directionally).
3. Propose safe replacement classes or tokens.
4. Return a compact remediation checklist.
</skill_execution>
