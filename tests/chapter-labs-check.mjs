import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const bankSource=fs.readFileSync("js/chapter-labs.js","utf8");
const uiSource=fs.readFileSync("js/chapter-lab-ui.js","utf8");
assert.ok(html.includes('<script src="js/chapter-labs.js"></script>'));
assert.ok(html.includes('<script src="js/chapter-lab-ui.js"></script>'));
assert.ok(html.includes('state.view==="chapterLab"'));
new vm.Script(uiSource,{filename:"js/chapter-lab-ui.js"});
const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(bankSource,sandbox,{filename:"js/chapter-labs.js"});
const groups=sandbox.window.CCTVChapterLabs;
assert.equal(groups.length,14,"14 chapters must exist");
assert.equal(groups.flat().length,70,"All 70 scenarios must exist");
groups.forEach((scenarios,c)=>{assert.equal(scenarios.length,5,"Each chapter must have five scenarios");scenarios.forEach((s,i)=>{
 assert.ok(s.title.startsWith("تمرین"),"Every scenario needs a meaningful title");
 assert.ok(s.context&&s.check&&s.why&&s.clue,"Every scenario needs clear content");
 assert.equal(s.options.length,3);assert.ok(s.answer>=0&&s.answer<3);
 const visibleText=[s.title,s.context,s.check,s.why,s.clue,...s.options,s.simulator.prompt,s.simulator.pass,s.simulator.fail,s.simulator.next].join(" ");
 assert.ok(!/…|\.{3,}|کدک(?:\s+کدک)+|پاسخ پاسخ شبکه|Fنور مادون‌قرمزmware/.test(visibleText),`Scenario ${c+1}:${i+1} contains truncated or corrupted text`);
 assert.ok(s.options.every(option=>option.length>=8&&option.length<=180),`Scenario ${c+1}:${i+1} has an implausibly short or long answer option`);
 assert.notEqual(s.simulator.pass,s.simulator.fail,"Simulator outcomes must be distinguishable");
 assert.ok(s.simulator.prompt&&s.simulator.pass&&s.simulator.fail&&s.simulator.next,"Each scenario needs a working simulator path");
 assert.ok(s.nodes.length===3,"Each scenario uses the new three-step model");
});});
assert.ok(uiSource.includes("بررسی مسئله و انتخاب اقدام"));
assert.ok(uiSource.includes("function advanceLabSimulator"));
assert.ok(uiSource.includes("function runChapterLabSimulation(actionIndex)"));
assert.ok(!uiSource.includes("function setLabSimulatorOutcome"),"Learners must not choose the simulator outcome directly");
assert.ok(!uiSource.includes("function setChapterLabFault"));
const context={window:{CCTVChapterLabs:[]},state:{chapter:0,labScenario:0,labDraft:null,labSimStep:0,labSimOutcome:"",progress:{labs:{},done:[]}},chapters:[{title:"فصل آزمایشی"}],saveProgress(){},render(){},alert(){},console};
vm.createContext(context);vm.runInContext(uiSource,context,{filename:"js/chapter-lab-ui.js"});
context.window.CCTVChapterLabs=[groups[0]];
assert.ok(context.chapterLabHTML().includes("بررسی مسئله و انتخاب اقدام"));
context.advanceLabSimulator(1);assert.equal(context.state.labSimStep,1);
context.runChapterLabSimulation(groups[0][0].answer);assert.equal(context.state.labSimOutcome,"pass");assert.equal(context.state.labSimStep,2);
context.advanceLabSimulator(1);context.runChapterLabSimulation((groups[0][0].answer+1)%3);assert.equal(context.state.labSimOutcome,"fail");
context.state.labDraft=groups[0][0].answer;context.runChapterLabScenario();assert.equal(context.state.progress.labs["0:0"].correct,true);
context.retryChapterLabScenario(0);assert.equal(context.state.progress.labs["0:0"],undefined);

