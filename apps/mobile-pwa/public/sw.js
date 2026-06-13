const CACHE_NAME = 'likaslens-pwa-v2';

// App shell assets to precache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Read-only API endpoints that use stale-while-revalidate
const SWR_PATHS = [
  '/api/laws',
  '/api/leaderboard',
  '/api/settings/eco-credit-rate',
];

// IndexedDB helpers for offline queue
// This is a basic implementation — a production app would want retry limits,
// exponential backoff, deduplication, and proper error handling.
const DB_NAME = 'likaslens-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function enqueueRequest(url, body) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({ url, body, timestamp: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function drainQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const getAll = store.getAll();

  return new Promise((resolve, reject) => {
    getAll.onsuccess = async () => {
      const items = getAll.result;
      for (const item of items) {
        try {
          await fetch(item.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: item.body,
          });
          // Only remove from queue after successful send
          const deleteTx = db.transaction(STORE_NAME, 'readwrite');
          deleteTx.objectStore(STORE_NAME).delete(item.id);
        } catch {
          // If it still fails, leave it in the queue for the next sync
          break;
        }
      }
      resolve();
    };
    getAll.onerror = () => reject(getAll.error);
  });
}

// ---------------------------------------------------------------------------
// Install: precache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: purge old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch: strategy routing
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- Offline queue for POST /api/reports ---
  if (request.method === 'POST' && url.pathname === '/api/reports') {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        // Network failed — store the request body for later retry
        const body = await request.clone().text();
        await enqueueRequest(request.url, body);
        // Register a background sync so the browser retries when back online
        if (self.registration && self.registration.sync) {
          self.registration.sync.register('sync-reports');
        }
        return new Response(
          JSON.stringify({ queued: true, message: 'Report saved offline. It will be submitted when you reconnect.' }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Skip other non-GET requests
  if (request.method !== 'GET') return;

  // --- Stale-while-revalidate for read-only API endpoints ---
  if (SWR_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);

          // Return cached immediately, update in background
          return cached || fetched;
        })
      )
    );
    return;
  }

  // --- Network-first for other API / auth calls ---
  if (url.pathname.startsWith('/api') || url.pathname.includes('/auth')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // --- Cache-first for static assets ---
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});

// ---------------------------------------------------------------------------
// Background Sync: retry queued report submissions
// ---------------------------------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(drainQueue());
  }
});
