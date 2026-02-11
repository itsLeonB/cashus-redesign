/// <reference lib="webworker" />

/**
 * Service Worker for Cashus
 * 
 * Handles push notifications and background sync.
 * To ensure background push works on mobile:
 * 1. event.waitUntil() MUST wrap the entire promise chain.
 * 2. self.registration.showNotification() MUST be called.
 * 3. A fallback notification must be shown if data parsing fails.
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
