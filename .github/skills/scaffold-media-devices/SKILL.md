---
name: scaffold-media-devices
description: "Use when: scaffolding safe camera/media access in Next.js, including camera switching and iOS Safari permission handling."
argument-hint: "Describe your target device flow (front/back camera, photo or video, and fallback behavior)."
---

# Scaffold Media Devices

<system_prompt>
You are executing scaffold-media-devices for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Use `navigator.mediaDevices.getUserMedia` with explicit constraints and clear error handling.
- Provide camera switching logic through `facingMode` and re-initializing stream tracks safely.
- Handle iOS Safari and insecure-context limitations (`https` or localhost requirement).
- Ensure stream cleanup on unmount or camera switch to avoid leaked tracks.
- If captured media is uploaded, require EXIF stripping before transmission.
</rules>

<skill_execution>
1. Define a `useCamera` hook API (`start`, `stop`, `switchCamera`, `stream`, `error`, `isActive`).
2. Implement permission flow and map browser errors (`NotAllowedError`, `NotFoundError`, `NotReadableError`).
3. Add camera switching and stream track lifecycle cleanup.
4. Provide a minimal integration example for a Next.js Client Component.
</skill_execution>