// Wordle PWA Service Worker

const BASE = self.registration.scope.replace(location.origin, "");
const CACHE_NAME = "wordle-cache-v10"; // bump version

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
  BASE + "js/about.bry",  // <== Make sure about.bry is cached
  BASE + "img/wordle.png",
  BASE + "img/wordle_192.png",
  BASE + "img/wordle_512.png",
  BASE + "manifest.json"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", event => {
  const request = event.request;

  // Remove origin and query string for cache matching
  let key = request.url.replace(location.origin, "").split("?")[0];

  event.respondWith(
    caches.match(key, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (request.method === "GET" && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(key, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for HTML pages
          if (request.mode === "navigate") {
            return caches.match(BASE + "index.html");
          }
          // For Brython scripts, CSS, images: try cache ignoring query string
          return caches.match(key, { ignoreSearch: true });
        })
    })
  );
});
