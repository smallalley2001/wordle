// Wordle PWA Service Worker

// Base path for GitHub Pages subfolder PWAs
const BASE = self.registration.scope.replace(location.origin, "");

// Cache version — bump when deploying changes
const CACHE_NAME = "wordle-cache-v11";

// List of static resources to pre-cache
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
    BASE + "js/about.bry",
    BASE + "img/wordle.png",
    BASE + "img/wordle_192.png",
    BASE + "img/wordle_512.png",
    BASE + "favicon.ico",      // <== include favicon
    BASE + "manifest.json"
];

// Install: pre-cache all static assets
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
            Promise.all(
                keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
            )
        )
    );
    self.clients.claim();
});

// Fetch: offline-first strategy with runtime caching
self.addEventListener("fetch", event => {
    const request = event.request;

    // Normalize URL: remove origin & query string for cache matching
    let key = request.url.replace(location.origin, "").split("?")[0];

    event.respondWith(
        caches.match(key, { ignoreSearch: true }).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                // Clone response for caching
                if (request.method === "GET" && response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(key, responseClone));
                }
                return response;
            }).catch(() => {
                // Offline fallback
                if (request.mode === "navigate") {
                    // HTML navigation -> serve index.html
                    return caches.match(BASE + "index.html");
                }
                // For other requests (scripts, CSS, images, Brython files), try cache ignoring query
                return caches.match(key, { ignoreSearch: true })
                    .then(c => c || new Response("Offline resource not available", { status: 404, statusText: "Offline" }));
            });
        })
    );
});
