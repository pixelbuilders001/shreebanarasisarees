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
        }).catch(() => {/* Ignore network errors for background updates */});
        
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

if (firebaseConfig.apiKey && firebaseConfig.messagingSenderId) {
  try {
    // Import Firebase Compat SDK inside service worker
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Listen to background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[Service Worker] Background message received:', payload);
      
      const notificationTitle = payload.notification?.title || 'Shree Banarasi Sarees';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/brand_logo.png',
        badge: '/favicon.ico',
        data: payload.data || {}
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (err) {
    console.error('[Service Worker] Failed to initialize Firebase Messaging:', err);
  }
}

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Resolve absolute URL
        const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

        // Try to find an existing tab that matches the origin and focus it
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus().then((focusedClient) => {
              if (focusedClient && 'navigate' in focusedClient) {
                return focusedClient.navigate(absoluteTargetUrl);
              }
            });
          }
        }

        // If no tab is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteTargetUrl);
        }
      })
  );
});