// Regression coverage for the shared simulator across all 70 scenarios.
const allLabsContext={
 window:{CCTVChapterLabs:groups},
 state:{chapter:0,labScenario:0,labDraft:null,labSimStep:0,labSimOutcome:"",labSimAction:null,progress:{labs:{},done:[]}},
 chapters:[],saveProgress(){},render(){},alert(){},console
};
vm.createContext(allLabsContext);
vm.runInContext(uiSource,allLabsContext,{filename:"js/chapter-lab-ui.js:all-scenarios"});
let scenarioCountChecked=0;
for(const [chapterIndex,scenarios] of groups.entries()){
 for(const [scenarioIndex,scenario] of scenarios.entries()){
  allLabsContext.state.chapter=chapterIndex;
  allLabsContext.state.labScenario=scenarioIndex;
  allLabsContext.state.labSimStep=0;
  let rendered=allLabsContext.chapterLabSimulatorHTML(scenario);
  assert.ok(rendered.includes(allLabsContext.chapterLabEsc(scenario.context)),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must start from its own situation`);
  assert.ok(!rendered.includes(allLabsContext.chapterLabEsc(scenario.simulator.prompt)),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must not repeat the generic recommended-action prompt`);
  allLabsContext.state.labSimStep=1;
  rendered=allLabsContext.chapterLabSimulatorHTML(scenario);
  assert.ok(scenario.options.every(option=>rendered.includes(allLabsContext.chapterLabEsc(option))),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must show its own actions`);
  assert.ok(!rendered.includes("cl-btn-success"),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must not reveal the answer before selection`);
  assert.equal(allLabsContext.chapterLabDecisionFeedback(scenario,scenario.answer),scenario.why);
  const wrongFeedback=scenario.options.map((_,optionIndex)=>optionIndex).filter(optionIndex=>optionIndex!==scenario.answer).map(optionIndex=>allLabsContext.chapterLabDecisionFeedback(scenario,optionIndex));
  assert.equal(new Set(wrongFeedback).size,wrongFeedback.length,`Scenario ${chapterIndex+1}:${scenarioIndex+1} needs distinct feedback for each wrong action`);
  for(const [wrongIndex,optionIndex] of scenario.options.map((_,optionIndex)=>optionIndex).filter(optionIndex=>optionIndex!==scenario.answer).entries()){
   const feedback=allLabsContext.chapterLabDecisionFeedback(scenario,optionIndex);
   assert.ok(feedback.includes(scenario.title)&&feedback.includes(scenario.options[optionIndex]),`Scenario ${chapterIndex+1}:${scenarioIndex+1} feedback must identify the actual scenario and selected action`);
   assert.notEqual(feedback,scenario.why);
  }
  scenarioCountChecked++;
 }
}
assert.equal(scenarioCountChecked,70,"All 70 practical scenarios must be checked by regression tests");
allLabsContext.state.labSimStep=2;
allLabsContext.state.labSimOutcome="fail";
allLabsContext.state.labSimAction=1;
const resultHtml=allLabsContext.chapterLabSimulatorHTML(groups[0][0]);
assert.ok(resultHtml.includes(allLabsContext.chapterLabEsc(allLabsContext.chapterLabDecisionFeedback(groups[0][0],1))));
// Reset must clear all simulator selections and outcomes.
allLabsContext.resetLabSimulator();
assert.equal(allLabsContext.state.labSimStep,0);
assert.equal(allLabsContext.state.labSimOutcome,"");
assert.equal(allLabsContext.state.labSimAction,null);
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(inlineScripts.length>=2,"Expected both inline scripts in index.html");
inlineScripts.forEach((match,index)=>new vm.Script(match[1],{filename:"index.html:inline-script-"+(index+1)}));
console.log("Beginner labs checks passed: 14 chapters, 70 rewritten scenarios, simple three-step simulator, answer saving and retry.");
