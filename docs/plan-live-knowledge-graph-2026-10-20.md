# Plan — live knowledge graph, law mappings, and production alignment

**Created:** 2026-10-20
**Owner decisions:** recorded below (four answers given this session)
**Branch of record:** `security/p0-remediation` → merges to `main`
**Last verified commit:** `56faefc2`
**Status:** in progress — this document is the task record; update it as work lands.

---

## 1. Objective

Turn the knowledge graph from a hardcoded illustration into a live view of real
data, close the two remaining correctness gaps behind it, and get production code
and production data back into agreement.

**What "done" means**

1. Both knowledge-graph screens render real rows from Postgres — real statutes,
   real agencies — with an honest empty state where the data has no link.
2. The 9 unlinked violation types have a researched, cited statute mapping,
   applied with provenance and a review status.
3. `created_at` can no longer be back- or forward-dated by a client, without
   destroying the demo data's historical spread.
4. `main` carries the code that matches the RLS already enforced in production,
   and it is deployed.

**Non-goals**

- No redesign of the graph visual language. Keep the existing force-directed
  rendering; change what feeds it.
- No new laws invented to make a mapping work. If the right statute is missing,
  it is listed as a gap and the violation stays unlinked.
- No changes to routing logic.

---

## 2. Owner decisions (this session)

| # | Question | Decision |
|---|---|---|
| 1 | What should "live" mean for the graph screens? | **Live knowledge-base browser** — pick/search a hazard, render the real linked statute and real agencies, with an honest "no linked law yet" state and pgvector suggestions where there is no hard link. |
| 2 | How should the 9 mappings be applied? | **Apply all, with source + review status.** Every link carries a citation, a `source`, and a `review_status` of `verified` or `pending`. Uncertain ones are surfaced, not hidden. |
| 3 | How to handle the `created_at` trigger vs demo data? | **Trigger + seed bypass flag.** Server time is forced for real inserts; seeding scripts opt out through a session flag so historical charts keep their spread. |
| 4 | Merge and deploy given the DB/code mismatch? | **Merge and deploy now.** CI is green and production RLS is already live; leaving `main` behind keeps the deployed app broken. |

---

## 3. Current state (verified, not estimated)

### Repository

```
PR #218   security/p0-remediation -> main     88 files, +2,878 / -2,502
CI        green at 56faefc2                   all 7 jobs
pytest    150 passed                          ai-service
shared    82 passed                           routing policy, offline queue
builds    mobile / frontend / admin           verified at HEAD
tree      clean, 0 ahead / 0 behind origin
```

### Production data and access control (already applied)

| Change | State |
|---|---|
| Credentials | 5 rotated; 10 privileged accounts banned |
| Roles | 22 accounts migrated to `app_metadata.role`; all reads switched |
| `users` reads | self-or-staff (`users_select_self_or_staff`) |
| `tickets` reads | own-or-staff (`tickets_select_own_or_staff`) |
| Public projection | `public_tickets` view: 109 rows, no identity, no confidence |
| pgvector | 0.8.0, `halfvec(3072)` + HNSW, 16/16 laws embedded |
| Neo4j | removed from code, config and dependencies |

### Known gaps this plan closes

- `public_select_tickets` is gone, but the **screens** still render four
  hardcoded presets.
- **9 of 11 violation types have `law_id IS NULL`**, so the deterministic lookup
  often returns nothing and pgvector carries the answer alone.
- `created_at` remains client-settable at the database layer.
- `main` still contains code that reads `tickets` directly, which production RLS
  now filters to the caller's own rows.

---

## 4. Workstreams

### WS1 — Live knowledge-base browser

**Goal:** the two knowledge-graph screens are driven by real data.

**Backend (AI service)**

- `GET /graph/knowledge` returns:
  - `hazards[]` — every violation type with code, name, and its linked law(s)
  - `selected` — for a requested `hazard` (or the first): real laws, real
    agencies, `method` = `relational | vector | none`
  - `suggested_laws[]` — pgvector matches, always present, explicitly labelled
    as suggestions rather than assertions
  - `backend` — `postgres+pgvector`
- Pure logic lives in `graph_store.py`; no new dependency.
- Anonymous access is fine: laws and agencies are public data. No ticket data is
  exposed.

**Frontend + mobile**

- Replace `PRESETS` with a fetched dataset mapped into the existing
  `GraphNode`/link shape so the force layout and detail panel keep working.
- Hazard selector listing real violation types.
- Detail panel shows real statute text, issuing agency, and the citation for a
  mapped law; for a vector suggestion it shows the similarity score and says
  "suggested".
- Honest states: "No statute linked yet" and "Knowledge service unavailable".

**Acceptance**

- AC1 [test]: `graph/knowledge` returns only real codes/titles present in the
  database; a test asserts no hardcoded law strings survive in the response path.
- AC2 [test]: with a hazard that has no `law_id`, the response has
  `method = "vector"` (or `none`) and `laws` contains no fabricated entry.
- AC3 [cmd]: `pnpm --filter frontend typecheck` and `--filter mobile-pwa typecheck`
  pass; both builds succeed.
- AC4 [review]: the two pages contain no hardcoded statute title, agency name or
  Cypher/Loki string.

**Out of scope:** per-report traversal, graph editing.

---

### WS2 — Researched law mappings (subagent)

