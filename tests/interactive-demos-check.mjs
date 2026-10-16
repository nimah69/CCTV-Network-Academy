import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const calculations=fs.readFileSync("js/calculations.js","utf8");
const demos=fs.readFileSync("js/interactive-demos.js","utf8");
const sandbox={window:{}};
vm.runInNewContext(calculations,sandbox,{timeout:1000});
vm.runInNewContext(demos,sandbox,{timeout:1000});
const api=sandbox.window.CCTVInteractiveDemos;

assert.ok(api,"Interactive demo API must load without a browser DOM");
assert.match(html,/<script src="js\/interactive-demos\.js"><\/script>/,"The module must be loaded locally");
assert.ok(html.indexOf('src="js/calculations.js"')<html.indexOf('src="js/interactive-demos.js"'),"Calculations must load before the PoE demo");
assert.match(worker,/\.\/js\/interactive-demos\.js/,"Offline cache must include the new module");
assert.match(worker,/cctv-academy-static-v2026-10-16-4/,"Cache version must change with the new module");

const chapter1=api.renderForChapter(0);
const chapter3=api.renderForChapter(2);
const chapter9=api.renderForChapter(8);
assert.match(chapter1,/دوربین IP[\s\S]*سوئیچ PoE[\s\S]*NVR/,"Chapter 1 must show the camera-switch-NVR path");
assert.match(chapter1,/data-layer="data"/,"The data layer must be selectable");
assert.match(chapter1,/data-layer="power"/,"The power layer must be selectable");
assert.match(chapter1,/data-demo-action="path-cut"/,"The cable cut action must exist");
assert.match(chapter1,/فرض آموزشی[\s\S]*PoE/,"The demo must explain the PoE assumption");
assert.match(chapter3,/demo-path-card/,"Chapter 3 must include the data/power path");
assert.match(chapter3,/demo-poe-card/,"Chapter 3 must include the PoE budget demo");
assert.match(chapter3,/data-demo-action="poe-add"/,"Camera count can be increased");
assert.match(chapter3,/data-demo-action="poe-remove"/,"Camera count can be decreased");
assert.match(chapter3,/اقدام پیشنهادی/,"PoE results must include a recommended action");
assert.match(chapter3,/جایگزین دیتاشیت/,"PoE demo must disclaim datasheet replacement");
assert.match(chapter9,/برق \/ Link[\s\S]*IP[\s\S]*سرویس تصویر/,"Chapter 9 must present the troubleshooting stages in order");
assert.match(chapter9,/data-demo-action="tree-choice"/,"The no-image tree must accept user choices");
assert.match(chapter9,/evaluateTreeChoice/,"Tree answers must be evaluated with reasons");
for(const rendered of [chapter1,chapter3,chapter9]){
 assert.doesNotMatch(rendered,/<svg\b/i,"Interactive demos must use HTML/CSS, not SVG");
 assert.match(rendered,/aria-label|aria-live|role="status"/,"Demo feedback must have accessible semantics");
}
assert.equal(api.evaluatePoe(6,8,90,20).status,"enough");
assert.equal(api.evaluatePoe(8,8,90,20).status,"borderline");
assert.equal(api.evaluatePoe(10,8,90,20).status,"insufficient");
assert.ok(api.evaluatePoe(10,8,90,20).advice.length>20,"PoE status must include actionable guidance");
const tree0=api.evaluateTreeChoice(0,"ok");
assert.equal(tree0.nextStep,1);
assert.match(tree0.reason,/IP/);
assert.equal(api.evaluateTreeChoice(0,"fault").terminal,true);
const tree1=api.evaluateTreeChoice(1,"ok");
assert.equal(tree1.nextStep,2);
assert.match(tree1.reason,/Stream/);
assert.equal(api.evaluateTreeChoice(1,"fault").terminal,true);
assert.equal(api.evaluateTreeChoice(2,"fault").terminal,true);
assert.equal(api.evaluateTreeChoice(2,"ok").terminal,true);
assert.match(html,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,"PoE inputs must use a responsive grid");
assert.match(html,/@media\(max-width:380px\)/,"Mobile layout rules must cover 360px screens");
assert.match(html,/min-width:0/,"Demo cards and flow nodes must allow shrinking on narrow screens");

console.log(JSON.stringify({status:"passed",demos:["data-power-path","poe-budget","no-image-tree"],poeStatuses:["enough","borderline","insufficient"],svgCount:0},null,2));
