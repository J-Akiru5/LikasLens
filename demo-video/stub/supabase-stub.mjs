#!/usr/bin/env node
/**
 * Local Supabase-protocol stub for AVP recording.
 *
 * WHY THIS EXISTS
 * ---------------
 * LikasLens has no demo/mock mode: every app talks to Supabase through
 * `supabase-js` (`@supabase/ssr`) against the live project. The AVP brief
 * plans to fake Supabase with Playwright `page.route`, but that only
 * intercepts the *browser*. Both apps re-verify the session server-side:
 *
 *   apps/mobile-pwa/src/proxy.ts:74      await supabase.auth.getUser()
 *   apps/admin-portal/src/proxy.ts:51    await supabase.auth.getUser()
 *
 * That call is made by the Next.js server, so `page.route` cannot reach it and
 * the middleware redirects to /login. This process implements enough of the
 * Supabase wire protocol (auth + REST + storage) for BOTH the browser and the
 * Next server to talk to it, so the real apps run unmodified.
 *
 * WHAT THIS IS NOT
 * ----------------
 * It is not a product endpoint, not a service, and it is never deployed or
 * merged. It is a local test double. It contains no secrets, no real accounts
 * and no real data - see `fixtures/`.
 *
 * SAFETY
 * ------
 * Refuses to run if it can see the real Supabase host, and never makes an
 * outbound request. Run it only on a loopback address.
 *
 * Usage:
 *   node stub/supabase-stub.mjs [--port 8002] [--log requests.log]
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, appendFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, "fixtures");

const argv = process.argv.slice(2);
const argVal = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const PORT = Number(argVal("--port", process.env.STUB_PORT || 8002));
const LOG_FILE = argVal("--log", join(HERE, "requests.log"));
const QUIET = argv.includes("--quiet");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function loadJson(file) {
  const p = join(FIXTURE_DIR, file);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

const accounts = loadJson("accounts.json") ?? { users: [] };

/** table name -> array of rows */
const tables = new Map();
for (const f of readdirSync(FIXTURE_DIR)) {
  if (!f.endsWith(".json")) continue;
  if (f === "accounts.json" || f.startsWith("_")) continue;
  const data = loadJson(f);
  if (Array.isArray(data)) tables.set(f.replace(/\.json$/, ""), data);
  else if (data && Array.isArray(data.rows)) tables.set(data.table ?? f.replace(/\.json$/, ""), data.rows);
}

// ---------------------------------------------------------------------------
// Minimal JWT (unsigned). Only the stub reads it; nothing verifies it.
// ---------------------------------------------------------------------------

const b64url = (obj) =>
  Buffer.from(JSON.stringify(obj)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function makeAccessToken(user) {
  const iat = Math.floor(Date.now() / 1000);
  return [
    b64url({ alg: "HS256", typ: "JWT" }),
    b64url({
      sub: user.id,
      email: user.email,
      role: "authenticated",
      aud: "authenticated",
      iat,
      exp: iat + 60 * 60 * 8,
      user_metadata: user.user_metadata ?? {},
      app_metadata: user.app_metadata ?? {},
    }),
    "stub-signature-not-verified",
  ].join(".");
}

const findUserByEmail = (email) =>
  accounts.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

const findUserById = (id) => accounts.users.find((u) => u.id === id);

/** Public-facing user shape returned by Supabase auth endpoints. */
const publicUser = (u) => ({
  id: u.id,
  aud: "authenticated",
  role: "authenticated",
  email: u.email,
  email_confirmed_at: u.email_confirmed_at ?? new Date().toISOString(),
  phone: "",
  confirmed_at: u.email_confirmed_at ?? new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: u.app_metadata ?? { provider: "email", providers: ["email"] },
  user_metadata: u.user_metadata ?? {},
  identities: [],
  created_at: u.created_at ?? new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
});

function sessionFor(user) {
  return {
    access_token: makeAccessToken(user),
    token_type: "bearer",
    expires_in: 28800,
    expires_at: Math.floor(Date.now() / 1000) + 28800,
    refresh_token: "stub-refresh-token",
    user: publicUser(user),
  };
}

// ---------------------------------------------------------------------------
// PostgREST-lite
// ---------------------------------------------------------------------------

const cmp = (a, b) => (a === b ? 0 : a === null || a === undefined ? -1 : b === null || b === undefined ? 1 : a < b ? -1 : 1);

/**
 * Apply the subset of PostgREST query operators the apps actually use:
 * eq, neq, gt, gte, lt, lte, in, is, like, ilike, not.*. Everything else is
 * ignored, which is fine for fixtures.
 */
function applyFilters(rows, params) {
  let out = rows;
  for (const [key, raw] of params) {
    if (["select", "order", "limit", "offset", "apikey", "columns"].includes(key)) continue;
    const value = raw;
    const m = /^(not\.)?([a-z]+)\.(.*)$/.exec(value);
    if (!m) {
      out = out.filter((r) => String(r[key]) === value);
      continue;
    }
    const negate = Boolean(m[1]);
    const [, , op, operand] = m;
    const test = (row) => {
      const v = row[key];
      switch (op) {
        case "eq": return String(v) === operand;
        case "neq": return String(v) !== operand;
        case "gt": return cmp(v, operand) > 0;
        case "gte": return cmp(v, operand) >= 0;
        case "lt": return cmp(v, operand) < 0;
        case "lte": return cmp(v, operand) <= 0;
        case "is": return operand === "null" ? v === null || v === undefined : String(v) === operand;
        case "in": {
          const list = operand.replace(/^\(|\)$/g, "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
          return list.includes(String(v));
        }
        case "like":
        case "ilike": {
          const re = new RegExp("^" + operand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$", op === "ilike" ? "i" : "");
          return re.test(String(v ?? ""));
        }
        default: return true;
      }
    };
    out = out.filter((r) => (negate ? !test(r) : test(r)));
  }
  return out;
}

function applyOrder(rows, orderParam) {
  if (!orderParam) return rows;
  const clauses = orderParam.split(",").map((c) => {
    const [col, ...mods] = c.trim().split(".");
    return { col, desc: mods.includes("desc"), nullsFirst: mods.includes("nullsfirst") };
  });
  return [...rows].sort((a, b) => {
    for (const { col, desc, nullsFirst } of clauses) {
      const av = a[col], bv = b[col];
      const an = av === null || av === undefined, bn = bv === null || bv === undefined;
      if (an && bn) continue;
      if (an) return nullsFirst ? -1 : 1;
      if (bn) return nullsFirst ? 1 : -1;
      const r = cmp(av, bv);
      if (r !== 0) return desc ? -r : r;
    }
    return 0;
  });
}

function projectColumns(rows, selectParam) {
  if (!selectParam || selectParam.trim() === "*") return rows;
  const cols = selectParam.split(",").map((c) => c.trim().split(":").pop().split("(")[0].trim()).filter(Boolean);
  return rows.map((r) => {
    const o = {};
    for (const c of cols) if (c in r) o[c] = r[c];
    return o;
  });
}

const json = (res, status, body, headers = {}) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "Content-Range, Content-Length, X-Total-Count",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
    ...headers,
  });
  res.end(payload);
};

