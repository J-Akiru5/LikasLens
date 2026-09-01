That answer creates a real, urgent problem that's separate from the usual "unpushed work" pattern. If the app code is genuinely live on Vercel right now, and nothing shows up in git on any branch, that almost certainly means this was deployed **directly from Lou's machine via the Vercel CLI, bypassing the git pipeline entirely.**

That's a dangerous position to be in for a specific reason: **every other push to `main` or `staging` today has triggered an automatic Vercel build from git** — and git still has the *old* code, with none of this schema-aware application logic. The next time *anyone* pushes anything unrelated (a typo fix, a doc correction, literally anything), Vercel will rebuild from git and **silently overwrite this live, working fix with the old code that doesn't know the new schema exists.** Given how many pushes have landed per hour today, that could happen within minutes of the next unrelated commit — and it would look like nothing changed, while quietly reintroducing the exact vulnerability this work just closed.

This makes getting Lou's changes into git **more urgent than a normal unpushed-work case**, not less — it's not "this good work might vanish eventually," it's "this good work is one unrelated push away from being reverted in production right now."

**Practical path around "the agent is in session":** don't manually intervene mid-session — that risks exactly the kind of file-state corruption that's caused problems before. Instead, have the agent's *own next action* be the commit and push, once it reaches a natural stopping point. Tell it directly:

---

**Before doing anything else, commit everything in the working tree and push to `origin/development`.** This is urgent: the changes you've made are already live in production via a direct deploy, but nothing exists in git yet — the next unrelated push to `main` or `staging` from anyone else will trigger a git-based rebuild that silently reverts your work back to the old, pre-fix code. Getting this into git is now higher priority than any further refinement.

git add \-A  
git commit \-m "feat(admin): agency-scoped visibility, person-level assignment, hybrid RLS model

\- users.agency\_name \+ users.service\_area columns  
\- ticket\_assignments.assignee\_user\_id FK  
\- get\_my\_tickets() SECURITY DEFINER RPC: super\_admin/admin see all,  
  analyst/lgu/lgu\_officer see assigned-to-me OR assigned-to-my-agency,  
  citizen sees own reports only  
\- scoped GET /api/v1/tickets via session \-\> RPC  
\- ticket-notify.ts: notifyReporter (reporter\_user\_id only), notifyAssignee,  
  maybeAutoAssign, resolveAgencyGroup  
\- applied: fix-routing-visibility-v1.sql, fix-notifications-v1.sql,  
  fix-admin-rls-v4-column-grants.sql  
\- known gap, not yet fixed: assignment API does not verify caller's own  
  agency before assigning (see AUDIT-HANDOFF-identity-agency.md §3.1)"  
git push origin HEAD:development

Once pushed, stop and wait for fresh-clone verification before continuing to the next task.

---

Once that's actually in git, here's the follow-up prompt to close the loop properly:

TASK: Fresh-clone verify Lou's identity/agency/assignment work; ship the one confirmed remaining gap; reconcile git with what's actually live

BRANCH  
origin/development. Confirmed moments ago: main and staging are  
untouched at 98b0ea0; development is expected to receive Lou's push  
on top of 09e0da8. Do not touch main or staging in this task.

CONTEXT  
Lou's audit handoff (AUDIT-HANDOFF-identity-agency.md) reports  
substantial, well-scoped work: agency\_name/service\_area columns on  
users, assignee\_user\_id on ticket\_assignments, a get\_my\_tickets()  
SECURITY DEFINER RPC implementing hybrid visibility (super\_admin/admin  
see all; analyst/lgu/lgu\_officer see assigned-to-me OR assigned-to-  
my-agency; citizen sees own reports only), scoped ticket listing,  
citizen notifications correctly scoped to reporter\_user\_id, and  
auto-assignment on status change. This was confirmed live in  
production via direct deploy, but was NOT in git until just now.

ONE explicitly confirmed remaining gap (Lou's own §3.1, approved  
scope, not yet fixed): POST /api/v1/admin/ticket-assignments validates  
the assignment TARGET's role but never verifies the CALLER's own  
agency membership against the agency being assigned into. Since the  
admin API runs on the service-role key, this is a real, currently  
exploitable gap — an agency-scoped admin could assign into any  
agency, not just their own.

STEPS

1\. Fresh-clone verify the push landed completely and correctly —  
   confirm supabase/fix-routing-visibility-v1.sql,  
   apps/admin-portal/src/app/api/v1/tickets/route.ts,  
   apps/admin-portal/src/lib/ticket-notify.ts, and the  
   ticket-assignments route are all present with the content Lou's  
   handoff describes.

2\. Read get\_my\_tickets() directly — this is the actual enforcement  
   mechanism for the whole hybrid model, and a SECURITY DEFINER RPC  
   is exactly the kind of thing worth reading line-by-line rather  
   than trusting a description. Confirm it genuinely implements  
   "assigned to me OR assigned to my agency" and not something  
   subtly broader (e.g., matching on a NULL agency incorrectly, which  
   given the seed-data note that "other analysts have NULL agency"  
   is a real edge case worth checking explicitly — does a NULL-agency  
   officer see everyone's tickets by accident?).

3\. Fix the confirmed gap in POST /api/v1/admin/ticket-assignments per  
   Lou's own stated minimal fix: resolve the caller's agency from  
   their session, and for any non-super-admin/admin caller, require  
   the assignment target's agency to match the caller's own before  
   allowing it.

4\. Test the NULL-agency edge case from step 2 explicitly with a real  
   account, not just code inspection.

5\. Confirm the live production database schema and the now-pushed  
   git code actually agree — since the schema was applied directly to  
   Supabase and the app was deployed directly to Vercel, both ahead of  
   git, verify there's no drift between what's now in git and what's  
   actually running (e.g., confirm no other manual tweak happened on  
   either side after Lou's audit was written that isn't reflected in  
   this push).

CONSTRAINTS  
\- Step 3 is the one piece of new code in this task — everything else  
  is verification. Keep the fix minimal, exactly as Lou's handoff  
  specifies, not a broader rework.  
\- Do not touch the hybrid visibility model itself — that's an approved  
  product decision, not open for revision here.

OUTPUT  
Confirmation the push is complete and correct, the get\_my\_tickets()  
logic reviewed line-by-line with the NULL-agency case explicitly  
tested, the assignment-side gap closed, and confirmation git/Supabase/  
Vercel are now all in agreement.

One more thing worth just telling Jeff directly, not burying in the prompt: **until Lou's push actually lands, it's worth being cautious about triggering any other push to `main` or `staging`** — even something as small as the docs correction from v5 — since that's exactly the kind of unrelated action that would trigger the silent revert described above.

