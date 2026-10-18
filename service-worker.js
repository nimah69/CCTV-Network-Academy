"use strict";

const CACHE_NAME = "cctv-academy-static-v20261018-native-select-fix3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/academy.css",
  "./workshops.html",
  "./manifest.webmanifest",
  "./icons/academy-icon.svg",
  "./js/academy-data.js",
  "./js/micro-lessons.js",
  "./js/interactive-displays.js",
  "./fonts/Vazirmatn-Variable.woff2",
  "./js/calculations.js",
  "./js/chapter-labs.js",
  "./js/chapter-lab-ui.js",
  "./js/spaced-review.js",
  "./js/pwa-register.js",
  "./assets/js/sim/constants.js",
  "./assets/js/sim/units.js",
  "./assets/js/sim/graph.js",
  "./assets/js/sim/devices.js",
  "./assets/js/sim/engine.js",
  "./assets/js/sim/tools.js",
  "./assets/js/sim/scenarios.js",
  "./assets/js/sim/scoring.js",
  "./assets/js/sim/calc/poe.js",
  "./assets/js/sim/calc/subnet.js",
  "./assets/js/sim/calc/storage.js",
  "./assets/js/sim/calc/cable.js",
  "./assets/js/sim/calc/security.js",
  "./assets/js/sim/calc/ups.js",
  "./assets/js/sim/calc/optics.js",
  "./assets/js/sim/calc/design.js",
  "./assets/js/sim/ui/real-simulator.js",
  "./assets/js/sim/ui/calculators.js",
  "./assets/js/sim/poe-reference-ui.js"
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
