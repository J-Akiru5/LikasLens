#!/usr/bin/env node
/**
 * LikasLens Auth Flow Integration Test
 * Simulates the full Supabase Auth → Laravel Sync → Sanctum Token pipeline.
 *
 * Flow:
 *  1. [SIMULATED] Supabase Auth returns user identity (supabase_auth_user_id + email)
 *  2. POST /api/auth/sync  → Laravel creates/updates user, returns Sanctum token
 *  3. GET  /api/user/profile → Verifies token is valid, returns user profile
 *
 * Usage:
 *   node scripts/auth-flow-test.mjs
 *   node scripts/auth-flow-test.mjs --backend=http://localhost:8000
 *   node scripts/auth-flow-test.mjs --new-user     (force fresh supabase ID)
 *   node scripts/auth-flow-test.mjs --json
 *
 * ENV:  BACKEND_URL  (default: http://localhost:8000)
 */

import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const config = {
  backendUrl: process.env.BACKEND_URL || "http://localhost:8000",
  json: false,
  forceNew: false,
  timeoutMs: 15_000,
};

for (const arg of args) {
  if (arg === "--json") config.json = true;
  else if (arg === "--new-user") config.forceNew = true;
  else if (arg.startsWith("--backend=")) config.backendUrl = arg.split("=")[1];
}

// Keep same supabase ID across runs (reusable user) unless --new-user is passed.
// In production, this comes from Supabase's `user.id` after OAuth/email login.
const SUPABASE_USER_ID = config.forceNew
  ? randomUUID()
  : process.env.SUPABASE_TEST_USER_ID || "test-supabase-id-001";

const TEST_EMAIL = process.env.SUPABASE_TEST_EMAIL || "integration-test@likaslens.dev";
const TEST_NAME = "Integration Tester";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(step, msg) {
  if (config.json) return;
  const pad = " ".repeat(Math.max(0, 3 - String(step).length));
  console.log(` [${step}]${pad} ${msg}`);
}

function ok(step, msg) {
  if (config.json) return;
  console.log(` [${step}]   ✅ ${msg}`);
}

function fail(step, msg) {
  if (config.json) return;
  console.log(` [${step}]   ❌ ${msg}`);
}

function json(result) {
  if (config.json) {
    console.log(JSON.stringify(result, null, 2));
  }
}

/**
 * Simulates what Supabase returns after a successful authentication.
 * In production this is `supabase.auth.getUser()` or `supabase.auth.signIn()`.
 */
function simulateSupabaseAuth() {
  return {
    supabase_auth_user_id: SUPABASE_USER_ID,
    email: TEST_EMAIL,
    name: TEST_NAME,
    role: "citizen",
    // Supabase also provides: id, aud, app_metadata, user_metadata, created_at, etc.
    // We only forward what the /api/auth/sync endpoint expects.
  };
}

// ---------------------------------------------------------------------------
// Step 1: Simulate Supabase Auth
// ---------------------------------------------------------------------------
async function step1_supabaseAuth() {
  const user = simulateSupabaseAuth();

  if (!config.json) {
    console.log("═══════════════════════════════════════════");
    console.log("  Auth Flow Integration Test");
    console.log("═══════════════════════════════════════════");
    console.log(`  Backend → ${config.backendUrl}`);
    console.log(`  Supabase ID → ${SUPABASE_USER_ID}`);
    console.log("═══════════════════════════════════════════\n");
    console.log("─── Flow: Supabase Auth → /api/auth/sync → Sanctum Token ───\n");
  }

  log(1, "Simulate Supabase Auth (user authenticated)");
  ok(1, `Identity resolved: ${user.email} (supabase_id=${user.supabase_auth_user_id.slice(0, 8)}...)`);
  return user;
}

