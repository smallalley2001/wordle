// service-worker.js
const CACHE_NAME = 'wordle-cache-v1';
const urlsToCache = [
  '/index.html',
  '/classic.html',
  '/advance.html',
  '/about.html',
  '/css/styles.css',
  '/js/brython.js',
  '/js/brython_stdlib.js',
  '/js/load_brython.js',
  '/js/classic.bry',
  '/js/advance.bry',
  '/js/index.bry',
  '/img/wordle.png',
  '/manifest.json'
];

// Install event — cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event — remove old caches if any
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event — serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found, else fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Optional: fallback for offline case
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
