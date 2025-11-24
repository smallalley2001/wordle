// ---------------------------
// WORDLE PWA SERVICE WORKER
// ---------------------------
const BASE = '/wordle/';
const CACHE_NAME = 'wordle-v1';

// Precache core assets
const CORE_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'classic.html',
  BASE + 'advance.html',
  BASE + 'about.html',
  BASE + 'css/styles.css',
  BASE + 'js/brython.js',
  BASE + 'js/brython_stdlib.js',
  BASE + 'js/load_brython.js',
  BASE + 'js/classic.bry',
  BASE + 'js/advance.bry',
  BASE + 'js/index.bry',
  BASE + 'img/wordle.png',
  BASE + 'img/wordle_192.png',
  BASE + 'img/wordle_512.png',
  BASE + 'manifest.json'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of CORE_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('Skipping (not critical):', url, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: offline-first for navigation, cache-first for others
self.addEventListener('fetch', event => {
  const req = event.request;

  // For navigation (pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  // For all other requests
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
