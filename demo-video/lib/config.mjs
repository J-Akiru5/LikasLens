/**
 * Shared configuration for the AVP pipeline.
 *
 * Deliberately tiny and explicit: the deliverable must rebuild from a clean
 * clone, so nothing here may depend on machine-specific state. Anything that
 * could be a secret is read from the environment and never defaulted.
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PATHS = {
  root: ROOT,
  steps: join(ROOT, "steps.json"),
  audio: join(ROOT, "audio"),
  narration: join(ROOT, "narration"),
  cards: join(ROOT, "cards"),
  cardsOut: join(ROOT, "cards", "out"),
  takes: join(ROOT, "capture", "takes"),
  out: join(ROOT, "out"),
  photos: join(ROOT, "assets", "photos"),
  models: join(ROOT, "assets", "models"),
  stub: join(ROOT, "stub"),
};

/** The local surface the video is recorded from. */
export const SERVICES = {
  frontend: process.env.FRONTEND_URL || "http://localhost:3000",
  admin: process.env.ADMIN_URL || "http://localhost:3002",
  mobile: process.env.MOBILE_URL || "http://localhost:3003",
  ai: process.env.AI_URL || "http://127.0.0.1:8001",
  stub: process.env.STUB_URL || "http://127.0.0.1:8002",
};

/**
 * Final video geometry. 1920x1080 at 30 fps, per brief section 1.
 *
 * The phone footage is shot portrait; in the 1080p frame it sits in a
 * centred 608x1080 window with the caption bar beneath it. 608x1080 is exact
 * 16:9-height math (1080 * 9/16 = 607.5 -> 608) so a 1080x1920 phone capture
 * scales by exactly 0.5625 with no fractional resampling.
 */
export const FRAME = { width: 1920, height: 1080, fps: 30 };

export const PHONE = {
  /** Final on-frame size of the phone panel. */
  frame: { width: 608, height: 1080 },
  /** Offsets used by the overlay/assembly stages. */
  x: 656,
  y: 0,
};

/** Loudness target from brief step 12. */
export const AUDIO = {
  sampleRate: 48000,
  channels: 1,
  lufs: -16,
  truePeakDb: -1,
};

/** Fixture account used on camera. Reserved TLD, never a real mailbox. */
export const DEMO_ACCOUNT = {
  citizen: { email: "citizen.avp@likaslens.invalid", password: "local-stub" },
  analyst: { email: "analyst.avp@likaslens.invalid", password: "local-stub" },
};

/** Words per scene ceiling (brief step 6: <=165 total, warn above 180). */
export const NARRATION = { targetMax: 165, warnAbove: 180 };

export const t0 = () => performance.now();
