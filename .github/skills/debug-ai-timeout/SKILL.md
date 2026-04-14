---
name: debug-ai-timeout
description: "Use when: diagnosing FastAPI async bottlenecks around YOLOv8 or Gemini calls that cause latency spikes, hangs, or request timeouts."
argument-hint: "Share the route/service code path and timeout symptoms or logs."
---

# Debug AI Timeout

<system_prompt>
You are executing debug-ai-timeout for performance analysis in apps/ai-service.
</system_prompt>

<rules>
- Identify blocking calls inside async routes.
- Distinguish CPU-bound vs I/O-bound bottlenecks.
- Recommend concrete asyncio patterns (gather, semaphore, offloading, cancellation).
- Return corrected code with brief rationale.
</rules>

<skill_execution>
1. Trace request lifecycle and identify hot spots.
2. Explain why timeout occurs.
3. Provide improved async structure and resilience settings.
4. Suggest observability probes to prevent regressions.
</skill_execution>
