# Deployment runbook

**Status:** production is **not** running `main`. Both deploy paths are blocked on
credentials, not code. This document is the recovery procedure.

Last verified: `main` = `e1b5a586`, CI green, Vercel deploy failing at
`vercel pull`, Render still serving a pre-`e1b5a586` build.

---

## 1. What is actually deployed

| Target | State | Evidence |
|---|---|---|
| AI service (Render) | **old build** | `/health/config` reports `neo4j: configured`, has no `knowledge_store`, and `/graph/knowledge` is 404 |
| Frontend (Vercel) | unknown / behind `main` | `/api/v1/graph/topology` is 404, so the deployed build predates the graph routes |
| Database | **current** | RLS, the `public_tickets` view, pgvector and the law mappings are all live |

The database being ahead of the code is why this matters: the deployed frontend
still reads `tickets` directly, and those rows are now filtered to the caller, so
public data renders empty until the new code ships.

---

## 2. Frontend (Vercel)

### Symptom

```
vercel pull --yes --environment=production
Error: Could not retrieve Project Settings. To link your Project, remove the `.vercel` directory and deploy again.
```

The `.vercel` sentence is boilerplate. Do not commit `.vercel`.

### Likely causes, in order

1. **Stale `VERCEL_PROJECT_ID`.** The secrets predate the current project links.
2. **Project-scoped token.** A project-scoped token cannot run `vercel pull`; it
   must be team-scoped. This produces the same message.
3. **Wrong org id** (personal account vs team).
4. Trailing whitespace in a secret.

### Diagnose

```bash
export VERCEL_TOKEN='<new team-scoped token>'
export VERCEL_ORG_ID='<team id>'
export VERCEL_PROJECT_ID='<project id>'

vercel whoami --token "$VERCEL_TOKEN"
vercel teams ls   --token "$VERCEL_TOKEN"

curl -s -o /dev/null -w 'GET /v2/user        -> %{http_code}\n' \
  -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user
curl -s -o /dev/null -w 'GET /v2/teams/{org} -> %{http_code}\n' \
  -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v2/teams/$VERCEL_ORG_ID"
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_ORG_ID" \
  | jq '{id, name, rootDirectory, framework, error}'
```

| Result | Meaning |
|---|---|
| `/v2/user` or `/v2/teams` fails but the project call succeeds | project-scoped token |
| project call 404 | stale project id, or the token cannot see the team |
| project call 200 but `name` is wrong | wrong project |
| `rootDirectory` ≠ `apps/frontend` | root directory misconfigured |

### Fix

1. Create a **team-scoped** token and revoke the old one.
2. Reset the secrets (the old values cannot be read):

   ```bash
   gh secret set VERCEL_ORG_ID     --body '<team id>'
   gh secret set VERCEL_PROJECT_ID --body '<project id>'
   gh secret set VERCEL_TOKEN      --body '<new token>'
   ```

3. In the Vercel project, set **Root Directory = `apps/frontend`** and, if you
   keep Git-triggered builds, **Include source files outside the Root Directory =
   on** (the app imports `@likaslens/shared` and installs from the repo root).
4. Re-run the workflow. It now preflights the project lookup and prints which
   value is wrong.

---

## 3. AI service (Render)

The code is already on `main`; the service simply was never redeployed.

### Fix

1. Render → `likaslens-ai-service` → Settings → Build & Deploy:
   - Branch = `main`
   - Dockerfile path = `apps/ai-service/Dockerfile`
   - Docker context = `apps/ai-service`
   - Health check = `/health`
2. **Manual Deploy → Deploy latest commit.**
3. Create a deploy hook (Settings → Deploy Hook) and store it:

   ```bash
   gh secret set RENDER_DEPLOY_HOOK_URL --body '<hook url>'
   ```

   `.github/workflows/render-ai-service-deploy.yml` then deploys on every push
   that touches `apps/ai-service/**` and waits until the new build is serving.

`render.yaml` documents the expected service shape. **Do not apply it blindly**:
a Blueprint manages by name, and if it cannot adopt the existing service it
creates a second one with a different hostname, breaking every `RENDER_AI_URL`.

