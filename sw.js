const CACHE_PAGES = 'site-pages-v1';
const CACHE_ASSETS = 'site-assets-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Handle navigation requests (HTML pages) with network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((networkResp) => {
        const copy = networkResp.clone();
        caches.open(CACHE_PAGES).then((cache) => cache.put(req, copy));
        return networkResp;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // For other requests (assets): try cache first, fallback to network and update cache
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((networkResp) => {
        // store a copy for future
        caches.open(CACHE_ASSETS).then((cache) => {
          try { cache.put(req, networkResp.clone()); } catch (e) { /* some requests are opaque */ }
        });
        return networkResp;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
