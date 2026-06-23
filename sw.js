// FamilyFlow Service Worker – ermöglicht Offline-Start (App-Shell-Caching)
const CACHE_NAME = 'familyflow-v1';
const CACHE_URLS = [
  './',
  './index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Externe APIs (Google, Trello) NIE aus dem Cache bedienen -- immer live.
  if (req.url.includes('googleapis.com') ||
      req.url.includes('trello.com') ||
      req.url.includes('accounts.google.com')) {
    return; // Browser-Standardverhalten (Netzwerk)
  }

  // App-Shell: Cache-first, mit Netzwerk-Fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && req.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
