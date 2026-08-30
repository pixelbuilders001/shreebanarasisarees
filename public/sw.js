const CACHE_NAME = 'sbs-pwa-cache-v8';

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
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip all third-party domain requests (Google Analytics, GTM, Clarity, Supabase, Firebase, Cashfree, etc.)
  // Only intercept same-origin requests or Google Fonts
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (!isSameOrigin && !isGoogleFont) {
    return;
  }

  // Skip API routes and Next.js internal /_next/ static/HMR assets
  if (url.pathname.includes('/api/') || url.pathname.includes('/_next/')) {
    return;
  }

  // Handle page navigation requests (HTML docs)
  if (request.mode === 'navigate') {
    // Do NOT intercept page navigations — let the browser handle them natively.
    // Intercepting navigations here has repeatedly broken the Cashfree payment
    // round-trip (back button / close / return_url), showing either the offline
    // page or ERR_FAILED even though the user is fully online.
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
// Handles display here to ensure title, body, and rich image banners are extracted cleanly.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');

  let raw = {};
  try {
    raw = event.data?.json() || {};
  } catch (e) {
    console.warn('[Service Worker] Could not parse push payload as JSON:', e);
  }

  const notification = raw.notification || {};
  const customData = raw.data || {};

  const title = notification.title || customData.title || raw.title || 'Shree Banarasi Sarees';
  const body = notification.body || customData.body || raw.body || '';
  const imageUrl = notification.image || customData.image_url || customData.image || raw.image_url || undefined;
  let targetUrl = customData.url || raw.url;
  if (!targetUrl && customData.order_number) {
    if (customData.order_status === 'delivered') {
      targetUrl = `/review?orderId=${encodeURIComponent(customData.order_number)}`;
    } else {
      targetUrl = `/account?orderId=${encodeURIComponent(customData.order_number)}`;
    }
  }
  if (!targetUrl) targetUrl = '/';

  // Generate a unique tag to collapse duplicate notifications for the same event
  const tag = customData.order_number
    ? `order-${customData.order_number}-${customData.order_status || 'status'}`
    : (customData.notification_id || raw.id || `sbs-${title}-${body}`);

  const options = {
    body: body,
    icon: '/brand_logo.png',
    badge: '/favicon.ico',
    image: imageUrl,
    tag: tag,
    renotify: false,
    data: { ...customData, ...notification, url: targetUrl },
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
