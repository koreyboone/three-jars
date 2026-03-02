// Service Worker — stale-while-revalidate for app shell + balance data
const CACHE_NAME = 'three-jars-v2';
const APP_SHELL = [
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API/auth requests
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api') || url.pathname.includes('supabase')) {
    return;
  }

  // Stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            // Cache successful responses only
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // If offline, show offline page for navigation requests
            if (request.mode === 'navigate') {
              return cache.match('/offline.html').then(
                (r) => r ?? new Response('Offline', { status: 503 })
              );
            }
            // Return 503 for sub-resources — avoids ERR_FAILED from undefined
            return new Response('Network error', { status: 503 });
          });

        // Return cached response immediately, update in background
        return cachedResponse || fetchPromise;
      })
    )
  );
});
