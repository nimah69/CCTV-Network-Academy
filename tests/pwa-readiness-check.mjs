import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const register = fs.readFileSync(path.join(root, "js/pwa-register.js"), "utf8");
new vm.Script(worker, { filename: "service-worker.js" });
const pages = ["index.html", "workshops.html"];

assert.equal(manifest.lang, "fa");
assert.equal(manifest.dir, "rtl");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.scope, "./");
assert.ok(manifest.icons.some((icon) => icon.src === "./icons/academy-icon.svg"));
assert.ok(fs.existsSync(path.join(root, "icons/academy-icon.svg")));

const assetsBlock = worker.match(/const CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
assert.ok(assetsBlock, "Service worker must define a deterministic local precache list");
const assets = [...assetsBlock[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
assert.ok(assets.includes("./index.html") && assets.includes("./workshops.html"));
assert.ok(assets.includes("./js/spaced-review.js"), "Offline cache must include spaced-review logic");
assert.ok(assets.length >= 10, "Core offline cache should cover the app and its local modules");
for (const asset of assets) {
  assert.ok(!/^(?:https?:)?\/\//i.test(asset), "Precache must not depend on an external host: " + asset);
  const clean = asset === "./" ? "index.html" : asset.replace(/^\.\//, "");
  assert.ok(fs.existsSync(path.join(root, clean)), "Missing precache asset: " + asset);
}

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  assert.ok(html.includes('href="./manifest.webmanifest"'), page + " must link the PWA manifest");
  assert.ok(html.includes("pwa-register.js"), page + " must register the service worker");
}
assert.ok(register.includes('navigator.serviceWorker.register("./service-worker.js"'));
assert.ok(register.includes('location.protocol !== "https:"'), "Service worker should only register in secure contexts or localhost");
assert.ok(worker.includes('request.mode === "navigate"'), "Offline navigation fallback must be implemented");
assert.ok(worker.includes('caches.match("./index.html")'), "Offline fallback must provide the cached app shell");

console.log(JSON.stringify({ status: "passed", pagesChecked: pages.length, precacheAssets: assets.length, installMetadata: true, offlineNavigationFallback: true }, null, 2));
