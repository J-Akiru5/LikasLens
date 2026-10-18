# demo-video — LikasLens CSC AVP

Builds `likaslens-csc-avp.mp4`: a 75–90 second narrated screen recording of the
real LikasLens apps, captured on localhost. 1920x1080, 30 fps, H.264 + AAC,
under 50 MB so it emails cleanly.

**Recorded commit:** `537e7dcb`. Re-check this before recording — if `development`
has moved, the screens may not match the script.

Read `steps.json` first. It is the script: every scene's route, actions, caption
and narration, with measured timings. Nothing else in this folder is
hand-authored.

---

## 1. What this is and is not

- It **touches no app code**. The folder is deliberately outside the pnpm
  workspace (`pnpm-workspace.yaml` lists only `apps/*`), so these scripts can
  never enter an app's dependency graph and can never be deployed. Install with
  `pnpm install --ignore-workspace` from inside `demo-video/`.
- It **does not modify the apps' source**. The apps run exactly as committed.
- It **cannot reach the live Supabase project**. See section 4.

## 2. Prerequisites

| Need | Check | Notes |
| --- | --- | --- |
| Node 18+ | `node --version` | built and tested on v24 |
| pnpm | `pnpm --version` | this repo is pnpm-only |
| Python 3.12 | `python --version` | for the AI service and Kokoro |
| ffmpeg 6+ with libx264 | see below | **not on PATH after a WinGet install** |

### ffmpeg

`winget install Gyan.FFmpeg` installs to
`%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe`, which is often **not** on a
freshly spawned shell's PATH. `lib/ffmpeg.mjs` resolves it in this order:
`FFMPEG_PATH`/`FFPROBE_PATH` env override → PATH → the WinGet Links folder →
the WinGet package folder → Playwright's bundled build (last resort; it has no
libx264 and cannot produce the deliverable). To be explicit:

```powershell
$env:FFMPEG_PATH = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
$env:FFPROBE_PATH = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffprobe.exe"
```

Note: `ffmpeg -vf drawtext` **does not work** on the Gyan build — it fails with
"Cannot load default config file" (no fontconfig). Every glyph in this video is
therefore rasterised by Chromium, not by ffmpeg. Do not add drawtext.

### Python environments

```powershell
# Kokoro TTS (narration). Local only - there is no cloud TTS anywhere.
python -m venv demo-video/.venv
demo-video/.venv/Scripts/python -m pip install kokoro-onnx soundfile numpy

# AI service
python -m venv apps/ai-service/.venv
apps/ai-service/.venv/Scripts/python -m pip install -r apps/ai-service/requirements.txt
```

Then fetch the Kokoro model weights (~337 MB, git-ignored):

```powershell
$base = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
Invoke-WebRequest "$base/kokoro-v1.0.onnx" -OutFile demo-video/assets/models/kokoro-v1.0.onnx
Invoke-WebRequest "$base/voices-v1.0.bin"  -OutFile demo-video/assets/models/voices-v1.0.bin
```

## 3. Environment files — the owner's job, never the agent's

Four untracked files. **No secret value may ever be printed, logged, committed or
pasted into a chat.** The repository is public.

| File | Needs |
| --- | --- |
| `apps/ai-service/.env` | `GOOGLE_API_KEY`, and `NEO4J_*` only if you need `/api/v1/analyze-hazard` |
| `apps/mobile-pwa/.env.local` | Supabase URL + anon key (values are irrelevant — see section 4) |
| `apps/admin-portal/.env.local` | same, plus `SUPABASE_SERVICE_ROLE_KEY` for its server routes |
| `apps/frontend/.env.local` | same |

`vercel env pull` **cannot retrieve** most of these: values marked *Sensitive* in
Vercel come back as empty strings, which is what happened to `GOOGLE_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` and `AI_SERVICE_API_KEY`. The owner supplies them
directly.

For the local recording stack the app env files must point at the stub:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:8002
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-stub-anon-key
RENDER_AI_URL=              # blank, so the apps use LOCAL_AI_URL
LOCAL_AI_URL=http://127.0.0.1:8001
```

## 4. Why a local Supabase stub, and the safety property

The production brief said to fake Supabase with Playwright `page.route`. **That
cannot work here.** `page.route` only sees the browser, but both apps re-verify
the session in the Next.js *server*:

- `apps/mobile-pwa/src/proxy.ts:74`
- `apps/admin-portal/src/proxy.ts:51`

…so the middleware redirects every protected route to `/login`. Two further
paths are server-side and equally unreachable by `page.route`: the app's own
`/api/v1/ai/reports` route → FastAPI → **service-role** Supabase write, and the
admin route handlers.

`stub/supabase-stub.mjs` therefore implements enough of the Supabase wire
protocol (auth, a PostgREST subset including RPC, and storage) that **both** the
browser and the Next server can talk to it. The real apps run unmodified.

Two independent guards keep the live project untouched:

1. The stub is the only Supabase the apps can reach. It makes no outbound
   request and contains no real data — fixtures only, all accounts on the
   reserved `.invalid` TLD.
2. The local AI service is started with `DATABASE_URL`, `SUPABASE_STORAGE_*` and
   `AI_SERVICE_API_KEY` **blanked in the process environment**, so
   `POST /api/v1/reports` fails closed instead of persisting. Confirm with:

   ```
   GET http://127.0.0.1:8001/health/config   ->   database: "missing: DATABASE_URL"
   ```

   The recorder additionally intercepts `POST /api/v1/ai/reports` at the browser
   boundary and answers it from a fixture, so the server-side write path is
   never entered. **No scene submits a report.**

## 5. Run it

```powershell
# 1. install
pnpm install --ignore-workspace        # from demo-video/
node scripts/fetch-photos.mjs          # staged photos (CC0; not committed)

