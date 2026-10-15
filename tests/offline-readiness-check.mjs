import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pages = ["index.html", "workshops.html", "schematics.html"];
const localFiles = new Set();

function resolveLocalReference(reference, page) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("#") || clean.startsWith("//") || /^(?:data:|blob:|https?:|mailto:|tel:)/i.test(clean)) return null;
  const decoded = decodeURIComponent(clean);
  return path.posix.normalize(path.posix.join(path.posix.dirname(page), decoded)).replace(/^\.\//, "");
}

for (const page of pages) {
  assert.ok(fs.existsSync(path.join(root, page)), `Required page is missing: ${page}`);
  const html = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(html, /<html\b[^>]*lang=["']fa["'][^>]*dir=["']rtl["']|<html\b[^>]*dir=["']rtl["'][^>]*lang=["']fa["']/i,
    `${page} must declare Persian RTL layout`);

  const resourceTags = html.match(/<(?:script|img|source|audio|video|iframe|link)\b[^>]*>/gi) || [];
  for (const tag of resourceTags) {
    const isStylesheet = /^<link\b/i.test(tag) && /rel=["'][^"']*stylesheet/i.test(tag);
    const isResource = /^<(?:script|img|source|audio|video|iframe)\b/i.test(tag) || isStylesheet;
    if (!isResource) continue;

    const attr = /^<script\b/i.test(tag) ? "src" :
      /^<link\b/i.test(tag) ? "href" : "src";
    const match = tag.match(new RegExp("\\b" + attr + "=[\"']([^\"']+)[\"']", "i"));
    if (!match) {
      if (/^<script\b/i.test(tag) && !/\bsrc=/i.test(tag)) continue;
      continue;
    }

    const reference = match[1];
    assert.ok(!/^(?:https?:)?\/\//i.test(reference),
      `${page} must not load a runtime dependency from the network: ${reference}`);
    const localPath = resolveLocalReference(reference, page);
    if (localPath === null) continue;
    localFiles.add(localPath);
    assert.ok(fs.existsSync(path.join(root, localPath)),
      `${page} references a missing local resource: ${reference} -> ${localPath}`);
  }
}

const mainHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const workshopHtml = fs.readFileSync(path.join(root, "workshops.html"), "utf8");
assert.ok(mainHtml.includes('const storeKey="cctvAcademyProgressV1";'),
  "The established learning-progress storage key must remain unchanged");
assert.ok(mainHtml.includes("function exportProgress") && mainHtml.includes("function importProgressFile"),
  "Progress export and import must remain available");
assert.ok(mainHtml.includes("function normalizeProgress"),
  "Progress import must normalize legacy data instead of discarding existing fields");
assert.ok(workshopHtml.includes("localStorage"),
  "Workshop progress must continue to persist locally");
assert.ok(!/\b(?:fetch|XMLHttpRequest)\s*\(/.test(mainHtml + workshopHtml),
  "Core pages should not require network requests for their initial content");

console.log(JSON.stringify({
  status: "passed",
  pagesChecked: pages.length,
  localResourcesChecked: localFiles.size,
  progressKeyPreserved: true,
  progressBackupAvailable: true,
  coreRuntimeExternalDependencies: 0
}, null, 2));
