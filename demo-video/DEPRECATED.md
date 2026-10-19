# DEPRECATED — superseded, do not use for new work

**Status:** deprecated on 2026-10-20.
**Reason:** the CSC AVP shipped. This tooling existed to produce that one video.

The deliverable was `demo-video/out/likaslens-csc-avp.mp4` — 1920x1080, 30fps,
3:36, H.264 + AAC with an embedded `mov_text` subtitle track, plus an SRT and a
poster. It has been delivered, so this directory is no longer an active
deliverable.

## What this means

- **PR #217 (`feat/avp-tooling`) is closed, not merged.** None of this was ever
  merged into `development`, so `development` and `main` carry no AVP tooling and
  nothing needs removing from them.
- This branch is retained as a record. If you are reading it because you want to
  make another video, start from scratch rather than from `steps.json`.

## Why not reuse it

The scene definitions and capture scripts were written against the product as it
stood **before** the security and privacy remediation. Several screens they
recorded have since changed:

- Ghost Mode copy was softened to say what it actually does.
- The report triage panel no longer shows an uncalibrated confidence percentage,
  and now reports "AI Analysis Unavailable" when inference fails instead of
  presenting a clean result.
- The two knowledge-graph pages no longer claim to run live Neo4j queries.
- The knowledge-graph screens no longer call `http://localhost:8001` from the
  browser, so a capture that relied on that request succeeding would behave
  differently.

A re-record must be made against the current UI, and every claim on screen must
be re-verified against the build being filmed.

## If you do make another video

The standing rules from the original brief still apply and are the useful part to
carry forward:

- Never show `SEED_LEDGER` rows, confidence or accuracy percentages, SDG claims,
  "blockchain", the dev banner, or `localhost`.
- Never show real names, addresses or tokens.
- Hedge AI wording: the model *may identify* a concern; an analyst confirms it.
- A scene that cannot be captured is cut, not faked.
