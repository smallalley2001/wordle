// Wordle PWA Service Worker - Auto-cache folders, query-safe fetch
const CACHE_NAME = "wordle-cache-v5";
const BASE = "/wordle/";

// Core files
const CORE_ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}classic.html`,
  `${BASE}advance.html`,
  `${BASE}about.html`,
  `${BASE}manifest.json`,
];

// Known files in each folder
const JS_FILES = [
  "brython.js",
  "brython_stdlib.js",
  "load_brython.js",
  "classic.bry",
  "advance.bry",
  "index.bry",
  "about.bry",
];

const CSS_FILES = ["styles.css"];

const IMG_FILES = [
  "wordle.png",
  "wordle_192.png",
  "wordle_512.png",
  "favicon.ico",
];

// Combine all assets with folder paths
const ASSETS = [
  ...CORE_ASSETS,
  ...JS_FILES.map(f => `${BASE}js/${f}`),
  ...CSS_FILES.map(f => `${BASE}css/${f}`),
  ...IMG_FILES.map(f => `${BASE}img/${f}`),
];

// Install: cache all assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn("Failed to cache:", url, err)
          )
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

// Fetch: offline-first strategy with query-safe matching
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle requests within Wordle scope
  if (!request.url.includes(BASE)) return;

  event.respondWith((async () => {
    // Strip query string for cache matching
    const urlWithoutQuery = new URL(request.url);
    urlWithoutQuery.search = "";

    const cached = await caches.match(urlWithoutQuery.toString());
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && request.method === "GET") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(urlWithoutQuery.toString(), response.clone());
      }
      return response;
    } catch (err) {
      // Offline fallback for navigation (HTML)
      if (request.destination === "document") {
        return caches.match(`${BASE}index.html`);
      }
      // Offline fallback for other assets
      return new Response("Offline resource not available", {
        status: 404,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain" },
      });
    }
  })());
});
