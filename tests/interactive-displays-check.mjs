import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root=process.cwd();
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const academyCss=fs.readFileSync(path.join(root,"css/academy.css"),"utf8");
const moduleText=fs.readFileSync(path.join(root,"js/interactive-displays.js"),"utf8");
const calcText=fs.readFileSync(path.join(root,"js/calculations.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const app=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("const chapters = window.CCTVAcademyData.chapters;"));
new vm.Script(app,{filename:"index.html:inline-script"});
new vm.Script(moduleText,{filename:"js/interactive-displays.js"});
const elements={
 "display-link-camera":{innerHTML:"",classList:{toggle(){}}},
 "display-camera":{classList:{toggle(){}}},
 "display-path-status":{textContent:""},
 "display-poe-count":{value:"8"},
 "display-poe-watts":{value:"8"},
 "display-poe-reserve":{value:"20"},
 "display-poe-budget":{value:"120"},
 "display-poe-result":{innerHTML:"",textContent:""},
 "display-tree-stage":{innerHTML:""}
};
const document={getElementById:id=>elements[id]||null,querySelectorAll:()=>[]};
const window={};
const context={window,document,Number,Math,String,Array,Object,JSON};
vm.createContext(context);
vm.runInContext(calcText,context);
vm.runInContext(moduleText,context);
const displays=window.CCTVInteractiveDisplays;
const path0=displays.renderForChapter(0);
assert.match(path0,/دوربین IP/);
assert.match(path0,/سوئیچ/);
assert.match(path0,/NVR/);
assert.match(path0,/لایه برق/);
assert.doesNotMatch(path0,/<svg/i,"Interactive display must use HTML/CSS rather than SVG");
displays.setLayer("power");
displays.toggleCable();
assert.match(elements["display-path-status"].textContent,/هر دو قطع/,"With PoE, cutting the shared cable must stop power and data");
const design=displays.renderForChapter(2);
assert.match(design,/بودجه توان PoE/);
displays.calculatePoE();
assert.match(elements["display-poe-result"].innerHTML,/وضعیت: کافی/,"PoE display must use the shared calculation module");
// Boundary checks: exact budget, configured margin, zero cameras, and invalid budget.
// This is a deterministic DOM-stub test; it does not claim a physical switch test.
elements["display-poe-budget"].value="76.8";
displays.calculatePoE();
assert.match(elements["display-poe-result"].innerHTML,/وضعیت: مرزی/,"Exact budget equality must be reported as marginal");
elements["display-poe-budget"].value="88.32";
displays.calculatePoE();
assert.match(elements["display-poe-result"].innerHTML,/وضعیت: کافی/,"Budget at the configured 15% margin must be reported as sufficient");
elements["display-poe-count"].value="0";
displays.calculatePoE();
assert.match(elements["display-poe-result"].textContent,/تعداد دوربین/,"Zero cameras must show a validation message");
elements["display-poe-count"].value="8";
elements["display-poe-budget"].value="not-a-number";
displays.calculatePoE();
assert.match(elements["display-poe-result"].textContent,/بودجه سوئیچ/,"Invalid budget must show a validation message");
assert.match(moduleText,/if\(treeState\.answers\[treeState\.step\]===undefined\)return/,"Troubleshooting tree must not advance without an answer");
const troubleshooting=displays.renderForChapter(8);
assert.match(troubleshooting,/درخت تشخیص/);
assert.match(moduleText,/دسترسی IP/);
assert.match(moduleText,/سرویس تصویر/);
assert.match(html,/CCTVInteractiveDisplays\.renderForChapter\(state\.chapter\)/);
assert.match(sw,/js\/interactive-displays\.js/);
assert.match(sw,/cctv-academy-static-v__BUILD_VERSION__/,"Source service worker must use a build-time cache version placeholder");
assert.match(academyCss,/@media\(max-width:420px\)/,"Mobile display rules must remain in the external academy stylesheet");
console.log(JSON.stringify({status:"passed",pathDisplay:true,poeCalculation:true,troubleshootingTree:true,offlineCache:true},null,2));
