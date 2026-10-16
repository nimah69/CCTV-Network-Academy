import assert from "node:assert/strict";
import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const academyCss = fs.readFileSync("css/academy.css", "utf8");
const workshops = fs.readFileSync("workshops.html", "utf8");
const guard = /@media\s*\(max-width:\s*390px\)[\s\S]*?body,\s*body\s*\*\s*\{\s*font-size:\s*max\(13px,\s*1em\)\s*!important;\s*\}/;
for (const [name, styles] of [["index.html / css/academy.css", academyCss], ["workshops.html", workshops]]) {
  assert.match(styles, guard, name + ": narrow-screen typography must have a 13px minimum");
  assert.match(styles, /min-height:\s*44px/, name + ": touch targets need a 44px minimum height");
  assert.match(styles, /min-width:\s*44px/, name + ": touch targets need a 44px minimum width");
  assert.match(styles, /overflow-wrap:\s*anywhere/, name + ": long labels must be allowed to wrap");
  assert.match(styles, /overflow-x:\s*clip/, name + ": narrow layouts must guard against horizontal overflow");
}
assert.match(index, /<meta name="viewport" content="width=device-width,\s*initial-scale=1">/, "Main page must use the device viewport");
assert.match(academyCss, /env\(safe-area-inset-bottom\)/, "Main page stylesheet must account for bottom safe area");
assert.match(workshops, /env\(safe-area-inset-bottom\)/, "Workshop page must account for bottom safe area");
assert.match(workshops, /<meta name="viewport" content="width=device-width,\s*initial-scale=1">/, "Workshop page must use the device viewport");
console.log(JSON.stringify({status:"passed",scope:"structural CSS checks only", note:"real viewport measurements require browser/device testing",minimumFontPx:13,minimumTouchHeightPx:44,realDeviceLayoutTested:false}, null, 2));