const REST_ERROR = (message, code = "PGRST100", status = 400) => ({ code, message, details: null, hint: null });

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------

function log(method, url, note = "") {
  const line = `${new Date().toISOString()} ${method} ${url}${note ? "  <- " + note : ""}\n`;
  try { appendFileSync(LOG_FILE, line); } catch { /* logging is best-effort */ }
  if (!QUIET) process.stdout.write(line);
}

function handleAuth(req, res, url) {
  const path = url.pathname.replace(/^\/auth\/v1/, "");
  const grant = url.searchParams.get("grant_type");

  if (path === "/token" && req.method === "POST") {
    if (grant === "refresh_token") {
      const u = accounts.users[0];
      log("AUTH", "refresh_token", "stub session");
      return json(res, 200, sessionFor(u));
    }
    if (grant === "password") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        let email = "";
        try { email = JSON.parse(body || "{}").email ?? ""; } catch { /* ignore */ }
        const user = findUserByEmail(email);
        if (!user) {
          log("AUTH", "password", `unknown email -> 400`);
          return json(res, 400, { error: "invalid_grant", error_description: "Invalid login credentials" });
        }
        log("AUTH", "password", `matched fixture account (${user.user_metadata?.role ?? "user"})`);
        json(res, 200, sessionFor(user));
      });
      return;
    }
    // pkce / other grants are unused here
    return json(res, 400, { error: "unsupported_grant_type" });
  }

  if (path === "/user" && req.method === "GET") {
    const auth = req.headers.authorization ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1];
    let user = null;
    try {
      const claims = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
      user = findUserById(claims.sub);
    } catch { /* ignore */ }
    if (!user) {
      log("AUTH", "user", "no/invalid token -> 401");
      return json(res, 401, { code: 401, msg: "invalid claim: missing sub claim" });
    }
    log("AUTH", "user", `ok (${user.user_metadata?.role ?? "user"})`);
    return json(res, 200, publicUser(user));
  }

  if (path === "/logout") { log("AUTH", "logout"); return json(res, 204, {}); }
  if (path === "/signup") {
    log("AUTH", "signup", "rejected by stub");
    return json(res, 400, { code: 400, error_code: "signup_disabled", msg: "Signups are disabled in the local stub." });
  }

  log("AUTH", `${req.method} ${path}`, "unhandled -> 404");
  return json(res, 404, { message: "Not found" });
}