// ---------------------------------------------------------------------------
// Step 2: POST /api/auth/sync → Sanctum Token
// ---------------------------------------------------------------------------
async function step2_syncWithBackend(supabaseUser) {
  log(2, `POST ${config.backendUrl}/api/auth/sync`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  let res;
  try {
    res = await fetch(`${config.backendUrl}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        supabase_auth_user_id: supabaseUser.supabase_auth_user_id,
        email: supabaseUser.email,
        name: supabaseUser.name,
        role: supabaseUser.role,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    fail(2, `Connection failed: ${err.message}`);
    return { error: `Backend unreachable: ${err.message}`, token: null, user: null };
  }
  clearTimeout(timeout);

  let body;
  try {
    body = await res.json();
  } catch {
    const text = await res.text();
    fail(2, `Invalid JSON response (status=${res.status}): ${text.slice(0, 200)}`);
    return { error: "Invalid JSON in response", token: null, user: null };
  }

  if (!res.ok || !body?.success) {
    fail(2, `Sync rejected: ${body?.message || `HTTP ${res.status}`}`);
    const detail = JSON.stringify(body).slice(0, 300);
    console.log(`      ↳ Response: ${detail}`);
    return { error: body?.message || `HTTP ${res.status}`, token: null, user: null };
  }

  const token = body?.data?.token;
  const user = body?.data?.user;

  if (!token) {
    fail(2, "Sanctum token missing in response");
    console.log(`      ↳ Response keys: ${Object.keys(body.data || {}).join(", ")}`);
    return { error: "Token missing in response body", token: null, user: null };
  }

  ok(2, `Sync successful — Sanctum token issued (${token.slice(0, 12)}...)`);
  ok(2, `Laravel user: id=${user.id}  role=${user.role}  email=${user.email}`);
  return { error: null, token, user };
}

// ---------------------------------------------------------------------------
// Step 3: GET /api/user/profile (token verification)
// ---------------------------------------------------------------------------
async function step3_verifyToken(token) {
  log(3, `GET ${config.backendUrl}/api/user/profile  (Bearer auth)`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  let res;
  try {
    res = await fetch(`${config.backendUrl}/api/user/profile`, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    fail(3, `Request failed: ${err.message}`);
    return { error: err.message, profile: null };
  }
  clearTimeout(timeout);

  let body;
  try {
    body = await res.json();
  } catch {
    const text = await res.text();
    fail(3, `Invalid JSON (status=${res.status}): ${text.slice(0, 200)}`);
    return { error: "Invalid JSON", profile: null };
  }

  if (res.status === 401) {
    fail(3, "Token rejected — Sanctum auth middleware returned 401");
    console.log(`      ↳ Check: HasApiTokens trait, cors.php allowed origins, sanctum.php stateful domains`);
    return { error: "Sanctum 401 — token not accepted", profile: null };
  }

  if (!res.ok || !body?.success) {
    fail(3, `Profile fetch failed: ${body?.message || `HTTP ${res.status}`}`);
    return { error: body?.message || `HTTP ${res.status}`, profile: null };
  }

  const profile = body.data;
  ok(3, `Token verified — profile returned for ${profile.name} (role=${profile.role})`);
  ok(3, `Trust score: ${profile.trust_score}  |  Reward points: ${profile.reward_points_balance}`);
  return { error: null, profile };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (config.json) {
    const result = { steps: {} };
    const supabaseUser = simulateSupabaseAuth();

    const syncResult = await step2_syncWithBackend(supabaseUser);
    result.steps.sync = syncResult.error
      ? { pass: false, error: syncResult.error }
      : { pass: true, userId: syncResult.user?.id };

    if (syncResult.token) {
      const profileResult = await step3_verifyToken(syncResult.token);
      result.steps.profile = profileResult.error
        ? { pass: false, error: profileResult.error }
        : { pass: true, profile: profileResult.profile };
    } else {
      result.steps.profile = { pass: false, error: "Skipped — no token from sync step" };
    }

    result.overall = Object.values(result.steps).every((s) => s.pass);
    json(result);
    process.exit(result.overall ? 0 : 1);
  }

  // ── Human-readable mode ──
  const supabaseUser = await step1_supabaseAuth();

  const syncResult = await step2_syncWithBackend(supabaseUser);
  if (syncResult.error) {
    conclude(false, syncResult.error);
    return;
  }

  const profileResult = await step3_verifyToken(syncResult.token);
  if (profileResult.error) {
    conclude(false, profileResult.error);
    return;
  }

  conclude(true, null);
}

function conclude(passed, error) {
  if (!config.json) {
    console.log("\n═══════════════════════════════════════════");
    if (passed) {
      console.log("✅ Auth flow complete — all steps passed");
      console.log("   Supabase Auth → /api/auth/sync → Sanctum Token → /api/user/profile");
    } else {
      console.log(`❌ Auth flow broken at: ${error}`);
    }

    console.log("\nDebug checklist:");
    console.log("  • Is the backend running?          →  php artisan serve --port=8000");
    console.log("  • Has run migrations?              →  php artisan migrate");
    console.log("  • Is Sanctum configured?           →  config/sanctum.php (stateful domains)");
    console.log("  • Is CORS allowing credentials?     →  config/cors.php");
    console.log("  • User model has HasApiTokens?     →  app/Models/User.php");
    console.log("");
  }
  process.exit(passed ? 0 : 1);
}

main();
