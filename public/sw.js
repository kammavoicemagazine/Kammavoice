const CACHE_NAME = "kammavoice-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Only handle GET requests
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Exclude third-party or chrome-extension resources from direct caching
  if (!url.origin.includes("kammavoice") && !url.origin.includes("localhost") && !url.origin.includes("vercel.app") && !url.origin.includes("cloudinary")) {
    return;
  }

  const acceptHeader = e.request.headers.get("accept") || "";

  // Network-First for API calls, admin routes, and page navigation HTML
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/admin") ||
    acceptHeader.includes("text/html")
  ) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback to offline index
            return caches.match("/");
          });
        })
    );
  } else {
    // Cache-First (with background fetch update) for static assets, scripts, stylesheets, and images
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in the background to refresh cache
          fetch(e.request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, response));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(e.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return response;
        });
      })
    );
  }
});
