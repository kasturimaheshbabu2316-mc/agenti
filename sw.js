/* ==========================================================================
   Pharmaceutics Mastery Matrix 3 (PMM 3) – Service Worker (sw.js)
   Cache-first static shell strategy with offline fallbacks.
   ========================================================================== */

const CACHE_NAME = "pmm3-v3.1.0";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./admin.html",
  "./live.html",
  "./style.css",
  "./store.js",
  "./sync.js",
  "./rag.js",
  "./agents.js",
  "./sfx.js",
  "./bidder.js",
  "./admin.js",
  "./live.js",
  "./particles.js",
  "./spotlight.js",
  "./manifest.json",
  "./icon.svg",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Skip API or websocket
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/ws")) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
