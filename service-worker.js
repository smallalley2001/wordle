// Wordle PWA Service Worker
const CACHE_NAME = "wordle-cache-v3";
const BASE = "/wordle/";

// List all assets Wordle uses
const ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}classic.html`,
  `${BASE}advance.html`,
  `${BASE}about.html`,
  `${BASE}manifest.json`,
  `${BASE}css/styles.css`,
  `${BASE}js/brython.js`,
  `${BASE}js/brython_stdlib.js`,
  `${BASE}js/load_brython.js`,
  `${BASE}js/classic.bry`,
  `${BASE}js/advance.bry`,
  `${BASE}js/index.bry`,
  `${BASE}js/about.bry`,
  `${BASE}img/wordle.png`,
  `${BASE}img/wordle_192.png`,
  `${BASE}img/wordle_512.png`,
  `${BASE}favicon.ico`,
];

// Install: pre-cache all assets safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Failed to cache:", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: remove only old Wordle caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("wordle-cache-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: offline-first strategy with fallback
self.addEventListener("fetch", (event) => {
  if (!event.request.url.includes(BASE)) return; // Ignore other apps

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          if (res.ok && event.request.method === "GET") {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, res.clone())
            );
          }
          return res;
        })
        .catch(() => {
          // Offline fallback for HTML pages
          if (event.request.destination === "document") {
            return caches.match(`${BASE}index.html`);
          }
          // Offline fallback for other assets
          return new Response("Offline resource not available", {
            status: 404,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" },
          });
        });
    })
  );
});
