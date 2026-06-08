#!/usr/bin/env node
/**
 * LikasLens Integration Health Check
 * Pings all local services and reports pass/fail with clean log output.
 *
 * Usage:
 *   node scripts/integration-check.mjs
 *   node scripts/integration-check.mjs --json          (machine-readable)
 *   node scripts/integration-check.mjs --frontend=http://localhost:3000 --backend=http://localhost:8000 --ai=http://localhost:8001
 *
 * ENV overrides:
 *   FRONTEND_URL  Backend URL       AI_SERVICE_URL
 */

const TEST_USER_ID = "integration-test-" + Date.now();

const config = parseArgs(process.argv.slice(2));

const checks = [
  {
    name: "frontend",
    label: "Frontend (Next.js)",
    url: config.frontend,
    method: "GET",
    validate(res) {
      return res.ok;
    },
    errorHint(msg) {
      return `Frontend not reachable. Is "pnpm --filter frontend dev" running?`;
    },
  },
  {
    name: "backend-health",
    label: "Backend Health (Laravel)",
    url: `${config.backend}/api/health`,
    method: "GET",
    validate(res, body) {
      return res.ok && body?.status === "ok";
    },
    errorHint(msg) {
      return `Backend health endpoint failed. Is "cd apps/backend && php artisan serve" running?`;
    },
  },
  {
    name: "backend-up",
    label: "Backend /up (Laravel built-in)",
    url: `${config.backend}/up`,
    method: "GET",
    validate(res) {
      return res.ok;
    },
    errorHint(msg) {
      return `Laravel /up endpoint failed. Check bootstrap/app.php health route.`;
    },
  },
  {
    name: "ai-health",
    label: "AI Service (FastAPI)",
    url: `${config.aiService}/health`,
    method: "GET",
    validate(res, body) {
      return res.ok && body?.status === "ok";
    },
    errorHint(msg) {
      return `AI service unreachable. Is "cd apps/ai-service && uvicorn main:app --reload --port 8001" running?`;
    },
  },
  {
    name: "ai-docs",
    label: "AI Service /docs (OpenAPI)",
    url: `${config.aiService}/docs`,
    method: "GET",
    validate(res) {
      return res.ok;
    },
    errorHint(msg) {
      return `AI service Swagger UI not responding (non-critical).`;
    },
    critical: false,
  },
];

const results = [];

async function runChecks() {
  if (!config.json) {
    console.log("\n🔍 LikasLens Integration Health Check");
    console.log("═══════════════════════════════════════");
    console.log(`  Frontend  → ${config.frontend}`);
    console.log(`  Backend   → ${config.backend}`);
    console.log(`  AI Service → ${config.aiService}`);
    console.log("═══════════════════════════════════════\n");
  }

  for (const check of checks) {
    const result = { name: check.name, label: check.label, critical: check.critical !== false };
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeout);

      const res = await fetch(check.url, {
        method: check.method,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let body = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        body = await res.json();
      } else {
        body = await res.text().then((t) => t.slice(0, 200));
      }

      const duration = Math.round(performance.now() - start);
      result.statusCode = res.status;
      result.durationMs = duration;

      if (check.validate(res, body)) {
        result.pass = true;
      } else {
        result.pass = false;
        result.error = `Unexpected response (status=${res.status}, body=${JSON.stringify(body).slice(0, 200)})`;
      }
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      result.pass = false;
      result.durationMs = duration;
      result.error = err.cause?.code === "ECONNREFUSED"
        ? "Connection refused - service not running"
        : err.message;
      result.hint = check.errorHint(result.error);
    }

    results.push(result);
  }

  printResults();
  return exitCode();
}

function printResults() {
  if (config.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  for (const r of results) {
    const icon = r.pass ? "✅" : "❌";
    const timeStr = r.durationMs != null ? ` (${r.durationMs}ms)` : "";
    console.log(`  ${icon} ${r.label}${timeStr}`);

    if (!r.pass) {
      console.log(`     ↳ ${r.error}`);
      if (r.hint) console.log(`     ↳ ${r.hint}`);
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const criticalFailed = results.filter((r) => r.critical && !r.pass).length;

  console.log(`\n═══════════════════════════════════════`);
  if (passed === total) {
    console.log("✅ All services healthy\n");
  } else if (criticalFailed > 0) {
    console.log(`❌ ${criticalFailed} critical service(s) down — ${passed}/${total} checks passed\n`);
  } else {
    console.log(`⚠️  ${total - passed} non-critical check(s) failed — ${passed}/${total} checks passed\n`);
  }

  // Print quick-start hints
  if (criticalFailed > 0) {
    console.log("Quick start all services:");
    console.log("  pnpm dev\n");
  }
}

function exitCode() {
  return results.some((r) => r.critical && !r.pass) ? 1 : 0;
}

function parseArgs(argv) {
  const cfg = {
    frontend: process.env.FRONTEND_URL || "http://localhost:3000",
    backend: process.env.BACKEND_URL || "http://localhost:8000",
    aiService: process.env.AI_SERVICE_URL || "http://localhost:8001",
    timeout: 10_000,
    json: false,
  };

  for (const arg of argv) {
    if (arg === "--json") cfg.json = true;
    else if (arg.startsWith("--frontend=")) cfg.frontend = arg.split("=")[1];
    else if (arg.startsWith("--backend=")) cfg.backend = arg.split("=")[1];
    else if (arg.startsWith("--ai=")) cfg.aiService = arg.split("=")[1];
    else if (arg.startsWith("--timeout=")) cfg.timeout = parseInt(arg.split("=")[1], 10);
  }

  return cfg;
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
runChecks().then((code) => process.exit(code));
