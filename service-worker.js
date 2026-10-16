"use strict";

const CACHE_NAME = "cctv-academy-static-v2026-10-16-2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./workshops.html",
  "./manifest.webmanifest",
  "./icons/academy-icon.svg",
  "./js/academy-data.js",
  "./js/micro-lessons.js",
  "./js/calculations.js",
  "./js/chapter-labs.js",
  "./js/chapter-lab-ui.js",
  "./js/spaced-review.js",
  "./js/pwa-register.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("cctv-academy-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isFreshContent = isNavigation ||
    request.destination === "document" ||
    request.destination === "script" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".mjs") ||
    url.pathname.endsWith(".html");

  if (isFreshContent) {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response && response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, copy);
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (isNavigation) return caches.match("./index.html");
        throw new Error("Network unavailable and no cached copy exists for " + request.url);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then(async (response) => {
        if (response && response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, copy);
        }
        return response;
      });
    })
  );
});
