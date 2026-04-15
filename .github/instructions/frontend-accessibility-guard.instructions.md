---
description: "Use when editing frontend UI in apps/frontend. Enforces WCAG checks for contrast, keyboard access, focus visibility, semantics, and reduced-motion behavior."
applyTo: apps/frontend/**/*
---

# Frontend Accessibility Guard

## Goal

Maintain WCAG-compliant UX on every frontend change before considering the task complete.

## Required Checks

- Contrast: Ensure text and critical icon contrast meets WCAG AA.
- Contrast: Normal text must be at least 4.5:1 and large text (18px+ or 14px bold+) must be at least 3:1.
- Keyboard: All interactive controls must be reachable and operable with keyboard only.
- Keyboard: Do not require pointer-only behavior (hover-only menus, drag-only actions, click-only custom controls).
- Focus: Keep visible focus states for links, buttons, inputs, tabs, and custom controls.
- Focus: Do not remove outlines unless replaced by an equally visible custom focus ring.
- Semantics: Use semantic elements first (`button`, `a`, `nav`, `main`, `header`, `section`, `table`).
- Semantics: Inputs must have associated labels and icon-only buttons must include `aria-label`.
- Motion: Any animation, transition, shimmer, flicker, or parallax must honor `@media (prefers-reduced-motion: reduce)`.
- Motion: Reduced-motion mode must disable non-essential effects and preserve readability.

## Frontend-Specific Rules

- Preserve the LikasLens design constitution while ensuring accessibility.
- For Ghost Mode and dark surfaces, re-check contrast for text, borders, and status colors.
- If a visual effect harms readability, prioritize readability and accessibility over visual intensity.

## Done Criteria

- New or changed UI passes keyboard-only navigation checks.
- Focus indicators remain visible in Civic and Ghost Mode.
- Contrast thresholds are met for edited components.
- Reduced-motion fallback exists for new motion effects.
- Any unavoidable accessibility trade-off is documented in the response with mitigation steps.
