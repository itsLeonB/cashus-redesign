/// <reference lib="webworker" />

/**
 * Service Worker for Cashus
 * 
 * Version: 1.0.0
 * 
 * Handles push notifications and background sync.
 * To ensure background push works on mobile:
 * 1. event.waitUntil() MUST wrap the entire promise chain.
 * 2. self.registration.showNotification() MUST be called.
 * 3. A fallback notification must be shown if data parsing fails.
 */

const CACHE_NAME = 'cashus-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/manifest-icon-192.maskable.png',
  '/manifest-icon-512.maskable.png',
  '/apple-icon-180.png',
  '/screenshot-desktop.png',
  '/screenshot-mobile.png'
];

// Install event - caching the app shell
globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become the active service worker
  globalThis.skipWaiting();
});

// Activate event - cleaning up old caches
globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Ensure that the service worker is controlling all pages immediately
  globalThis.clients.claim();
});

// Fetch event - Caching strategies
globalThis.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Always network for API calls
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Strategy: Network-first for navigation
  if (url.origin === self.location.origin && event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy: Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Cache the new resource
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});

/**
 * Push Notifications Handling
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  // The promise to be passed to event.waitUntil
  const pushTask = Promise.resolve().then(async () => {
    let payload = {};

    if (event.data) {
      try {
        payload = event.data.json();
      } catch (e) {
        console.error('[Service Worker] Error parsing push data', e);
        // Fallback to text if JSON parsing fails
        payload = { title: 'New Notification', body: event.data.text() };
      }
    }

    const title = payload.title || 'Cashus Update';
    const notificationOptions = {
      body: payload.body || 'You have a new update from Cashus.',
      icon: '/favicon.svg', // Ensure this path is correct and accessible
      badge: '/favicon.svg',
      tag: payload.tag || 'cashus-notification', // Using a tag prevents duplicate notifications
      data: payload.data || {},
      vibrate: [100, 50, 100],
      actions: payload.actions || [],
    };

    // CRITICAL: Always return the promise from showNotification
    return globalThis.registration.showNotification(title, notificationOptions);
  });

  event.waitUntil(pushTask);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const clickTask = Promise.resolve().then(async () => {
    const notificationData = event.notification.data || {};
    const notificationId = notificationData.notification_id;

    // Construct the destination URL
    let targetUrl = '/dashboard';
    if (notificationId) {
      targetUrl = `/dashboard?notification_id=${notificationId}`;
    }

    // Check if there is already a window open and at the relevant URL
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of windowClients) {
      // If we find an existing client, focus it and navigate
      if ('focus' in client) {
        if (notificationId) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', notificationId });
        }
        return client.focus();
      }
    }

    // If no window is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  });

  event.waitUntil(clickTask);
});
