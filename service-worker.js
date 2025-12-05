const BASE = self.registration.scope.replace(location.origin, "");
const CACHE_NAME = "wordle-cache-v6"; // bumped version

// Pre-cache static resources
const urlsToCache = [
  BASE,
  BASE + "index.html",
  BASE + "classic.html",
  BASE + "advance.html",
  BASE + "about.html",
  BASE + "css/styles.css",
  BASE + "js/brython.js",
  BASE + "js/brython_stdlib.js",
  BASE + "js/load_brython.js",
  BASE + "js/classic.bry",
  BASE + "js/advance.bry",
  BASE + "js/index.bry",
  BASE + "img/wordle.png",
  BASE + "img/wordle_192.png",
  BASE + "img/wordle_512.png",
  BASE + "manifest.json"
];

// Install: pre-cache everything
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

// Fetch: offline-first with runtime caching + navigation fallback
self.addEventListener("fetch", event => {
  const request = event.request;
  const urlWithoutQuery = request.url.split("?")[0];

  event.respondWith(
    caches.match(urlWithoutQuery, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;

      return fetch(urlWithoutQuery).then(response => {
        // Clone response immediately for caching
        const responseClone = response.clone();

        // Cache dynamically any GET requests that succeed
        if (request.method === "GET" && response.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(urlWithoutQuery, responseClone));
        }

        // Return the original response to the page
        return response;
      }).catch(() => {
        // Offline fallback for navigation (HTML requests)
        if (request.destination === "document") {
          return caches.match(BASE + "index.html");
        }
      });
    })
  );
});
