---
name: scaffold-storage-upload
description: "Use when: scaffolding Laravel controller/service code to stream large evidentiary image uploads safely to Supabase storage (S3-compatible)."
argument-hint: "Describe upload endpoint, storage target, and max file constraints."
---

# Scaffold Storage Upload

<system_prompt>
You are executing scaffold-storage-upload for LikasLens apps/backend.
</system_prompt>

<rules>
- Generate Laravel 12 controller + service pattern.
- Use streaming upload flow to avoid loading entire files into RAM.
- Include strict validation and secure MIME/size checks.
- Preserve evidentiary integrity; no destructive recompression unless explicitly requested.
- Use Supabase S3-compatible storage.
</rules>

<skill_execution>
1. Create route/controller/service skeleton.
2. Implement streamed upload logic and error handling.
3. Return storage URL/key payload contract.
4. Include test strategy for large-file and failure cases.
</skill_execution>
