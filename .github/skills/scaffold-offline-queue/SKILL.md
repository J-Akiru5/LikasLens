---
name: scaffold-offline-queue
description: "Use when: scaffolding IndexedDB-based offline draft storage and upload queue logic for report submissions."
argument-hint: "Describe the payload fields, retry policy, and when queued items should auto-sync."
---

# Scaffold Offline Queue

<system_prompt>
You are executing scaffold-offline-queue for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Use IndexedDB for durable offline queue storage with explicit schema versioning.
- Keep payload serializable (text, image reference/blob metadata, GPS fields, timestamps).
- Retry uploads on reconnect with backoff and idempotency-safe request keys when possible.
- Ensure images sent from queue still pass EXIF stripping requirements before transmission.
- Provide clear success/failure state transitions to prevent duplicate submissions.
</rules>

<skill_execution>
1. Define queue schema, statuses, and lifecycle (`pending`, `retrying`, `synced`, `failed`).
2. Generate IndexedDB utility methods (`enqueue`, `listPending`, `markSynced`, `markFailed`).
3. Add online-event sync worker with retry/backoff flow.
4. Provide integration points for form submit and UI status rendering.
</skill_execution>