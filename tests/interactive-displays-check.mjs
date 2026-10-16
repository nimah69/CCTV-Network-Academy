import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root=process.cwd();
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
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
const troubleshooting=displays.renderForChapter(8);
assert.match(troubleshooting,/درخت تشخیص/);
assert.match(moduleText,/دسترسی IP/);
assert.match(moduleText,/سرویس تصویر/);
assert.match(html,/CCTVInteractiveDisplays\.renderForChapter\(state\.chapter\)/);
assert.match(sw,/js\/interactive-displays\.js/);
assert.match(sw,/cctv-academy-static-v2026-10-16-6/);
assert.match(html,/@media\(max-width:420px\)/);
console.log(JSON.stringify({status:"passed",pathDisplay:true,poeCalculation:true,troubleshootingTree:true,offlineCache:true},null,2));
