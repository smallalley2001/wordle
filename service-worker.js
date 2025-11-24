const BASE = '/wordle/';
const CACHE_NAME = 'wordle-cache-v3';

const urlsToCache = [
  BASE,
  BASE + 'index.html',
  BASE + 'classic.html',
  BASE + 'advance.html',
  BASE + 'about.html',

  // CSS
  BASE + 'css/styles.css',

  // JS & Brython
  BASE + 'js/brython.js',
  BASE + 'js/brython_stdlib.js',
  BASE + 'js/load_brython.js',

  // Brython scripts
  BASE + 'js/classic.bry',
  BASE + 'js/advance.bry',
  BASE + 'js/index.bry',

  // Images
  BASE + 'img/wordle.png',
  BASE + 'img/wordle_192.png',
  BASE + 'img/wordle_512.png',

  // Manifest
  BASE + 'manifest.json'
];

// Install event — cache all files
self.addEventListener('install', event => {
  console.log('🧩 Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        urlsToCache.map(url =>
          cache.add(url).catch(err => console.warn('⚠️ Failed to cache:', url, err))
        )
      ))
  );
  self.skipWaiting();
});

// Activate event — remove old caches
self.addEventListener('activate', event => {
  console.log('🧩 Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch event — serve from cache first
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // Handle page navigation requests
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(cached => {
        return cached || caches.match(BASE + 'index.html');
      })
    );
  } else {
    // Handle other requests (CSS, JS, images, Brython scripts)
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            // Optional: dynamically cache fetched requests
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
          }).catch(() => {
            // Could return a default fallback image or nothing
          });
        })
    );
  }
});
