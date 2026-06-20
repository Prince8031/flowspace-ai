const CACHE_NAME = 'flowspace-cache-v1.2.0';
const OFFLINE_URL = '/index.html';

// Shell assets to pre-cache immediately on service worker install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/screenshots/screenshot-mobile.png',
  '/screenshots/screenshot-desktop.png',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// 1. Install Event - Cache the App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[FlowSpace SW] Pre-caching App Shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event - Clean up stale caches from previous builds
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[FlowSpace SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force active client tabs to start using this service worker immediately
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event - Serve cached assets or fallback gracefully
self.addEventListener('fetch', (event) => {
  // Let browser make external API calls directly, e.g. /api/* or external analytics
  // Skip browser extension requests or non-HTTP protocols
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Bypass API calls so Gemini responses or real-time planner triggers hit the server first,
  // falling back to an elegant error description message if offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn('[FlowSpace SW] API call failed while offline:', url.pathname);
        return new Response(
          JSON.stringify({ 
            error: 'offline', 
            chatResponse: "I notice you are offline right now! While disconnected from FlowSpace AI's cloud, your personal dashboard, pomodoro timers, local schedules, and glass memos are cached and fully operational. Reconnect to get full access to the Gemini AI Coach!",
            actions: [] 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // standard page/asset routing
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately for speed, but fetch updated source in background
        // to keep the cache fresh (Stale-While-Revalidate pattern)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignore network log errors when user is active in offline mode
        });
        return cachedResponse;
      }

      // If not in cache, fallback to fetching from network
      return fetch(event.request).then((networkResponse) => {
        // Cache new static assets dynamically if applicable
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          !url.pathname.includes('/api/')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If entirely offline and requesting a page layout, serve key entry point
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
