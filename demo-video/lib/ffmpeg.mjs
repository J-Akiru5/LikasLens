/**
 * Resolve ffmpeg/ffprobe without assuming they are on PATH.
 *
 * The recording machine is Windows and `ffmpeg` is often installed by WinGet
 * but absent from the PATH of a freshly spawned shell. Order:
 *   1. FFMPEG_PATH / FFPROBE_PATH environment override
 *   2. PATH
 *   3. WinGet Links (where Gyan.FFmpeg puts its shims)
 *   4. WinGet package dir
 *   5. Playwright's private build (LAST RESORT - it is a stripped recorder
 *      binary with no libx264, so it cannot produce the deliverable)
 *
 * Throws a clear, actionable error rather than silently degrading.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function works(bin, args = ["-version"]) {
  try {
    const r = spawnSync(bin, args, { encoding: "utf8", shell: false, timeout: 20000 });
    return r.status === 0;
  } catch {
    return false;
  }
}

function candidates(name) {
  const exe = `${name}.exe`;
  const list = [];
  if (process.env[`${name.toUpperCase()}_PATH`]) list.push(process.env[`${name.toUpperCase()}_PATH`]);
  list.push(exe, name); // PATH

  const local = process.env.LOCALAPPDATA || "";
  if (local) {
    list.push(join(local, "Microsoft", "WinGet", "Links", exe));
    const pkgRoot = join(local, "Microsoft", "WinGet", "Packages");
    if (existsSync(pkgRoot)) {
      for (const d of readdirSync(pkgRoot)) {
        if (!/ffmpeg/i.test(d)) continue;
        const base = join(pkgRoot, d);
        for (const sub of readdirSync(base)) {
          const p = join(base, sub, "bin", exe);
          if (existsSync(p)) list.push(p);
        }
      }
    }
    const ms = join(local, "ms-playwright");
    if (existsSync(ms)) {
      for (const d of readdirSync(ms)) {
        if (!/^ffmpeg/.test(d)) continue;
        for (const f of readdirSync(join(ms, d))) {
          if (f === exe) list.push(join(ms, d, f));
        }
      }
    }
  }
  return list;
}

export function resolveBinary(name) {
  const tried = [];
  for (const c of candidates(name)) {
    tried.push(c);
    if (works(c)) return c;
  }
  throw new Error(
    `${name} not found. Install it (winget install Gyan.FFmpeg) or set ` +
      `${name.toUpperCase()}_PATH.\nTried:\n  ` +
      tried.join("\n  "),
  );
}

let ffmpegCache = null;
let ffprobeCache = null;

export const ffmpeg = () => (ffmpegCache ??= resolveBinary("ffmpeg"));
export const ffprobe = () => (ffprobeCache ??= resolveBinary("ffprobe"));

/** Run ffmpeg and throw with the tail of stderr if it fails. */
export function runFfmpeg(args, { label = "ffmpeg", inherit = false } = {}) {
  const r = spawnSync(ffmpeg(), args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...(inherit ? { stdio: "inherit" } : {}),
  });
  if (r.status !== 0) {
    const tail = (r.stderr || "").split("\n").slice(-25).join("\n");
    throw new Error(`${label} failed (exit ${r.status}):\n${tail}`);
  }
  return r;
}

/** Probe a media file and return the parsed JSON. */
export function probe(file) {
  const r = spawnSync(
    ffprobe(),
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed for ${file}: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

/** Duration in seconds, or null. */
export function durationOf(file) {
  try {
    return Number(probe(file).format.duration);
  } catch {
    return null;
  }
}
