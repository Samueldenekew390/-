/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - PWA Service Worker
   ========================================================================== */

const CACHE_NAME = 'eth-lottery-v3';

// Static safe public shell assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/category.html',
  '/payment.html',
  '/success.html',
  '/css/style.css',
  '/css/responsive.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/supabase.js',
  '/js/app.js',
  '/js/home.js',
  '/js/category.js',
  '/js/payment.js',
  '/manifest.json'
];

// Install event: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('Cache install error:', err);
    })
  );
  self.skipWaiting();
});

// Activate event: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: cache-first strategy with redirect handling
self.addEventListener('fetch', (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch (err) {
    return;
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // STRICT PRIVACY RULE:
  // Do not cache admin pages, payment screenshots, Supabase API calls
  if (
    url.pathname.includes('admin') ||
    url.pathname.includes('screenshot') ||
    url.pathname.includes('supabase')
  ) {
    return; // Skip caching for sensitive requests
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      // Build a new request that forces redirect handling
      const fetchRequest = new Request(event.request.url, {
        method: event.request.method,
        headers: event.request.headers,
        mode: 'same-origin',
        credentials: event.request.credentials,
        redirect: 'follow'   // <-- key fix
      });

      return fetch(fetchRequest).catch(() => {
        return new Response('', { status: 404, statusText: 'Not found in cache or network' });
      });
    }).catch(() => {
      return new Response('', { status: 404, statusText: 'Error' });
    })
  );
});
