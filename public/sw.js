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

// ------------------ Install ------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );

  // Activate this worker immediately
  self.skipWaiting();
});

// ------------------ Activate ------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ------------------ Fetch ------------------
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always fetch non-GET requests from network
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🛑 Network only for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🧠 Network-first for navigation / HTML
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache HTML if successful
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, responseClone)
            );
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (r) =>
              r ||
              new Response("You are offline and this page is not cached.", {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "text/plain" },
              })
          )
        )
    );
    return;
  }

  // 🖼 Cache-first ONLY for true static assets
  if (
    ["style", "script", "image", "font"].includes(
      event.request.destination
    )
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((net) => {
          if (net.ok) {
            const clone = net.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, clone)
            );
          }
          return net;
        });
      })
    );
    return;
  }

  // Fallback: just network
  event.respondWith(fetch(event.request));
});

