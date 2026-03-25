const CACHE_NAME = "easy-billing-v4";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./css/app.css",
  "./firebase-config.js",
  "./js/app.js",
  "./js/auth-guard.js",
  "./js/auth.js",
  "./js/customers.js",
  "./js/invoices.js",
  "./js/invoice-form.js",
  "./js/invoice-pdf.js",
  "./js/number-to-words-in.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        const copy = res.clone();
        if (res.ok && res.type === "basic") {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return res;
      });
    })
  );
});
