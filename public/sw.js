const CACHE_NAME = "radar-base-static-v2";
const OFFLINE_URLS = [
  "/manifest.json",
  "/favicon.ico",
  "/logo.png"
];

function isCacheableStaticAsset(requestUrl) {
  return (
    requestUrl.pathname.startsWith("/_next/static/") ||
    OFFLINE_URLS.includes(requestUrl.pathname)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Never cache authenticated pages, API responses or Next.js data payloads.
  // Reusing those responses after a deployment can mix stale HTML with a new
  // client bundle and can expose session-specific data from the cache.
  if (
    requestUrl.origin !== self.location.origin ||
    !isCacheableStaticAsset(requestUrl)
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          );
        }

        return networkResponse;
      });
    })
  );
});
