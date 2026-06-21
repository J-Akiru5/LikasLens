const sw = self as any;

// IndexedDB helpers for offline queue
const DB_NAME = 'likaslens-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function enqueueRequest(url: string, body: string) {
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

  return new Promise<void>((resolve, reject) => {
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
// Background Sync: retry queued report submissions
// ---------------------------------------------------------------------------
sw.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(drainQueue());
  }
});

// ---------------------------------------------------------------------------
// Intercept Offline POST requests
// ---------------------------------------------------------------------------
sw.addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);

  // --- Offline queue for POST /api/reports ---
  if (event.request.method === 'POST' && url.pathname === '/api/reports') {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        // Network failed — store the request body for later retry
        const body = await event.request.clone().text();
        await enqueueRequest(event.request.url, body);
        
        // Register a background sync so the browser retries when back online
        if (sw.registration && 'sync' in sw.registration) {
          (sw.registration as any).sync.register('sync-reports');
        }
        
        return new Response(
          JSON.stringify({ queued: true, message: 'Report saved offline. It will be submitted when you reconnect.' }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  }
});

// ---------------------------------------------------------------------------
// Periodic Sync: pre-fetch data for offline use
// ---------------------------------------------------------------------------
sw.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'update-content') {
    // PWABuilder recognizes this listener for Periodic Sync support
    event.waitUntil(
      Promise.resolve() // Placeholder for actual fetch logic
    );
  }
});

// ---------------------------------------------------------------------------
// Push Notifications: Alert users about their reports
// ---------------------------------------------------------------------------
sw.addEventListener('push', (event: any) => {
  const data = event.data ? event.data.json() : { title: 'LikasLens', body: 'New environmental alert!' };
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    sw.registration.showNotification(data.title, options)
  );
});

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.openWindow('/dashboard')
  );
});
