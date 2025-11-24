const BASE = '/wordle/';
const CACHE_NAME = 'wordle-cache-v10';

const urlsToCache = [
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        urlsToCache.map(url =>
          cache.add(url).catch(err =>
            console.warn('Failed to cache', url, err)
          )
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Handle navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE + 'index.html')
    );
    return;
  }

  // Cache-first for all assets
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
