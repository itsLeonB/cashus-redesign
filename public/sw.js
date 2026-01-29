/// <reference lib="webworker" />

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, data } = payload;

    const options = {
      body: payload.body || '', // Optional body if provided
      icon: '/pwa-192x192.png', // Fallback or default icon
      badge: '/pwa-192x192.png', // Fallback or default badge
      data: data, // notification_id should be here
    };

    event.waitUntil(
      globalThis.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationId = event.notification.data?.notification_id;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (notificationId) {
            // Navigate or postMessage to handle routing
            client.postMessage({ type: 'NOTIFICATION_CLICK', notificationId });
          }
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        const url = notificationId ? `/dashboard?notification_id=${notificationId}` : '/dashboard';
        return clients.openWindow(url);
      }
    })
  );
});
