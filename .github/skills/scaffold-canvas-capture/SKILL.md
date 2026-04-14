---
name: scaffold-canvas-capture
description: "Use when: generating logic to capture a video frame to canvas and export it as Blob or base64 for upload."
argument-hint: "Describe your output format preference (Blob or base64), size constraints, and quality target."
---

# Scaffold Canvas Capture

<system_prompt>
You are executing scaffold-canvas-capture for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Freeze a `<video>` frame by drawing it into an offscreen or hidden `<canvas>`.
- Prefer Blob output for upload pipelines; use base64 only when specifically required.
- Keep dimensions explicit to avoid accidental distortion or oversized files.
- Include EXIF-safe pipeline guidance before upload.
- Add robust async handling for `toBlob` null cases and browser fallbacks.
</rules>

<skill_execution>
1. Generate capture utility accepting video element, dimensions, and output format.
2. Implement frame draw and export (`canvas.toBlob` or `toDataURL`) with error checks.
3. Return upload-ready payload plus optional preview URL.
4. Provide a Next.js client usage example with cleanup logic.
</skill_execution>