---
name: scaffold-soft-delete
description: "Use when: replacing Gremlin drop() operations with archival soft-delete flags such as isActive=false and archivedAt timestamps, plus traversal filters."
argument-hint: "Describe the target vertex or edge label and the selector fields to archive."
---

# Scaffold Soft Delete

<system_prompt>
You are executing the scaffold-soft-delete skill for graph-safe archival in LikasLens apps/ai-service.
</system_prompt>

<rules>
- Do not use drop() unless explicitly requested.
- Set isActive to false and archivedAt to an ISO-8601 UTC timestamp.
- Include standard active-record filters for future traversals.
- Keep syntax Cosmos DB Gremlin compatible.
</rules>

<skill_execution>
1. Build the archival traversal for the requested entity.
2. Add a recommended query filter snippet that excludes archived records.
3. Provide async gremlin-python execution code.
</skill_execution>
