/**
 * LikasLens Translation Generator
 *
 * Uses Gemini 2.5 Flash to batch-generate translation JSON files from
 * the English source (messages/en.json) into all target locales.
 *
 * Usage:
 *   npx tsx apps/shared/src/i18n/generate.ts [locale]
 *   - No arg: generates all 5 target locales
 *   - With arg: generates single locale (e.g., "fil", "vi")
 *
 * Requires: NEXT_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY env var
 */

import fs from "fs";
import path from "path";

const API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const LOCALE_NAMES: Record<string, string> = {
  fil: "Filipino (Tagalog)",
  vi: "Vietnamese (Tiếng Việt)",
  id: "Bahasa Indonesia",
  ms: "Malay (Bahasa Melayu)",
  ta: "Tamil (தமிழ்)",
};

async function translateJson(
  englishJson: Record<string, unknown>,
  locale: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const localeName = LOCALE_NAMES[locale] || locale;
  const prompt = `You are a professional translator. Translate the following JSON UI strings from English to ${localeName}.

RULES:
1. Output ONLY valid JSON — no markdown, no explanations, no code fences.
2. Preserve ALL keys exactly as they appear.
3. Preserve ALL {placeholders} like {variable} or {{doubleBraces}} exactly as-is.
4. Preserve ALL HTML tags like <span>, <br />, <strong> unchanged.
5. Preserve ALL special characters like &ldquo; &rdquo; &bull; &mdash; unchanged.
6. Do NOT translate proper nouns like "LikasLens", "Likasy", "Ghost Mode", "Civic", or specific product feature names.
7. Keep the tone friendly yet professional, matching the original.
8. The output must be parseable by JSON.parse().

English source JSON:
${JSON.stringify(englishJson, null, 2)}`;

  const res = await fetch(`${API_BASE}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: "You are a professional translator. Output ONLY valid JSON. No explanations." }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        topP: 0.95,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 500)}`);
  }

  const data = await res.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Gemini");

  // Strip markdown code fences if present
  text = text.replace(/^```json?\s*/i, "").replace(/\s*```\s*$/, "");

  let translated: Record<string, unknown>;
  try {
    translated = JSON.parse(text);
  } catch {
    // Try to extract JSON between first { and last }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      translated = JSON.parse(text.slice(start, end + 1));
    } else {
      throw new Error(`Failed to parse Gemini output as JSON. Output starts with: ${text.slice(0, 200)}`);
    }
  }

  return translated;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      target[key] = source[key];
    }
  }
}

async function main() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: Set NEXT_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY env var");
    process.exit(1);
  }

  const messagesDir = path.join(__dirname, "messages");
  const enPath = path.join(messagesDir, "en.json");
  const enJson = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  const targetLocales = process.argv[2]
    ? [process.argv[2]]
    : Object.keys(LOCALE_NAMES);

  for (const locale of targetLocales) {
    if (!LOCALE_NAMES[locale]) {
      console.error(`Unknown locale: ${locale}. Available: ${Object.keys(LOCALE_NAMES).join(", ")}`);
      continue;
    }

    console.log(`\n🌐 Translating to ${LOCALE_NAMES[locale]} (${locale})...`);
    const outPath = path.join(messagesDir, `${locale}.json`);

    try {
      // Load existing translation if any (for incremental updates)
      let existing: Record<string, unknown> = {};
      if (fs.existsSync(outPath)) {
        existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
      }

      const translated = await translateJson(enJson, locale, apiKey);

      // Merge with existing to preserve any manual corrections
      if (Object.keys(existing).length > 0) {
        deepMerge(translated, existing);
      }

      fs.writeFileSync(outPath, JSON.stringify(translated, null, 2) + "\n");
      console.log(`✅ Written ${outPath}`);
    } catch (err) {
      console.error(`❌ Failed for ${locale}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\n🎉 Done!");
}

main().catch(console.error);
