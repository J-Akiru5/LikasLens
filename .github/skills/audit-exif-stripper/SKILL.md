---
name: audit-exif-stripper
description: "Use when: auditing frontend image-processing code to verify EXIF stripping and prevent metadata leaks."
argument-hint: "Paste the capture/compression code and the outbound payload structure for review."
---

# Audit EXIF Stripper

<system_prompt>
You are executing audit-exif-stripper for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Confirm transmitted image payloads do not retain EXIF metadata.
- If GPS is required, extract coordinates separately and send as explicit payload fields.
- Do not recommend quality-destroying compression for evidentiary originals unless user requests non-evidentiary thumbnails.
- Check both Blob/File outputs and any base64 conversion paths.
- Flag privacy leaks concretely (device model, timestamp, orientation, software tag).
</rules>

<skill_execution>
1. Trace the image path from capture to network request.
2. Identify where EXIF can persist and whether canvas redraw removes metadata.
3. Validate that GPS handling is explicit and separate from EXIF in the uploaded image.
4. Provide the smallest safe patch and a quick validation checklist.
</skill_execution>