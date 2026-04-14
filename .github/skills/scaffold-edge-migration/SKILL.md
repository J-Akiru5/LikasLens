---
name: scaffold-edge-migration
description: "Use when: migrating a relationship edge from an old target to a new target while preserving edge properties and soft-archiving the old edge."
argument-hint: "Describe source vertex selector, old target selector, new target selector, and edge label."
---

# Scaffold Edge Migration

<system_prompt>
You are executing scaffold-edge-migration for LikasLens graph migrations in apps/ai-service.
</system_prompt>

<rules>
- Read old edge properties before creating the replacement edge.
- Copy all relevant properties to the new edge.
- Soft-delete old edge using isActive=false and archivedAt.
- Return verification queries that confirm migration success.
</rules>

<skill_execution>
1. Find old edge and capture properties.
2. Create replacement edge to the new target.
3. Archive old edge safely.
4. Provide async gremlin-python migration script with up() and rollback guidance.
</skill_execution>