**Goal:** every violation type points at a real, cited statute.

- A dedicated research subagent produces a table: violation → proposed law,
  specific provision, authoritative URL, confidence, review status, rationale.
- Mappings are applied to a new link table:
  `violation_law_links(violation_type_id, law_id, is_primary, source,
  citation_url, review_status, note)`.
  Rationale: one violation can violate several statutes, and provenance needs a
  home. The existing single `law_id` stays as the primary pointer.
- `graph_store` queries union both, preferring `is_primary`.
- Anything the subagent marks `pending` is still written, tagged, and listed for
  human review — not silently trusted.
- If the correct statute is not among the 16, it is reported as a gap. Adding a
  law row requires a title, a code and a citation; only then is it inserted.

**Acceptance**

- AC1 [test]: every applied link has a non-empty `source` and `citation_url`, and
  a `review_status` in (`verified`, `pending`).
- AC2 [test]: linking a violation does not invent a law code; a test rejects a
  link whose law_id is not in `environmental_laws_ph`.
- AC3 [cmd]: `pytest tests/test_graph_store.py` passes, including the new
  mapping-metadata tests.
- AC4 [review]: the PR lists every mapping with its citation and status, including
  the two pre-existing links that were re-verified.

**Out of scope:** legal advice. `pending` is a label, not an approval.

---

### WS3 — `created_at` trigger with a seed bypass

**Goal:** clients cannot choose ticket timestamps; demo data keeps its spread.

- `BEFORE INSERT OR UPDATE` trigger sets `created_at` (on insert) and
  `updated_at` to `now()`.
- Bypass: when `current_setting('likaslens.allow_timestamp_override', true) = 'on'`,
  the supplied values are honoured. Only seeding scripts set it, inside their own
  transaction.
- Update the seed scripts to set the flag.

**Acceptance**

- AC1 [test]: inserting with a future `created_at` stores `now()` (within a
  tolerance), verified against the live database in a rolled-back transaction.
- AC2 [test]: with the session flag on, the supplied timestamp is preserved.
- AC3 [review]: no application code writes `created_at` on tickets any more
  without needing to; the fallback path is simplified or documented.

---

### WS4 — Merge, deploy, verify

**Goal:** production code matches production data.

- Merge PR #218 to `main` (merge commit, no branch deletion).
- Confirm CI on `main`.
- Confirm the deploy pipeline state; Vercel has been failing on a plan build-rate
  limit, which is not a code failure and must be reported as such.
- Smoke-check: the public view is used by the deployed frontend; user reads are
  self-only; the health endpoint reports the pgvector backend.

**Acceptance**

- AC1 [cmd]: `git log origin/main -1` contains the merge; CI on `main` is green.
- AC2 [review]: deploy status recorded honestly, including any plan-limit
  failure that is outside code control.
- AC3 [review]: no production change is claimed that was not observed.

---

## 5. Sequencing

```
plan (this document)
  └─ WS4 merge #218          (urgent: unblocks the deployed app)
       └─ new branch from main
            ├─ WS2 subagent research   (runs in parallel)
            ├─ WS1 backend endpoint
            ├─ WS1 UI (frontend, then mobile)
            ├─ WS3 trigger + seed bypass
            └─ apply WS2 mappings
                 └─ verify, PR, merge, deploy
```

Dependencies: WS2's application step depends on the link table, which is part of
WS2. WS1 only needs the existing data, so it can proceed while research runs.

---

## 6. Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| A wrong statute mapping reaches users | provenance + `review_status`; `pending` shown as pending; no invented codes | one `DELETE` per link row |
| Live graph exposes something it should not | endpoint returns laws/agencies only, never ticket identity | revert the route |
| Trigger breaks a legacy insert | bypass flag; applied in a transaction; verified in a rolled-back probe | drop trigger + function |
| Merge/deploy destabilises production | CI green first; Vercel deploys are already gated by a rate limit | `git revert` the merge commit |
| Subagent returns uncited or invented law | every row validated against the 16 laws; uncited rows rejected | n/a |

---

## 7. Governance conflict (recorded, not silently resolved)

The AgentOps backbone expects `plan/` on `develop` and uses `develop` as the
integration target, with `main` protected. This repository's actual workflow —
and the owner's explicit instruction — integrates to `main` through pull requests.

I did **not** encode `main` as an unprotected integration target, because that
would authorise agents to bypass the PR workflow the repository actually uses.
`agentctl plan sync` therefore reports no contracts, and this plan lives as a
normal repository document.

To adopt the backbone, the owner needs to decide one of:

- keep PR-to-`main` and run `agentctl` in advisory mode only, or
- set `integration.target_branch: main`, remove `main` from
  `protected_branches`, and accept integrator-driven merges, or
- move integration to `develop` and treat `main` as the release branch.

Until then, work proceeds under `AGENTS.md` plus the PR workflow.

---

## 8. Resumption notes

- **Current branch:** `security/p0-remediation` at `56faefc2`, clean and pushed.
- **Next executable step:** merge #218, then branch from `main`.
- **Subagent:** research session for the 9 mappings is running in the background;
  its output is a table, not a database write.
- **Do not** re-run the users/tickets RLS migrations — both are applied and
  verified; the SQL files are records.
- **Resource note:** `agentctl resources` reported red (≈2.6 GB free, load 100%)
  while this was written; heavy builds were deferred to CI.
