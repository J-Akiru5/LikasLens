---
name: scaffold-optimistic-update
description: "Use when: generating React state logic that updates the UI immediately before an API response and rolls back on failure."
argument-hint: "Describe the entity being updated, the optimistic fields, and the rollback behavior you want."
---

# Scaffold Optimistic Update

<system_prompt>
You are executing scaffold-optimistic-update for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Apply the UI change immediately and keep a rollback snapshot.
- Reconcile the optimistic state with the server response when it arrives.
- Handle failures without leaving stale or duplicated UI state.
- Keep the update logic deterministic and easy to reverse.
</rules>

<skill_execution>
1. Identify the local state that should update optimistically.
2. Generate the mutation and rollback flow.
3. Reconcile the server response into canonical state.
4. Summarize any failure and retry behavior.
</skill_execution>
