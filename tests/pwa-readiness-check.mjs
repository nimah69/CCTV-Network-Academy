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
assert.ok(assets.includes("./assets/js/sim/poe-reference-ui.js"), "Offline cache must include the PoE reference UI module");
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
assert.ok(worker.includes("cctv-academy-static-v__BUILD_VERSION__"), "Source cache name must use a build-time version placeholder");
const pagesWorkflow = fs.readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
const androidBundler = fs.readFileSync(path.join(root, "scripts/bundle-android-assets.sh"), "utf8");
assert.match(pagesWorkflow, /sed -i .*__BUILD_VERSION__.*GITHUB_SHA/, "Pages build must inject the commit SHA into the cache version");
assert.match(androidBundler, /BUILD_VERSION=.*GITHUB_SHA/, "Android bundling must derive the cache version from the build commit");
assert.match(androidBundler, /sed -i .*__BUILD_VERSION__/, "Android bundle must replace the cache version placeholder");
assert.match(worker, /request.destination === "script"/, "JavaScript must use network-first freshness handling");
assert.ok(worker.includes('url.pathname.endsWith(".js")'), "JavaScript paths must use network-first freshness handling");
assert.ok(worker.includes('request.mode === "navigate"') || worker.includes("const isNavigation = request.mode === \"navigate\""), "Offline navigation fallback must be implemented");
assert.ok(worker.includes('caches.match("./index.html")'), "Offline fallback must provide the cached app shell");
assert.ok(worker.includes('key !== CACHE_NAME') && worker.includes('caches.delete(key)'), "Activation must delete obsolete academy caches");

const calculatorModule = fs.readFileSync(path.join(root, "assets/js/sim/ui/calculators.js"), "utf8");
assert.ok(!calculatorModule.includes('import { calculatePoe }'), "Calculator UI must not import the nonexistent calculatePoe export");
assert.ok(calculatorModule.includes('import { solveLink, budgetCheck, POE_TYPES } from "../calc/poe.js";'), "Calculator UI must use the supported PoE API");
const workshopHtml = fs.readFileSync(path.join(root, "workshops.html"), "utf8");
const moduleEntries = [...workshopHtml.matchAll(/<script[^>]+src=["']([^"']+\.js)["'][^>]*>/g)]
  .map((match) => match[1])
  .filter((src) => src.startsWith("./assets/"));
const pendingModules = moduleEntries.map((src) => src.replace(/^\.\//, ""));
const visitedModules = new Set();
while (pendingModules.length) {
  const modulePath = pendingModules.pop();
  if (visitedModules.has(modulePath)) continue;
  visitedModules.add(modulePath);
  assert.ok(fs.existsSync(path.join(root, modulePath)), "Missing ES module dependency: " + modulePath);
  assert.ok(assets.includes("./" + modulePath), "Offline cache omits ES module dependency: " + modulePath);
  const source = fs.readFileSync(path.join(root, modulePath), "utf8");
  const imports = [...source.matchAll(/\bfrom\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm)]
    .map((match) => match[1] || match[2]);
  for (const specifier of imports) {
    if (!specifier.startsWith(".")) continue;
    const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(modulePath), specifier));
    pendingModules.push(dependency);
  }
}

console.log(JSON.stringify({ status: "passed", pagesChecked: pages.length, precacheAssets: assets.length, installMetadata: true, offlineNavigationFallback: true, poeCalculatorApi: true, simulatorModulesCached: visitedModules.size }, null, 2));
