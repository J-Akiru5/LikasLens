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
 * Layout decision: the phone sits on the RIGHT at full height, 608x1080, and
 * the text column sits on the LEFT. The phone is magnified 1.126x from its
 * 540x960 CSS viewport, which is what keeps the app's 11px labels readable at
 * 1080p — the brief's acceptance test. Captions get a 960px-wide column rather
 * than being squeezed into the phone, and they are rendered by the browser,
 * because `ffmpeg -vf drawtext` is unavailable on this build (no fontconfig).
 */
export const FRAME = { width: 1920, height: 1080, fps: 30 };

export const PHONE = {
  /** Final on-frame size of the phone panel. */
  frame: { width: 608, height: 1080 },
  /** Top-left offset inside the 1920x1080 frame. */
  x: 1232,
  y: 0,
};

/** Left text column for the step chip and the burned-in caption. */
export const TEXT_COLUMN = { x: 96, width: 1000 };

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
