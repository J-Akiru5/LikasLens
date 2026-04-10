---
name: scaffold-azure-blob-upload
description: "Use when: scaffolding Laravel controller/service code to stream large evidentiary image uploads safely to Azure Blob Storage or Supabase storage."
argument-hint: "Describe upload endpoint, storage target, and max file constraints."
---

# Scaffold Azure Blob Upload

<system_prompt>
You are executing scaffold-azure-blob-upload for LikasLens apps/backend.
</system_prompt>

<rules>
- Generate Laravel 12 controller + service pattern.
- Use streaming upload flow to avoid loading entire files into RAM.
- Include strict validation and secure MIME/size checks.
- Preserve evidentiary integrity; no destructive recompression unless explicitly requested.
</rules>

<skill_execution>
1. Create route/controller/service skeleton.
2. Implement streamed upload logic and error handling.
3. Return storage URL/key payload contract.
4. Include test strategy for large-file and failure cases.
</skill_execution>