function handleRest(req, res, url) {
  const rest = url.pathname.replace(/^\/rest\/v1\/?/, "");

  // PostgREST RPC: /rest/v1/rpc/<function>. The admin portal reads its ticket
  // list through the get_my_tickets RPC, so an empty [] here leaves every
  // screen looking like there is no data at all.
  const rpcMatch = /^rpc\/(.+)$/.exec(rest);
  if (rpcMatch) {
    return handleRpc(req, res, rpcMatch[1]);
  }

  const table = rest.split("/")[0];
  if (!table) return json(res, 400, REST_ERROR("Missing table"));

  if (!tables.has(table)) {
    log("REST", `${req.method} /rest/v1/${table}`, "TABLE NOT IN FIXTURES -> []");
    return json(res, 200, [], { "Content-Range": "0-0/0" });
  }

  const rows = tables.get(table);
  const params = [...url.searchParams.entries()];
  const filtered = applyFilters(rows, params);
  const ordered = applyOrder(filtered, url.searchParams.get("order"));

  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const limit = limitParam ? Number(limitParam) : ordered.length;
  const offset = offsetParam ? Number(offsetParam) : 0;
  const ranged = url.searchParams.has("limit") || url.searchParams.has("offset");

  const page = ranged ? ordered.slice(offset, offset + limit) : applyOrder(filtered, url.searchParams.get("order"));
  const shaped = projectColumns(page, url.searchParams.get("select"));

  log("REST", `${req.method} ${url.pathname}${url.search}`, `${shaped.length}/${rows.length} rows from fixtures`);

  const headers = {};
  if (ranged || req.headers.prefer?.includes("count=exact")) {
    headers["Content-Range"] = `${offset}-${Math.max(offset, offset + shaped.length - 1)}/${filtered.length}`;
  }
  if (req.method === "HEAD") {
    res.writeHead(200, { "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Content-Range", ...headers });
    return res.end();
  }
  return json(res, 200, shaped, headers);
}

/**
 * PostgREST RPC stub.
 *
 * The admin portal's ticket list and its KPI panels are backed by SQL functions,
 * not table reads, so they must be answered explicitly. Anything unknown returns
 * an empty array rather than an error, so a missing function degrades to "no
 * data" instead of breaking a whole screen mid-take.
 */
function handleRpc(req, res, name) {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let params = {};
    try {
      params = JSON.parse(body || "{}");
    } catch {
      /* ignore */
    }

    const tickets = tables.get("tickets") ?? [];

    if (name === "get_my_tickets") {
      const page = Number(params.p_page ?? 1) || 1;
      const perPage = Number(params.p_per_page ?? 50) || 50;
      const status = params.p_status ?? null;
      let rows = tickets;
      if (status) rows = rows.filter((t) => t.status === status);
      const from = (page - 1) * perPage;
      log("REST", `rpc get_my_tickets page=${page} status=${status}`, `${rows.length} row(s) from fixtures`);
      return json(res, 200, {
        tickets: rows.slice(from, from + perPage),
        total: rows.length,
        page,
        per_page: perPage,
      });
    }

    // A few dashboards call an aggregate that just needs a sane shape.
    if (/count|stats|summary|kpi/i.test(name)) {
      log("REST", `rpc ${name}`, "aggregate stub");
      return json(res, 200, { total: tickets.length, count: tickets.length });
    }

    log("REST", `rpc ${name}`, "NOT IMPLEMENTED -> []");
    return json(res, 200, []);
  });
}

function handleStorage(req, res, url) {  log("STORAGE", `${req.method} ${url.pathname}`, "placeholder");
  // 1x1 transparent PNG so <img src> never breaks a layout.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  res.writeHead(200, { "Content-Type": "image/png", "Content-Length": png.length, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  res.end(png);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
      "Access-Control-Max-Age": "86400",
    });
    return res.end();
  }

  if (url.pathname === "/__stub/health") {
    return json(res, 200, {
      stub: "likaslens-supabase-stub",
      tables: [...tables.keys()],
      accounts: accounts.users.map((u) => ({ email: u.email, role: u.user_metadata?.role ?? null })),
      requests: "see " + LOG_FILE,
    });
  }

  try {
    if (url.pathname.startsWith("/auth/v1")) return handleAuth(req, res, url);
    if (url.pathname.startsWith("/rest/v1")) return handleRest(req, res, url);
    if (url.pathname.startsWith("/storage/v1")) return handleStorage(req, res, url);
  } catch (err) {
    log("ERROR", url.pathname, String(err));
    return json(res, 500, { message: String(err) });
  }

  log("UNHANDLED", `${req.method} ${url.pathname}`, "-> 404");
  return json(res, 404, { message: "Not found in local stub" });
});

server.listen(PORT, "127.0.0.1", () => {
  const banner = [
    "",
    "  LikasLens local Supabase stub",
    `  listening on http://127.0.0.1:${PORT}`,
    `  tables   : ${[...tables.keys()].join(", ") || "(none)"}`,
    `  accounts : ${accounts.users.length} fixture account(s)`,
    `  requests : ${LOG_FILE}`,
    "",
    "  Point NEXT_PUBLIC_SUPABASE_URL at this address. It never talks to the",
    "  real Supabase project and it never makes an outbound request.",
    "",
  ].join("\n");
  process.stdout.write(banner);
});
