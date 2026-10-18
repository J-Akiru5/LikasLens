# LikasLens CSC AVP production brief (for AI agents)

Audience for this file: coding agents that will build the LikasLens AVP (audio-visual presentation)
for the Civil Service Commission (CSC) HR Innovation Lab. Humans: this is the machine-readable plan.

This brief is patterned on the TeeLine Golf AVP brief (`docs/avp/AVP_PRODUCTION_BRIEF.md` in
`J-Akiru5/golf-management-system-sl`). The pipeline is the same. The differences are in section 4.

Status: **draft for owner review, 18 Oct 2026. Direction proposed by Claude, pending the owner's yes:**
record on localhost from a throwaway branch, with real Gemini and fixtures for Supabase (section 4).
Open items in section 3 need the owner or Lou before the step that depends on them.

## 1. Goal

One short narrated video that makes a non-technical public-sector viewer think: "I can see this working
in my office."

| Item | Value |
| --- | --- |
| Viewers | CSC contact (Vivian Bravo), then the regional director; later possibly others at the HR Innovation Lab |
| Message | A citizen's photo reaches the right office with the right law attached, and the result is publicly tracked |
| Length | 75 to 90 seconds |
| Narration | AI voice, English, generated locally (Kokoro `af_heart`), no cloud TTS |
| Picture | Scripted screen recording of the real apps, 1920x1080 final frame |
| Main file | `likaslens-csc-avp.mp4` (H.264, AAC, 30 fps, under 50 MB so it emails cleanly) |
| Also | `.srt`, burned-in English captions, `poster.jpg`, `QA-report.md` |
| Success test | A viewer who has never seen the app can say what it does, who acts on a report, and what stays private |

Out of scope: animated explainer, live-action footage beyond one owned or licensed opening shot,
generated imagery, any real reporter, address, or violator, any unmeasured accuracy figure.

## 2. Facts (checked 18 Oct 2026 unless noted)

Verified by reading the repo (full clone, not shallow) or by loading the live sites:

- Repo `J-Akiru5/LikasLens` is public. `main`, `staging` and `development` all point at `537e7dc`
  (3 Sep 2026). There are no tags. There is no root `LICENSE` file.
- Monorepo apps: `apps/frontend` (public site, `/report`, `/public-record`, `/track`), `apps/mobile-pwa`
  (citizen PWA: `report`, `offline-queue`, `laws`, `history`, `impact`, `map`, Liksi), `apps/admin-portal`
  (`triage`, `tickets`, `lgu-performance`, `laws`, `audit-logs`), `apps/ai-service` (FastAPI; Gemini
  `gemini-3.6-flash` for Liksi chat), `apps/shared`.
- Live: `likaslens.syntaxure.dev` and `likasadmin.syntaxure.dev` load. `likaslensapp.syntaxure.dev` (mobile
  PWA) was not re-checked.
- **There is no mock or demo mode switch.** A search for mock/demo flags found only tests and a few
  hardcoded sample blocks (the landing ledger, the admin landing queue sample). The report, ticket, history
  and public-record flows use `supabase-js` against the live Supabase project, and the AI calls go through
  Next API routes (`/api/v1/ai/...`) to `RENDER_AI_URL`, falling back to `LOCAL_AI_URL` or
  `http://127.0.0.1:8001`.
- **The database schema cannot be rebuilt from the repo.** There is no `supabase/migrations` folder and no
  `supabase/config.toml`. The repo has 11 `supabase/*.sql` patch files (`fix-*`, `seed-*`) and two Alembic
  migrations in `apps/ai-service/db/migrations`. A second clean Supabase project is therefore not a quick
  option.
- `vercel-ignore.sh` is set as `ignoreCommand` in the root and the three app `vercel.json` files and says to
  build only `main` and `staging`. **But PR #216 (a docs branch) still triggered all three Vercel projects, and
  they failed with the Free-plan limit "more than 100 deployments per day".** So a pushed `demo/csc-avp` may also
  show red Vercel checks and use deploy attempts. Recording on localhost is not affected. The owner decides
  whether to keep the throwaway branch local only (recommended) or push it.
