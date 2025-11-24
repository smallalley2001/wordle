const BASE = self.registration.scope.replace(location.origin, "");
const CACHE_NAME = "wordle-cache-v4";

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

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  let request = event.request;

  // REMOVE query strings for matching cache (Brython issue)
  const urlWithoutQuery = request.url.split("?")[0];

  event.respondWith(
    caches.match(urlWithoutQuery, { ignoreSearch: true })
      .then(cached => cached ||
        fetch(request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(urlWithoutQuery, response.clone());
            return response;
          });
        })
      )
  );
});
