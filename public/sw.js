const SW_VERSION = "1.0.2";
const CACHE_NAME = `cashus-v${SW_VERSION}`;

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json",
  "/manifest-icon-192.maskable.png",
  "/manifest-icon-512.maskable.png",
  "/apple-icon-180.png",
  "/screenshot-desktop.png",
  "/screenshot-mobile.png",
];

/**
 * Checks if the current client is running as an installed PWA on a mobile device.
 * We look at the user agent and the display-mode of the window clients.
 */
async function getIsMobileStandalonePWA() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (!isMobile) return false;

  const clients = await globalThis.clients.matchAll({ type: 'window' });
  return clients.some(client => client.displayMode === 'standalone');
}

// ------------------ Install ------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const isMobilePWA = await getIsMobileStandalonePWA();

      // 🚀 Caching logic ONLY runs when the app is running as a mobile installed PWA
      if (isMobilePWA) {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ASSETS_TO_CACHE);
      }

      // Activate this worker immediately
      globalThis.skipWaiting();
    })()
  );
});

// ------------------ Activate ------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const isMobilePWA = await getIsMobileStandalonePWA();

      // 🧹 Cleanup old caches ONLY if we are in PWA mode
      if (isMobilePWA) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      }

      await globalThis.clients.claim();
    })()
  );
});

// ------------------ Fetch ------------------
self.addEventListener("fetch", (event) => {
  // ⚡️ Skip all caching logic if not a mobile standalone PWA
  // This prevents stale SPA cache issues in normal browser tabs while
  // maintaining full offline capabilities for installed users.
  event.respondWith(
    (async () => {
      const isMobilePWA = await getIsMobileStandalonePWA();

      if (!isMobilePWA) {
        return fetch(event.request);
      }

      const url = new URL(event.request.url);

      // Always fetch non-GET requests from network
      if (event.request.method !== "GET") {
        return fetch(event.request);
      }

      // 🛑 Network only for API calls
      if (url.pathname.startsWith("/api/")) {
        return fetch(event.request);
      }

      // 🧠 Network-first for navigation / HTML
      if (
        event.request.mode === "navigate" ||
        event.request.destination === "document" ||
        url.pathname.endsWith(".html")
      ) {
        try {
          const response = await fetch(event.request);
          // Cache HTML if successful
          if (response.ok) {
            const responseClone = response.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, responseClone);
          }
          return response;
        } catch (error) {
          const cachedResponse = await caches.match(event.request);
          return cachedResponse || new Response("You are offline and this page is not cached.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
            errors: error
          });
        }
      }

      // 🖼 Cache-first ONLY for true static assets
      if (["style", "script", "image", "font"].includes(event.request.destination)) {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        const net = await fetch(event.request);
        if (net.ok) {
          const clone = net.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, clone);
        }
        return net;
      }

      // Fallback: just network
      return fetch(event.request);
    })()
  );
});

