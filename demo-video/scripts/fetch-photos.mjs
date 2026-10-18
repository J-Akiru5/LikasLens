#!/usr/bin/env node
/**
 * Fetch the staged photos listed in assets/photos/sources.json.
 *
 * The images are deliberately NOT committed: the repository is public, the
 * repository should stay small, and every candidate is a verbatim Wikimedia
 * Commons file that can be re-fetched. Licences and attribution requirements
 * live next to the URLs in sources.json.
 *
 * Wikimedia rate-limits hard. This script spaces requests out, sends a
 * descriptive User-Agent (Wikimedia policy), and retries with backoff.
 *
 * Usage: node scripts/fetch-photos.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = join(HERE, "..", "assets", "photos");
const SOURCES = join(PHOTO_DIR, "sources.json");

const USER_AGENT =
  "LikasLens-AVP/1.0 (local demo video; https://github.com/J-Akiru5/LikasLens; admin@syntaxure.dev)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(PHOTO_DIR, { recursive: true });
const sources = JSON.parse(readFileSync(SOURCES, "utf8"));

let failed = 0;

for (const c of sources.candidates) {
  const out = join(PHOTO_DIR, c.file);
  if (existsSync(out)) {
    console.log(`skip    ${c.file} (already present)`);
    continue;
  }

  let ok = false;
  for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
    try {
      const res = await fetch(c.download, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 429) throw new Error("429 rate limited");
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1024) throw new Error(`suspiciously small (${buf.length} bytes)`);
      writeFileSync(out, buf);
      console.log(`ok      ${c.file}  ${(buf.length / 1024).toFixed(0)} KB  ${c.license}`);
      ok = true;
    } catch (err) {
      const wait = attempt * 15000;
      console.log(`retry   ${c.file}  attempt ${attempt}/4 failed: ${err.message} — waiting ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  if (!ok) {
    failed++;
    console.error(`FAILED  ${c.file} — see ${c.source_page}`);
  }
  await sleep(4000); // be polite between files
}

console.log(failed ? `\n${failed} photo(s) failed to download.` : "\nAll photos present.");
process.exit(failed ? 1 : 0);
