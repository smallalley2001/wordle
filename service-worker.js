const CACHE_NAME = "wordle-cache-v2";
const BASE = "/wordle/";

// List every file Wordle uses
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).catch((err) =>
        console.warn("Some assets failed to cache:", err)
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) =>
        key !== CACHE_NAME ? caches.delete(key) : null
      ))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.includes(BASE)) return; // Ignore other apps

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request).then((res) => {
        if (res.ok) {
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, res.clone())
          );
        }
        return res;
      }).catch(() =>
        caches.match(`${BASE}index.html`)
      )
    )
  );
});