# 2. start the stack (4 terminals)
node stub/supabase-stub.mjs --port 8002
pnpm --filter mobile-pwa dev           # :3003
pnpm --filter admin-portal dev         # :3002
pnpm --filter frontend dev             # :3000
# AI service, with the live-write paths disabled:
$env:DATABASE_URL=""; $env:SUPABASE_STORAGE_URL=""; $env:SUPABASE_STORAGE_KEY=""
$env:SUPABASE_STORAGE_SECRET=""; $env:AI_SERVICE_API_KEY=""
cd ../../apps/ai-service; .\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001

# 3. build the fake camera source from the chosen photo
node scripts/make-y4m.mjs assets/photos/marilao-03.jpg --seconds 4

# 4. narration BEFORE recording (each scene must hold for its audio + 0.4s)
node narration/word-count.mjs --strict
node narration/synthesize.mjs

# 5. record. Re-record a single scene as often as you like.
node capture/record.mjs
node capture/record.mjs --scene s3

# 6. text layer, then assemble
node capture/frame-overlay.mjs
node build/assemble.mjs

# 7. deliverable checks
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,avg_frame_rate,codec_name out/likaslens-csc-avp.mp4
```

`assemble.mjs` exits non-zero if any of its checks fail: 1920x1080, exactly
30 fps, H.264 + AAC, 75–90 s, under 50 MB.

### Useful passes

```powershell
node scripts/probe-detection.mjs     # every candidate photo through the real model, with the raw scores
node scripts/photo-test.mjs --runs 2 # D7 photo test, writes capture/takes/photo-test/photo-test.md
node capture/spike-s1.mjs            # proves the fixture stack and that no supabase.co host is contacted
node capture/spike-s2.mjs            # proves the phone-capture route and emits a 5 s test clip
```

## 6. How capture works

- **Phone scenes** are captured at a 540x960 viewport with Chromium's
  `--force-device-scale-factor=2` and `recordVideo` at 1080x1920, then scaled by
  0.563 into a 608x1080 panel. `recordVideo` ignores the context deviceScaleFactor
  — a larger `recordVideo` size alone is only an upscale — but the
  `--force-device-scale-factor` flag does reach the encoder, which is what makes
  the app's 11 px labels readable at 1080p.
- **The camera is faked** with `--use-file-for-fake-video-capture=<clip.y4m>`,
  built by `scripts/make-y4m.mjs` from the chosen staged photo. The brief lists
  `--use-fake-device-with-video-capture`, which is **not a Chromium flag** — with
  it `getUserMedia` finds no video track at all.
- **In-points.** Each take records generously and reports `inPointMs`, the moment
  the scene really begins, so logins and cold compiles are trimmed at assembly.
  Scenes 3 and 4 wait for the real AI answer before marking their in-point,
  because the real triage call takes 10–20 s here — longer than the scene.
- **The dev badge** is hidden by injected CSS (`nextjs-portal { display: none }`).
  No app config is changed.
- **Scenes are resolved per scene** from the newest take that did not fail, so
  one scene can be re-recorded without redoing the rest.

## 7. Layout

1920x1080. Phone scenes put the 608x1080 phone on the right (magnified 1.126x so
the app's small labels stay readable) with a text panel on the left. Scenes whose
footage already fills the frame (the photo push-in, and the desktop app scenes)
get a lower third instead, so the app is never dimmed under a haze. Two shapes,
both in `capture/frame-overlay.mjs`.

## 8. What is not committed

`.gitignore` excludes `out/`, `capture/takes/`, `audio/`, `cards/out/`,
`assets/models/`, `assets/photos/*` and `.venv/`. Recordings and takes can
contain account details and raw API output, and the repository is public. Photo
provenance and licences live in `assets/photos/sources.json`; the binaries are
re-fetchable with `scripts/fetch-photos.mjs`.

## 9. Known gaps

- **Scene 6 (offline queue) is cut.** The page never left its loading state under
  this fixture stack — `getAllQueued()` did not resolve — so it could not be shown
  honestly. Brief step 14 permits the cut. Its 7 s was redistributed; the
  timeline is still 81 s. A real-phone test is still outstanding.
- **No knowledge-graph law lookup.** `POST /api/v1/analyze-hazard` needs Neo4j and
  the instance configured in `apps/ai-service/.env` no longer resolves. Scene 3
  shows the real triage result only, and the narration makes no graph claim.
- **Total speech is 55.7 s**, a little under the brief's 60–70 s guidance, because
  cutting scene 6 removed 5.8 s of narration that was not replaced with claims
  the screens do not support.
