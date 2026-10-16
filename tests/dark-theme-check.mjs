import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/academy.css", "utf8");
const workshops = fs.readFileSync("workshops.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
const serviceWorker = fs.readFileSync("service-worker.js", "utf8");

assert.match(html, /<html lang="fa" dir="rtl">/, "The academy must remain Persian RTL");
assert.match(html, /<meta name="theme-color" content="#07111f">/, "Browser chrome must use the dark academy color");
assert.match(html, /href="\.\/css\/academy\.css"/, "The page must load the local academy stylesheet");
assert.ok(html.includes('const storeKey="cctvAcademyProgressV1";'), "The existing progress-storage key must remain unchanged");
assert.ok(html.includes("function quizHTML(comprehensive=false)"), "Existing chapter/comprehensive quiz rendering must remain available");

for (const token of ["--bg:#07111f", "--panel:#0f1d30", "--ink:#eaf2ff", "--brand:#38bdf8", "--brand2:#2dd4bf"]) {
  assert.ok(css.includes(token), "Missing dark design token: " + token);
}
assert.ok(css.includes("Dark Cyber Lab + Interactive Learning + Blueprint visual system"), "The main academy must include the dark design layer");
assert.ok(css.includes(".chapter-visual .cv-concept-grid") && css.includes("background-size:20px 20px"), "Concept cards must have the subtle blueprint grid");
assert.ok(css.includes(".chapter-visual .cv-answer-grid button{background:#10243a!important;color:#eaf2ff!important"), "Dark quiz options must keep readable foreground/background contrast");
assert.ok(css.includes("@media(max-width:620px)") && css.includes("min-height:48px"), "Visual learning controls must remain touch-friendly on mobile");

for (const token of ["--bg:#07111f", "--panel:#0f1d30", "--cyan:#67e8f9", "--blue:#38bdf8"]) {
  assert.ok(workshops.includes(token), "Workshop palette must match the academy: " + token);
}
assert.ok(workshops.includes("Stage 2: align the interactive workshop with the Dark Cyber Lab palette"), "Workshops must use the unified visual system");
assert.ok(workshops.includes(".schematic-node .node-label{fill:#eaf2ff}"), "Schematic labels must have a readable light foreground");

assert.equal(manifest.background_color, "#07111f", "Installed app background must match the dark theme");
assert.equal(manifest.theme_color, "#07111f", "Installed app theme must match the dark theme");
for (const asset of ["./index.html", "./css/academy.css", "./workshops.html", "./fonts/Vazirmatn-Variable.woff2", "./js/academy-data.js"]) {
  assert.ok(serviceWorker.includes('"' + asset + '"'), "Offline cache must include " + asset);
}
assert.match(serviceWorker, /cctv-academy-static-v__BUILD_VERSION__/, "Build must version the offline cache to avoid stale styles");

console.log(JSON.stringify({status:"passed", checks:20, theme:"dark-cyber", rtl:true, offlineAssets:"local"}, null, 2));
