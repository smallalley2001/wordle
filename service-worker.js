const BASE = '/wordle/';
const CACHE_NAME = 'wordle-cache-v2';

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

self.addEventListener('activate', event => {
  console.log('🧩 Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cached => cached || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + 'index.html');
        }
      })
  );
});
