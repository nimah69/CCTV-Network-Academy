import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const bankSource=fs.readFileSync("js/chapter-labs.js","utf8");
const uiSource=fs.readFileSync("js/chapter-lab-ui.js","utf8");
assert.ok(html.includes('<script src="js/chapter-labs.js"></script>'),"Scenario bank must load before app");
assert.ok(html.includes('<script src="js/chapter-lab-ui.js"></script>'),"Chapter lab UI must load before app");
assert.ok(html.includes('state.view==="chapterLab"'),"Router must render the chapter lab view");
assert.ok(html.includes("ورود به آزمایشگاه تعاملی فصل"),"Each lesson must provide a lab launch action");
assert.ok(html.includes('labs:p.labs&&typeof p.labs==="object"'),"Lab progress must be persisted in progress data");
new vm.Script(uiSource,{filename:"js/chapter-lab-ui.js"});
const sandbox={window:{},console};
vm.runInNewContext(bankSource,sandbox,{filename:"js/chapter-labs.js"});
const chapters=sandbox.window.CCTVChapterLabs;
assert.equal(chapters.length,14,"There must be a practical lab for each of 14 chapters");
chapters.forEach((scenarios,chapterIndex)=>{
 assert.equal(scenarios.length,5,"Chapter "+(chapterIndex+1)+" must have exactly 5 scenarios");
 const titles=new Set();
 scenarios.forEach((scenario,scenarioIndex)=>{
  assert.ok(scenario.title&&scenario.context&&scenario.why&&scenario.clue,"Scenario needs title, context, explanation and clue");
  assert.equal(scenario.options.length,3,"Each scenario must provide 3 choices");
  assert.ok(Number.isInteger(scenario.answer)&&scenario.answer>=0&&scenario.answer<scenario.options.length,"Correct option index must be valid");
  assert.ok(Array.isArray(scenario.nodes)&&scenario.nodes.length>=3,"Scenario needs a schematic path with at least 3 nodes");
  assert.ok(scenario.options.every(option=>typeof option==="string"&&option.length>10),"Scenario options must be meaningful text");
  assert.ok(!titles.has(scenario.title),"Scenario titles should be unique within each chapter");
  titles.add(scenario.title);
 });
});
const inlineStart=html.indexOf("<script>");
const inlineEnd=html.lastIndexOf("</script>");
assert.ok(inlineStart>=0&&inlineEnd>inlineStart,"Application inline script must exist");
new vm.Script(html.slice(inlineStart+8,inlineEnd),{filename:"index.html:inline-script"});
console.log("Chapter labs checks passed: 14 chapters, 70 practical scenarios, schematic paths, accessible choices and script syntax.");
