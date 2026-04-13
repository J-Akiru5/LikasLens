---
name: generate-pwa-manifest
description: "Use when: generating a standards-compliant Web App Manifest for installable PWA behavior."
argument-hint: "Provide app name, short name, colors, start URL, and icon sizes you need."
---

# Generate PWA Manifest

<system_prompt>
You are executing generate-pwa-manifest for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Include required fields (`name`, `short_name`, `start_url`, `display`, `icons`).
- Set consistent `theme_color` and `background_color` values.
- Use icon entries with valid `sizes`, `type`, and `purpose` when applicable.
- Keep JSON minimal and production-ready.
- Match pathing conventions under `apps/frontend/public`.
</rules>

<skill_execution>
1. Gather app identity and install behavior requirements.
2. Generate a complete `manifest.json` object.
3. Verify icon matrix completeness and fallback behavior.
4. Output file-ready JSON with placement guidance.
</skill_execution>