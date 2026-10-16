import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const start = html.indexOf("function technicalDetailHTML(p){");
assert.ok(start >= 0, "technicalDetailHTML must exist");
const end = html.indexOf("\nfunction ", start + 1);
assert.ok(end > start, "technicalDetailHTML must have a bounded function body");
const source = html.slice(start, end);
const sandbox = { esc: (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])) };
vm.runInNewContext(source + "\nthis.renderTechnicalDetail = technicalDetailHTML;", sandbox);
const cases = [
  ["poe", "PoE Injector"],
  ["nvr", "SATA"],
  ["remote", "VPN"],
  ["analog", "BNC"],
  ["fiber", "SFP"],
  ["wireless", "رادیو"],
  ["ups", "UPS"],
  ["vlan", "VLAN"],
  ["ip", "RJ45/Ethernet"]
];
const ids = [...html.matchAll(/\{id:"(poe|nvr|remote|analog|fiber|wireless|ups|vlan|ip)",keys:/g)].map((m) => m[1]);
assert.deepEqual(ids, cases.map(([id]) => id), "All nine diagram patterns need stable, ordered IDs");
for (const [id, expected] of cases) {
  const output = sandbox.renderTechnicalDetail({ id, title: "irrelevant title", diagram: "irrelevant text" });
  assert.ok(output.includes(expected), id + " must render its matching technical details");
}
const css = fs.readFileSync("css/academy.css", "utf8");
assert.ok(!css.includes(".@media(max-width:620px)"), "Media queries must not have the invalid .@media prefix");
assert.match(css, /\.tools-presets\{[^}]*grid-template-columns:1fr/, "Tool presets must become single-column on narrow mobile");
assert.match(css, /\.tool-summary\{grid-template-columns:1fr/, "Tool summaries must become single-column on narrow mobile");
console.log(JSON.stringify({ status: "passed", diagramPatterns: cases.length, mobileCssGuards: true }, null, 2));
