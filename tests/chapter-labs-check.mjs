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
new vm.Script(uiSource,{filename:"js/chapter-lab-ui.js"});
assert.ok(uiSource.includes("function chapterLabSimulatorHTML"),"The guided simulator must render");
assert.ok(uiSource.includes("function selectLabSimulatorNode"),"The learner must be able to select a path component");
assert.ok(uiSource.includes("function setLabSimulatorOutcome"),"The learner must be able to record an observation");
assert.ok(uiSource.includes("معنی چند اصطلاح این تمرین"),"Plain-language glossary must be available");
assert.ok(!uiSource.includes("function setChapterLabFault"),"Confusing fault-injection controls must be removed");
const context={
 window:{CCTVChapterLabs:[]},
 state:{chapter:0,labScenario:0,labDraft:null,labSimNode:0,labSimOutcome:"",progress:{labs:{},done:[]}},
 chapters:[{title:"فصل آزمایشی"}],
 saveProgress(){},render(){},alert(){},console
};
vm.createContext(context);
vm.runInContext(uiSource,context,{filename:"js/chapter-lab-ui.js"});
context.window.CCTVChapterLabs=[[{title:"آزمون",context:"دوربین تصویر ندارد",options:["بررسی IP","تعویض NVR","افزایش رزولوشن"],answer:0,why:"ابتدا ارتباط را بررسی کن",clue:"یک مورد را تغییر بده",nodes:["رایانه","سوئیچ","دوربین IP"]}]];
context.state.progress.labs={};
const advice=context.chapterLabAdvice("سوئیچ PoE");
assert.ok(advice.steps.length>=3,"Every component should show an actionable checklist");
context.selectLabSimulatorNode(1);
assert.equal(context.state.labSimNode,1,"Selecting a path node must update simulator state");
context.setLabSimulatorOutcome("ok");
assert.equal(context.state.labSimOutcome,"ok","Simulator observations must update state");
context.state.labDraft=0;
context.runChapterLabScenario();
assert.equal(context.state.progress.labs["0:0"].correct,true,"A correct scenario decision must be recorded");
context.retryChapterLabScenario(0);
assert.equal(context.state.progress.labs["0:0"],undefined,"Retry must reset the selected scenario");
const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(bankSource,sandbox,{filename:"js/chapter-labs.js"});
const chapters=sandbox.window.CCTVChapterLabs;
assert.equal(chapters.length,14,"There must be a practical lab for each of 14 chapters");
chapters.forEach((scenarios,chapterIndex)=>{
 assert.equal(scenarios.length,5,"Chapter "+(chapterIndex+1)+" must have exactly 5 scenarios");
 const titles=new Set();
 scenarios.forEach((scenario,scenarioIndex)=>{
  assert.ok(scenario.title&&scenario.context&&scenario.why&&scenario.clue,"Scenario needs title, context, explanation and next step");
  assert.equal(scenario.options.length,3,"Each scenario must provide 3 choices");
  assert.ok(Number.isInteger(scenario.answer)&&scenario.answer>=0&&scenario.answer<scenario.options.length,"Correct option index must be valid");
  assert.ok(Array.isArray(scenario.nodes)&&scenario.nodes.length>=3,"Scenario needs a path with at least 3 components");
  assert.ok(scenario.options.every(option=>typeof option==="string"&&option.length>10),"Each option must contain meaningful text");
  assert.ok(!titles.has(scenario.title),"Scenario titles should be unique within each chapter");
  titles.add(scenario.title);
 });
});
const inlineStart=html.indexOf("<script>");
const inlineEnd=html.lastIndexOf("</script>");
assert.ok(inlineStart>=0&&inlineEnd>inlineStart,"Application inline script must exist");
new vm.Script(html.slice(inlineStart+8,inlineEnd),{filename:"index.html:inline-script"});
console.log("Chapter labs checks passed: 14 chapters, 70 scenarios, guided simulator, plain-language glossary, decision recording and retry.");