### Prove it landed

```bash
AI=https://likaslens-ai-service.onrender.com
curl -fsS "$AI/health/config" | jq -e '
  .neo4j.status == "removed"
  and .knowledge_store.backend == "postgres+pgvector"
  and .knowledge_store.vector_ready == true
  and (.knowledge_store.embedded_laws // 0) > 0'

python apps/ai-service/smoke_deploy.py --base-url "$AI"
```

The smoke script checks the whole contract: liveness, the knowledge store,
`/graph/topology` backend, all 11 hazard mappings, the corrected coral and
mangrove links, and that Neo4j is reported as removed. It exits non-zero with the
failing check named.

---

## 4. Post-deploy checks

Run in this order. `$SUPABASE_URL` and the anon key are public by design; the
service-role key must come from a local env var and must never be committed.

```bash
AI=https://likaslens-ai-service.onrender.com
SUPABASE_URL=https://<project>.supabase.co
ANON=<anon key>

# AI service
curl -fsS "$AI/health"
curl -fsS "$AI/health/config" | jq .
python apps/ai-service/smoke_deploy.py --base-url "$AI"

# Frontend
curl -s -o /dev/null -w '%{http_code}\n' https://likaslens.syntaxure.dev/en            # 200
curl -s -o /dev/null -w '%{http_code}\n' https://likaslens.syntaxure.dev/en/dashboard  # 200
curl -s -o /dev/null -w '%{http_code}\n' https://likaslens.syntaxure.dev/api/v1/graph/topology  # 200 on the new build, 404 before

# Mobile and admin auth guards
curl -s -o /dev/null -w '%{http_code}\n' https://likaslensapp.syntaxure.dev/en/dashboard   # 307 to /login
curl -s -o /dev/null -w '%{http_code}\n' https://likasadmin.syntaxure.dev/en/dashboard     # 307 to /login

# RLS: anonymous must see no base rows, but the public view must return rows
curl -sS -D - -o /dev/null -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H 'Prefer: count=exact' "$SUPABASE_URL/rest/v1/tickets?select=id&limit=1" \
  | grep -i content-range          # */0

curl -sS -D - -o /dev/null -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H 'Prefer: count=exact' "$SUPABASE_URL/rest/v1/public_tickets?select=id&limit=3" \
  | grep -i content-range          # 0-2/<positive>

curl -s -o /dev/null -w '%{http_code}\n' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  "$SUPABASE_URL/rest/v1/public_tickets?select=reporter_user_id&limit=1"   # 400
```

---

## 5. Known deploy hazards

1. **pnpm version divergence.** CI pins 11; the local machine has 10.33.3; no
   `packageManager` is declared. `pnpm-workspace.yaml` uses `allowBuilds`, a
   pnpm 11-only key that pnpm 10 silently ignores, so dependency build scripts
   may be skipped. Pin one version before trusting a deploy.
2. **Root `vercel.json`.** It builds `apps/frontend` but declares
   `outputDirectory: ".next"` relative to the root. The deploy workflow now runs
   in `apps/frontend` to avoid this.
3. **Build-time env vars.** `NEXT_PUBLIC_*` values are inlined at build; changing
   one requires a rebuild. `SUPABASE_SERVICE_ROLE_KEY` must be present or report
   submission returns 503.
4. **Render port.** `start.sh` now binds `${PORT:-8001}`. A fresh service that
   ignores `PORT` will build and then fail its health check.
5. **`ENV_MODEL_PATH`.** The repo has a second YOLO model. It is deliberately
   unset in `render.yaml`; 512 MB does not comfortably hold both.
6. **Repository variables.** `DB_PASSWORD` and `NEO4J_PASSWORD` are stored as
   plaintext repository *variables*, and `NEO4J_PASSWORD` is now obsolete. Move
   any still needed to secrets and delete the rest.
7. **Database pool.** `db/connection.py` now sets `pool_pre_ping=True` and
   `pool_recycle=300`, which addresses the `connection is closed` errors seen
   after a free-tier spin-down.
