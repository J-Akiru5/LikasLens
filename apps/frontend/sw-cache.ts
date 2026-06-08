/**
 * LikasLens Service Worker — Custom Runtime Caching Strategies
 *
 * Strategy breakdown:
 *   Static assets (CSS, JS, fonts, images)       → Cache-First
 *   API static data (/api/laws, /api/achievements) → Stale-While-Revalidate
 *   API dynamic data (/api/tickets, /api/profile)   → Network-First
 *
 * When completely offline, cached responses are served transparently.
 * Report submissions POST /api/reports are NetworkOnly — they rely on the
 * IndexedDB offline queue in report/page.tsx, never cached.
 */

const DAY = 24 * 60 * 60;
const MONTH = 30 * DAY;

export const runtimeCaching: Array<{
  urlPattern: RegExp;
  handler:
    | "CacheFirst"
    | "StaleWhileRevalidate"
    | "NetworkFirst"
    | "NetworkOnly"
    | "CacheOnly";
  options?: {
    cacheName?: string;
    expiration?: { maxEntries?: number; maxAgeSeconds?: number };
    networkTimeoutSeconds?: number;
    cacheableResponse?: { statuses: number[] };
    backgroundSync?: { name: string; options?: { maxRetentionTime: number } };
  };
  method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "PATCH" | "OPTIONS";
}> = [
  // ═══════════════════════════════════════════
  // 1. Static Assets — Cache-First
  //    (complements next-pwa's build-time precache)
  // ═══════════════════════════════════════════
  {
    urlPattern: /\.(?:js|css)$/,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: { maxEntries: 200, maxAgeSeconds: MONTH },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\.(?:png|jpe?g|svg|gif|ico|webp|avif)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: { maxEntries: 200, maxAgeSeconds: MONTH },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\.(?:woff2?|ttf|eot|otf)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: { maxEntries: 50, maxAgeSeconds: MONTH },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\/_next\/static\//,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: { maxEntries: 200, maxAgeSeconds: MONTH },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // ═══════════════════════════════════════════
  // 2. API Static Data — Stale-While-Revalidate
  //    Serve cached copy instantly, refresh in background.
  //    Applies to laws, achievement catalog, leaderboard.
  // ═══════════════════════════════════════════
  {
    // GET /api/laws
    urlPattern: /\/api\/laws(\?.*)?$/,
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "static-api",
      expiration: { maxEntries: 50, maxAgeSeconds: DAY },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // GET /api/achievements, /api/achievements/user/:id
    urlPattern: /\/api\/achievements/,
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "static-api",
      expiration: { maxEntries: 50, maxAgeSeconds: DAY },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // GET /api/leaderboard
    urlPattern: /\/api\/leaderboard(\?.*)?$/,
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "static-api",
      expiration: { maxEntries: 20, maxAgeSeconds: 12 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // ═══════════════════════════════════════════
  // 3. API Dynamic Data — Network-First
  //    Try network first, fall back to cache on failure/timeout.
  //    Applies to tickets, user profile, user impact, dashboard.
  // ═══════════════════════════════════════════
  {
    // GET /api/tickets, /api/tickets/:id
    urlPattern: /\/api\/tickets/,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "dynamic-api",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // GET /api/user/profile
    urlPattern: /\/api\/user\/profile(\?.*)?$/,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "dynamic-api",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 20, maxAgeSeconds: 5 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // GET /api/user/impact
    urlPattern: /\/api\/user\/impact(\?.*)?$/,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "dynamic-api",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 20, maxAgeSeconds: 5 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // GET /api/dashboard/*
    urlPattern: /\/api\/dashboard/,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "dynamic-api",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 20, maxAgeSeconds: 5 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // GET /api/user
    urlPattern: /\/api\/user(\?.*)?$/,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "dynamic-api",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 10, maxAgeSeconds: 2 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // ═══════════════════════════════════════════
  // 4. Report submissions — NetworkOnly (never cache)
  //    The offline queue (IndexedDB) handles offline reports.
  // ═══════════════════════════════════════════
  {
    urlPattern: /\/api\/reports/,
    handler: "NetworkOnly",
    method: "POST",
  },
  {
    urlPattern: /\/api\/auth/,
    handler: "NetworkOnly",
  },
];
