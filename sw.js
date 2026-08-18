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

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('Cache install error:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
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

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(e.request.url);
  } catch (err) {
    return;
  }

  // Only handle same-origin requests to prevent breaking external APIs, CDNs, or image hosts
  if (url.origin !== self.location.origin) {
    return;
  }

  // STRICT PRIVACY RULE:
  // DO NOT CACHE: admin pages, payment screenshots, Supabase API calls, customer inputs
  if (
    url.pathname.includes('admin') ||
    url.pathname.includes('screenshot') ||
    url.pathname.includes('supabase')
  ) {
    return; // Bypass Service Worker cache for sensitive requests
  }

e.respondWith(
  caches.match(e.request).then((cachedResponse) => {
    if (cachedResponse) return cachedResponse;

    // Build a new request that forces redirect handling
    const fetchRequest = new Request(e.request.url, {
      method: e.request.method,
      headers: e.request.headers,
      mode: 'same-origin',
      credentials: e.request.credentials,
      redirect: 'follow'   // <-- the key fix
    });

    return fetch(fetchRequest).catch(() => {
      return new Response('', { status: 404, statusText: 'Not found in cache or network' });
    });
  }).catch(() => {
    return new Response('', { status: 404, statusText: 'Error' });
  })
);
});  
