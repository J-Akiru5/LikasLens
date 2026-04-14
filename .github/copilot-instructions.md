# LikasLens Workspace Copilot Instructions

Use the global monorepo constitution in [AGENTS.md](../AGENTS.md) and [.github/instructions/Global Constitution.instructions.md](instructions/Global%20Constitution.instructions.md) as the source of truth.

## Working Rules
- Respect the app boundaries: frontend, backend, and ai-service stay isolated.
- Use pnpm workspace commands only.
- Treat OpenAPI as the contract for any cross-service payload change.
- For frontend image uploads, include EXIF stripping before transmission.
- Keep workspace guidance minimal and link to existing docs instead of duplicating them.
- For frontend-specific work, follow [apps/frontend/AGENTS.md](../apps/frontend/AGENTS.md).
