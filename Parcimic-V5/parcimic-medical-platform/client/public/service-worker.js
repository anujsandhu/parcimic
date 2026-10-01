/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'parcimic-v4-navbar-dropdown-fix';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/assets/logos/parcimic-logo.png',
  '/manifest.json',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })))
          .catch((err) => {
            console.log('Cache addAll error:', err);
          });
      })
  );
  self.skipWaiting();
});

// Fetch from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then(
      (response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      }
    ).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Update service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
