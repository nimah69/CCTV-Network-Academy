import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("schematics.html", "utf8");
assert.match(html, /<html\\b[^>]*lang=["']fa["'][^>]*dir=["']rtl["']|<html\\b[^>]*dir=["']rtl["'][^>]*lang=["']fa["']/i,
  "Schematic lab must declare Persian RTL layout");
assert.ok(html.includes("<svg") && html.includes('role="img"'),
  "The schematic lab must contain accessible SVG diagrams");
assert.ok(["poeCanvas", "cidrSelect", "troubleChoices", "capacityMeter", "topologyToggle"].every(id => html.includes('id="' + id + '"')),
  "The key visual lab interactions must be present");
assert.ok(html.includes("prefers-reduced-motion"),
  "Animations must respect reduced-motion preferences");
assert.ok(!/<(?:script|link|img)\\b[^>]*(?:src|href)=["']https?:/i.test(html),
  "The schematic lab must not depend on external runtime assets");
const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].map(match => match[1]);
assert.equal(scripts.length, 1, "Expected one self-contained interaction script");
new vm.Script(scripts[0], { filename: "schematics.html:inline-script" });

const expectedInteractions = [
  'addEventListener("click"', 'addEventListener("change"', 'addEventListener("input"',
  "function updateSubnet()", "function updateCapacity()"
];
for (const interaction of expectedInteractions) {
  assert.ok(scripts[0].includes(interaction), "Missing interaction: " + interaction);
}

console.log(JSON.stringify({
  status: "passed",
  accessibleSvgSchematics: (html.match(/<svg\\b/g) || []).length,
  interactiveModules: 5,
  externalRuntimeDependencies: 0
}, null, 2));
