const CACHE_NAME = 'sbs-pwa-cache-v2';

// Core assets to cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/brand_logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable.png',
  '/favicon.ico'
];

// Install Event - Precache key files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching essential offline assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle cache first or network falling back to offline page
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests and skip Supabase edge functions/API endpoints
  if (request.method !== 'GET' || request.url.includes('/api/') || request.url.includes('supabase.co')) {
    return;
  }

  // Handle page navigation requests (HTML docs)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, clone and cache it for offline browsing
          if (response && response.status === 200) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseCopy);
            });
          }
          return response;
        })
        .catch(() => {
          // If fetching fails (offline), serve the requested page from cache if available,
          // otherwise fallback to the offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache, but update cache in the background (Stale-While-Revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors for background updates */ });

        return cachedResponse;
      }

      // If not in cache, fetch from network and cache
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (request.url.startsWith(self.location.origin) || request.url.startsWith('https://fonts.'))) {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseCopy);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Return blank or error if offline for other files
        console.log('[Service Worker] Fetch failed for:', request.url, err);
      });
    })
  );
});

// ==========================================
// Firebase Cloud Messaging (FCM) Integration
// ==========================================

// Parse Firebase config from URL query parameters
const swUrl = new URL(self.location.href);
const firebaseConfig = {
  apiKey: swUrl.searchParams.get('apiKey'),
  authDomain: swUrl.searchParams.get('authDomain'),
  projectId: swUrl.searchParams.get('projectId'),
  storageBucket: swUrl.searchParams.get('storageBucket'),
  messagingSenderId: swUrl.searchParams.get('messagingSenderId'),
  appId: swUrl.searchParams.get('appId')
};

// -----------------------------------------------------------------------
// FCM Background Push Handler
//
// We intentionally do NOT use firebase.messaging().onBackgroundMessage().
// The Firebase Messaging compat SDK (≤9.x) has a known behaviour where:
//   1. It auto-displays a notification when the FCM payload has a `notification` field, AND
//   2. It ALSO fires the onBackgroundMessage callback for the same message.
// This results in two OS notifications shown for every push — the classic "duplicate" bug.
//
// Solution: initialise Firebase only to allow the SDK to receive the FCM message
// (required for token generation / VAPID auth), but handle the actual push display
// ourselves via the native `push` event listener. We suppress the SDK's auto-display
// by NOT calling showNotification inside onBackgroundMessage, and instead handling
// everything in the `push` event where we have full, exclusive control.
// -----------------------------------------------------------------------

if (firebaseConfig.apiKey && firebaseConfig.messagingSenderId) {
  try {
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Register a no-op onBackgroundMessage handler.
    // This is REQUIRED to prevent the Firebase SDK from auto-displaying its own
    // notification (the SDK only auto-displays when no handler is registered).
    // Our actual display logic lives in the `push` event below.
    messaging.onBackgroundMessage((payload) => {
      console.log('[Service Worker] FCM onBackgroundMessage intercepted (display handled by push event):', payload?.data?.title);
      // Intentionally empty — we show the notification in the `push` listener below.
    });
  } catch (err) {
    console.error('[Service Worker] Failed to initialize Firebase Messaging:', err);
  }
}

// Raw push event — fires for every incoming FCM message regardless of payload shape.
// By handling display here (and using a no-op onBackgroundMessage above),
// we guarantee exactly ONE notification is shown per push event.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');

  let data = {};
  try {
    const raw = event.data?.json();
    // FCM wraps the payload differently depending on message type:
    //   - Notification messages:  raw = { notification: {...}, data: {...} }
    //   - Data-only messages:     raw = { data: {...} }
    //   - Some backends:          raw = { title, body, ... } at root level
    data = raw?.data || raw?.notification || raw || {};
  } catch (e) {
    console.warn('[Service Worker] Could not parse push payload as JSON:', e);
  }

  const title = data.title || 'Shree Banarasi Sarees';
  const options = {
    body: data.body || '',
    icon: '/brand_logo.png',
    badge: '/favicon.ico',
    image: data.image_url || undefined,
    data: data,                   // passed through to notificationclick handler
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);
  event.notification.close();

  // Fall back to '/' if no URL is set in the notification data
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Resolve to an absolute URL relative to the service worker origin
        const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

        // Look for an existing window on this origin
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            // Focus the existing window then navigate it to the target URL.
            // Always try navigate() first; if the API is absent (older browsers)
            // fall back to opening a new window so the user still lands correctly.
            return client.focus().then((focusedClient) => {
              if (focusedClient && 'navigate' in focusedClient) {
                return focusedClient.navigate(absoluteTargetUrl);
              }
              // navigate() unavailable — open new window as fallback
              return self.clients.openWindow(absoluteTargetUrl);
            });
          }
        }

        // No existing window found — open a fresh one
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteTargetUrl);
        }
      })
  );
});