- `.env*` files are git-ignored (`.env.local`, `.env`, `.env.*`, except `.env.example`). The repo is public.
- Env variable names (values not read): AI service `GOOGLE_API_KEY`, `DATABASE_URL`, `SUPABASE_URL`,
  `SUPABASE_STORAGE_*`, `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, optional `AI_SERVICE_API_KEY`
  (auth is off when unset); mobile PWA `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `RENDER_AI_URL`, `LOCAL_AI_URL`.
- The mobile report page uses `navigator.mediaDevices.getUserMedia` for the camera and has a
  "Ghost Mode (Anonymous)" vs "Civic Mode (Verified)" switch, and an offline queue page.
- **The landing-page incident ledger is hand-written sample data.** `apps/frontend/src/components/
  marketing/sections/hero-section.tsx` defines `SEED_LEDGER`, commented "Curated, plausible Philippine
  environmental case files": IDs RPT-7777 to 7781, "98.4%" style confidence, "Closed in 3h 12m". They
  are merged with real verified records only when the backend returns them. **Never show this ledger,
  its confidence values or its closing times on camera.**
- The only measured model number found earlier (Friday's session) was 0.605 mAP on a general-object
  dataset, not environmental violations. No accuracy figure may appear.
- The repo's own audit (`docs/presentation-reality-check.html`) found the SDG-alignment and "57 tests"
  claims unsupported. They stay out.

Found while preparing this brief, **needs the owner or Lou, treat as urgent:**

- `supabase/seed-demo.sql` is committed to a public repo and sets fixed passwords for the demo
  accounts `analyst@`, `superadmin@` and `citizen@likaslens.ph` (including a super_admin). Whether those
  accounts and passwords exist on the live project was **not tested** (not probed on purpose). If they
  do, anyone who reads the repo can sign in as admin. Rotate or disable them, and do not use them for
  recording. If the fallback in section 6, step 4 is used, create new demo accounts with strong passwords.

Not verified:

- Whether the live AI returns a clean hazard label, law and agency for the staged photo. Earlier check:
  the environmental detection model was not loaded; only a general model plus a garbage detector ran.
- Ghost Mode end to end on the live PWA (the storyboard flagged it unconfirmed).
- Offline queue sync on a real phone (Playwright's offline switch does not fully cover service
  workers, so the real-phone test is still required).
- The official placing. The owner's notes say 4th at the IPOPHL SRT final; one earlier summary said
  2nd. Use the official result sheet.

## 3. Decisions

Answered by the owner on 18 Oct 2026:

| # | Decision | Answer |
| --- | --- | --- |
| D1 | Purpose and length | Short pitch cut, 75 to 90 s, from the existing 7-scene script |
| D2 | Narration | AI voice, English only. No Filipino cut for now |
| D3 | Where to record | Revised 18 Oct: **localhost from a throwaway branch**, Gemini key pulled from Vercel by the owner, fixtures for Supabase. Fallback: a dedicated demo account on the live project |
| D4 | End-card credit | "ISUFST students with Syntaxure Labs" |

Still open:

| # | Decision | Needed for | Default if silent |
| --- | --- | --- | --- |
| D5 | Official placing (4th or 2nd) | Scene 7 | Leave the placing out of the video |
| D6 | Contact line: your email only, or Lou's too | Scene 7 | Owner's email only |
| D7 | Which staged photo (test 3 to 5) | Scene 3 | Pick the one with a stable clean label; log which |
| D8 | The ownership question (Eco Berde Pilipinas Inc. currently owns LikasLens for the Czech SSP application) vs the credit line in D4 | Scene 7, release | Credit line as D4; owner confirms before it is sent outside |
| D9 | Opening footage for scene 1: own photo or CC0 with credit | Scene 1 | Own photo only |

An agent without an answer uses the default, says so at the top of its PR, and carries on. Never guess
facts about the product.

## 4. How this differs from the TeeLine pipeline

| Topic | TeeLine | LikasLens |
| --- | --- | --- |
| App state | Fixed in-memory demo data, resets on refresh | Real apps on localhost. **AI is real** (Gemini, answers can differ per take). **Supabase is faked** with Playwright route fixtures, because no demo mode exists |
| Consequence | One recording pass is repeatable | Record in takes, keep the raw API response for each take, pick the best, and make the narration describe what the screen actually showed |
| Device | Desktop browser, 1920x1080 | **Phone portrait** (mobile PWA) for scenes 2 to 6, admin portal at desktop size for scene 5 |
| Audience | IGCC board, training | Government HR, pitch. Hedged wording is mandatory |
| Length | 5 minutes | 75 to 90 seconds |
| Voice | Kokoro `af_heart` | Same |
| Where it runs | Recording machine or sandbox | **The owner's machine**, because the Gemini key and other secrets must not leave it. Windows has no bash; use Node scripts. ffmpeg may need installing |

Tool stack (same as TeeLine, already tested there): Playwright, ffmpeg, Kokoro (`kokoro-onnx`, Apache-2.0).
No Remotion. No cloud TTS.

### Phone capture, spike first

Playwright's `recordVideo` writes 25 fps VP8 and ignores `deviceScaleFactor`, so a 390x844 viewport
records at 390x844 and looks soft when placed in a 1080p frame. Spike these routes in order and keep the
first that passes the check (text legible at 1080p, no scaling artefacts):

1. Viewport 540x960 recorded natively, scaled 2x in ffmpeg with `lanczos`. Fastest. Likely soft.
2. Viewport 1080x1920 at scale 1 with the PWA forced into its mobile layout (browser zoom 2.77 or a
   `meta viewport` override). May break layout.
3. Screenshot loop at `deviceScaleFactor: 2` (`page.screenshot` every 40 ms into frames, then ffmpeg).
   Crispest, heavier, needs a clock to keep real time.

Acceptance: a frame grab at 1080p where the 11 px label text on the report screen is readable.

### Camera and location

- Camera: launch Chromium with `--use-fake-ui-for-media-stream --use-fake-device-with-video-capture
  --use-file-for-fake-video-capture=<staged.y4m>` (convert the staged photo with ffmpeg). If the report
  page has a gallery upload path, prefer that.
- Location: `context.grantPermissions(['geolocation'])` and `setGeolocation` to a place the owner has
  approved that identifies no private person or business. Ghost Mode snaps to a barangay centroid.

## 5. Layout and branches

Suggested layout in the LikasLens repo (nothing under `apps/` changes):

```
docs/avp/
  AVP_PRODUCTION_BRIEF.md   # this file
demo-video/
  README.md                 # how to rebuild, 10 lines
  steps.json                # scenes: id, app, route, action list, caption, narration, timing
  narration/                # generated from steps.json, never hand-edited
  audio/                    # wav + durations.json, git-ignored
  capture/record.mjs        # Playwright script (phone and desktop contexts)
  capture/overlay.ts        # step chip, caption bar, highlight, tap ring
  capture/takes/            # per take: video, api-responses.json, notes (git-ignored)
  cards/                    # opening card, end card (HTML)
  build/assemble.mjs        # ffmpeg assembly (Node, not bash)
  out/                      # git-ignored
```

- Base branch `development` (the repo has `main`, `staging`, `development`; all level at `537e7dc`).
  Do not push to `main` or `staging`.
- **Two branches, kept apart:**
  - `feat/avp-tooling` (from `development`): `demo-video/` scripts, `steps.json`, cards, README. Touches
    no app code. Normal PR into `development`; the owner merges.
  - `demo/csc-avp` (from `development`): **throwaway, never merged, never deployed. Keep it local; do not push it unless the owner says so.** Holds anything that
    changes how the apps run for the recording (env wiring, fixture hooks, stubbed auth). Delete it after the
    owner approves the video. If a change belongs in the product, port it to a normal branch by a separate
    PR.
- The repo is public. Commit scripts, `steps.json` and cards only. Never commit recordings with
  account details, API keys, tokens, `.env` files or passwords. The demo account password goes in an
  untracked `.env.local`.
- Pin the recorded build: write the deployed commit (`537e7dc` today) into `demo-video/README.md`.
  Re-check it before recording; if the live site moved, say so in the PR.

## 6. Pipeline

1. **Scaffold** `demo-video/` on `feat/avp-tooling`. Check: repo lint and build still pass.
2. **Secrets, handled by the owner.** The owner runs `vercel env pull` (or copies values) into **untracked**
   files: `apps/ai-service/.env`, `apps/mobile-pwa/.env.local`, `apps/admin-portal/.env.local`,
   `apps/frontend/.env.local`. The agent never prints, logs, commits or pastes a secret value, and never
   asks for one in chat. Before every commit run `git status` and `git diff --cached` and confirm no `.env*`
   file or key-like string is staged. Prefer a Gemini key separate from the production one, so recording
   does not use production quota; the owner decides. Set `AI_SERVICE_API_KEY` unset locally.
3. **Start the local stack:** `pnpm install`, `pnpm --filter mobile-pwa dev`, `pnpm --filter admin-portal
   dev`, `pnpm --filter frontend dev`, and the AI service with `cd apps/ai-service && python -m uvicorn
   main:app --reload --host 127.0.0.1 --port 8001`. Check: `GET http://127.0.0.1:8001/health` returns OK,
   Gemini shows as configured, and each app loads.
4. **Spike S1, Supabase fixtures (on `demo/csc-avp`).** Goal: scenes 2 to 6 run on localhost with no write to
   the live Supabase project. Use Playwright `page.route` to serve fixtures for the Supabase REST, auth and
   storage URLs, and an injected fake session. Gate: the report flow, the AI result screen, a ticket in the
   admin portal and the public-record page all render from fixtures. The AI calls stay real. **If a server
   route re-verifies the session with Supabase and the fake session fails, stop and report; do not weaken
   auth in product code.** Fallback: the owner creates one demo citizen and one analyst on the live project
   with new strong passwords (not the seeded ones), the agent records against it, and the demo rows are
   deleted afterwards. The owner must approve the fallback before it is used.
5. **Pick the photo (D7).** Run 3 to 5 staged photos through the real AI path. Log label, law, agency and
   latency in `takes/photo-test.md`. Choose a photo that returns a clean result twice in a row, not a
   fallback message.
6. **Write `steps.json` from section 7.** Narration total at most 165 words. Check: a script prints words per
   scene and total, and warns above 180.
7. **Generate audio first.** Kokoro `af_heart`, one wav per scene, resample to 48 kHz mono, `durations.json`
   from ffprobe. Check: no clipping; speech about 60 to 70 s plus gaps. Kokoro read a 42-word sample at about
   180 wpm; set speed below 1.0 to reach roughly 140 wpm.
8. **Spike S2, phone capture route** (section 4). Output a 5 s test clip for the owner.
9. **Record in takes.** Each scene holds for at least its audio duration plus 0.4 s. Wait on real UI state,
   not blind sleeps. For each take save the video and the AI responses. Check: the final on-screen result
   matches what the narration says.
10. **Overlay layer.** Step chip, caption bar, a highlight on the control being discussed, tap ring. A small
    "Demo data" tag stays on screen for scenes 2 to 6.
11. **Cards.** Opening card (if no scene 1 footage) and end card. HTML captured by Playwright. No external
    fonts or scripts.
12. **Assemble** with ffmpeg through `build/assemble.mjs`: concat, mix voice, burn captions, write `.srt`,
    loudness about -16 LUFS integrated with true peak at or below -1 dBTP, 30 fps, H.264 + AAC,
    `+faststart`. Check: ffprobe duration 75 to 90 s, file under 50 MB.
13. **QA** (section 9) by an agent that did not build it. Then the owner listens to the audio.
14. **Offline.** Playwright's `context.setOffline(true)` is used for the take, but it may not cover the
    service worker, so Lou also runs the real-phone test. If sync fails, cut scene 6.

## 7. Storyboard (7 scenes, from the existing script; verify every label in the running app)

| # | Time | Scene | App and route | Show | Narration (draft, ~165 words total) |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00-0:08 | The problem | none | Own photo of dumping, push-in, then a phone with a thumb over a report button | A citizen sees waste being dumped into a river. Who do they report it to, and will anyone ever answer? |
| 2 | 0:08-0:20 | One photo, Ghost Mode | mobile PWA `report` | Take the photo, location tagged, switch Ghost Mode on, submit | With LikasLens, they take one photo. The location is tagged automatically. And when reporting feels risky, Ghost Mode removes hidden data and keeps the reporter anonymous. |
| 3 | 0:20-0:35 | AI and the law | mobile PWA result | AI analysis, hazard label, law, agency | Our AI reads the photo, then checks Philippine environmental law through a knowledge graph, to name the law that may be violated and the agency that should act. |
| 4 | 0:35-0:46 | Liksi | mobile PWA Liksi | One question in English, answer on screen | Liksi, our assistant, explains the legal side in plain language. |
| 5 | 0:46-1:02 | The LGU side | admin `triage`, `tickets`, `lgu-performance`; public `public-record` | A report as a ticket with a response deadline; the public record page | For local governments, every report becomes a tracked ticket with response deadlines. Late ones escalate. And a public record lets offices show how quickly they resolve them. |
| 6 | 1:02-1:12 | No signal | mobile PWA `offline-queue` | Airplane mode, submit, "1 pending", reconnect, clears | No signal in the field? Reports queue on the phone and send when the connection returns. |
| 7 | 1:12-1:22 | End card | card | Logo, tagline "See it. Route it. Resolve it.", credit, contact | LikasLens, built by students of ISUFST with Syntaxure Labs, so public service can see, route, and respond faster. |

Differences from the older script: scene 4 is English only (D2); scene 7 drops the placing until D5 is
answered; "Delays escape-proof" is replaced with plain wording.

Say only what the recorded screen showed. Hedge: the AI "may" identify a violation; an analyst confirms.

Never show or say: the landing-page ledger (`SEED_LEDGER`) and its confidence or closing times; any
accuracy percentage; SDG alignment; "57 tests"; "blockchain"; any real reporter, address, violator or
agency staff name; seeded account emails; API keys.

## 8. Voice and caption spec

- Plain language, short sentences, 12 to 18 words average. No marketing words.
- Pronunciation list applied before synthesis: "LikasLens" as "Likas Lens", "Liksi" as "Lick-see",
  "IPOPHL" as "I P O P H L", "ISUFST" as "I S U F S T", "Syntaxure" as "Syn-tax-ure". The owner confirms
  each by ear; an agent cannot judge how a name sounds.
- Captions burned in at 40 characters per line, two lines at most, plus the `.srt`.
- The owner listens to the final audio before release.

## 9. QA checklist (independent agent)

- [ ] ffprobe: 1920x1080, 30 fps, H.264 + AAC, 75 to 90 s, under 50 MB.
- [ ] Transcribe the audio with faster-whisper; compare to `steps.json`; flag any mismatch.
- [ ] One frame per scene: the route, "Demo data" tag and caption are visible.
- [ ] Every on-screen result in scenes 2 to 6 appears in that take's saved API responses.
- [ ] `git grep` for key-like strings and `git ls-files` for `.env*` on both branches return nothing.
- [ ] No frame shows the landing-page ledger, a confidence percentage, a real name, address, token,
      email other than the demo and contact address, or a dev banner or `localhost`.
- [ ] No narration claim goes beyond what the screen shows.
- [ ] No empty frame while the voice speaks.
- [ ] Rebuild from a clean clone using only `demo-video/README.md`.
- [ ] Owner has listened to the audio and approved the script.

## 10. Agent lanes (owner's routing)

| Lane | Work | Agent |
| --- | --- | --- |
| A | Scaffold, scripts, `.gitignore`, README | DeepSeek V4 Pro |
| B | `steps.json`, narration wording, fact check against repo and takes | GLM 2.5 |
| C | Capture script, overlay, ffmpeg assembly | MIMO v2.5 Pro |
| D | Opening and end cards, overlay look | Claude Sonnet |
| E | Phone capture spike, timing problems, anything stuck | Kimi 3 |
| F | Small front-end fix if the owner approves one | Flash 3.6 (Antigravity) |

Separate files per lane. Report blockers; do not work around them.

## 11. Timeline (proposed; dates come from the owner's calendar)

| Date | Item |
| --- | --- |
| Mon 19 Oct, noon | Readiness checklist items due (accounts, assets, tests) |
| Mon 19 Oct | Emails and briefer to Vivian |
| Tue 20 Oct | Steps 2 to 9: secrets, local stack, spike S1, photo choice, audio, spike S2, takes |
| Wed 21 Oct | Steps 10 to 14 and QA; the AVP date on the calendar |

If D5 to D9 or the secrets are late, steps 2 to 5 slip and everything after them slips.

## 12. Definition of done

- All files in section 1 exist and pass section 9.
- `demo-video/README.md` rebuilds them from a clean clone.
- A PR from `feat/avp-tooling` into `development` lists the commit recorded, the defaults used for D5 to D9,
  which photo was used and why, which spike route and fixture approach worked, and what was not verified.
- `demo/csc-avp` is deleted after the owner approves the video. If the fallback was used, the demo rows on
  the live project are deleted.
- The owner has confirmed the seeded demo-account passwords (section 2) were rotated or the accounts disabled.
