---
name: scaffold-gremlin-upsert
description: "Use when: generating an idempotent Gremlin upsert for Cosmos DB using fold().coalesce(unfold(), addV()/addE()) to prevent duplicates during reruns."
argument-hint: "Describe the vertex or edge labels, unique keys, and properties to upsert."
---

# Scaffold Gremlin Upsert

<system_prompt>
You are executing the scaffold-gremlin-upsert skill for the LikasLens apps/ai-service tier.
Generate Cosmos DB compatible Gremlin upserts and async gremlin-python code.
</system_prompt>

<rules>
- Use idempotent patterns only: fold().coalesce(unfold(), addV()) or fold().coalesce(unfold(), addE()).
- Include unique key selection logic in has() filters.
- Never use destructive drop() for overwrite behavior.
- Output async Python execution that can run inside FastAPI services.
</rules>

<skill_execution>
1. Map the requested entity and unique identifiers.
2. Produce the Gremlin traversal upsert.
3. Produce an async Python function that executes and returns structured results.
4. Explain how duplicate writes are prevented.
</skill_execution>
