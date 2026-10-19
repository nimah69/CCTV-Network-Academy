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

// Regression checks for answer keys in safety-, security-, and design-critical scenarios.
const expectedCorrectActions = new Map([
 ["تمرین ساده: دسترسی از بیرون شبکه لازم است","دسترسی مستقیم غیرضروری را ببند؛ از VPN یا روش امن پشتیبانی‌شده با احراز هویت چندمرحله‌ای استفاده کن"],
 ["تمرین ساده: کاربران و دوربین‌ها در یک شبکه‌اند","دوربین‌ها را در VLAN جدا بگذار و در دیواره آتش فقط جریان‌های لازم بین دوربین‌ها، دستگاه ضبط و مدیران را مجاز کن"],
 ["تمرین ساده: خرابی دیسک دستگاه ضبط شبکه","خطاها و وضعیت دیسک‌ها را ثبت کن؛ طبق دستور سازنده اقدام و ضبط و بازپخش را پس از تعمیر آزمایش کن"],
 ["تمرین ساده: میزان داده قابل از دست‌رفتن/زمان مجاز بازیابی نامشخص","زمان بازیابی و میزان داده قابل‌از‌دست‌رفتن را با مالک سامانه تعیین کن و طرح پشتیبان‌گیری را بر همان اساس تنظیم کن"],
 ["تمرین ساده: «فضای کافی» معیار روشنی نیست","با ذی‌نفع، روز نگهداری، ساعت ضبط، نرخ بیت و ظرفیت قابل استفاده را مشخص کن"],
 ["تمرین ساده: تصویر شب هاله دارد","بازتاب مادون‌قرمز و شیشه را بررسی کن؛ لنز را تمیز و نوردهی و WDR/BLC را مرحله‌ای بسنج"],
 ["تمرین ساده: ping موفق است؛ پس همه‌چیز سالم است؟","پینگ فقط پاسخ شبکه را نشان می‌دهد؛ پورت، احراز هویت، جریان ویدئو و ضبط را جداگانه آزمایش کن"],
 ["تمرین ساده: نرخ بیت با نرخ فریم فرق دارد","نرخ بیت را داده در ثانیه و نرخ فریم را تصویر در ثانیه تعریف کن؛ اثر هر دو را بر کیفیت و ذخیره‌سازی مقایسه کن"],
 ["تمرین ساده: رمز را در گروه پیام‌رسان بفرستیم؟","برای هر کاربر حساب جدا و حداقل دسترسی تعریف کن؛ رمز را در گروه نفرست و از روش امن مدیریت رمز استفاده کن"]
]);
for (const [title, expectedAction] of expectedCorrectActions) {
 const scenario = groups.flat().find(item => item.title === title);
 assert.ok(scenario, `Missing critical regression scenario: ${title}`);
 assert.equal(scenario.options[scenario.answer], expectedAction, `Unsafe or mismatched answer key in: ${title}`);
}
groups.forEach((scenarios,c)=>{assert.equal(scenarios.length,5,"Each chapter must have five scenarios");scenarios.forEach((s,i)=>{
 assert.ok(s.title.startsWith("تمرین"),"Every scenario needs a meaningful title");
 assert.ok(s.context&&s.check&&s.why&&s.clue,"Every scenario needs clear content");
 assert.equal(s.options.length,3);assert.ok(s.answer>=0&&s.answer<3);
 assert.equal(s.check,s.options[s.answer],`Scenario ${c+1}:${i+1} check text must match its keyed correct action`);
 const visibleText=[s.title,s.context,s.check,s.why,s.clue,...s.options,s.simulator.prompt,s.simulator.pass,s.simulator.fail,s.simulator.next].join(" ");
 assert.ok(!/…|\.{3,}|کدک(?:\s+کدک)+|پاسخ پاسخ شبکه|Fنور مادون‌قرمزmware/.test(visibleText),`Scenario ${c+1}:${i+1} contains truncated or corrupted text`);
 assert.ok(s.options.every(option=>option.length>=8&&option.length<=180),`Scenario ${c+1}:${i+1} has an implausibly short or long answer option`);
 assert.notEqual(s.simulator.pass,s.simulator.fail,"Simulator outcomes must be distinguishable");
 assert.ok(s.simulator.prompt&&s.simulator.pass&&s.simulator.fail&&s.simulator.next,"Each scenario needs a working simulator path");
 assert.ok(s.nodes.length===3,"Each scenario uses the new three-step model");
});});
assert.ok(uiSource.includes("بررسی تشخیصی و جمع‌آوری شواهد"));
assert.ok(uiSource.includes("function advanceLabSimulator"));
assert.ok(uiSource.includes("function runChapterLabSimulation(actionIndex)"));
assert.ok(!uiSource.includes("function setLabSimulatorOutcome"),"Learners must not choose the simulator outcome directly");
assert.ok(!uiSource.includes("function setChapterLabFault"));
const context={window:{CCTVChapterLabs:[]},state:{chapter:0,labScenario:0,labDraft:null,labSimStep:0,labSimOutcome:"",progress:{labs:{},done:[]}},chapters:[{title:"فصل آزمایشی"}],saveProgress(){},render(){},alert(){},console};
vm.createContext(context);vm.runInContext(uiSource,context,{filename:"js/chapter-lab-ui.js"});
context.window.CCTVChapterLabs=[groups[0]];
assert.ok(context.chapterLabHTML().includes("بررسی تشخیصی و جمع‌آوری شواهد"));
context.advanceLabSimulator(1);assert.equal(context.state.labSimStep,1);
context.runChapterLabSimulation(context.chapterLabSimulatorChoices(groups[0][0]).answer);assert.equal(context.state.labSimOutcome,"pass");assert.equal(context.state.labSimStep,2);
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
  const diagnostic=allLabsContext.chapterLabSimulatorChoices(scenario);
  assert.equal(diagnostic.options.length,3,`Scenario ${chapterIndex+1}:${scenarioIndex+1} needs three diagnostic choices`);
  assert.equal(new Set(diagnostic.options).size,3,`Scenario ${chapterIndex+1}:${scenarioIndex+1} diagnostic choices must be distinct`);
  assert.equal(diagnostic.options[diagnostic.answer],scenario.clue,`Scenario ${chapterIndex+1}:${scenarioIndex+1} must key its scenario-specific diagnostic clue`);
  assert.ok(rendered.includes("آزمون تشخیصی")&&rendered.includes(allLabsContext.chapterLabEsc(scenario.title)),`Scenario ${chapterIndex+1}:${scenarioIndex+1} needs a scenario-specific diagnostic question`);
  assert.ok(diagnostic.options.every(option=>rendered.includes(allLabsContext.chapterLabEsc(option))),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must show its own diagnostic choices`);
  assert.ok(!rendered.includes("cl-btn-success"),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must not reveal the answer before selection`);
  assert.ok(!scenario.options.every(option=>rendered.includes(allLabsContext.chapterLabEsc(option))),`Scenario ${chapterIndex+1}:${scenarioIndex+1} simulator must not duplicate the separate action quiz`);
  assert.ok(allLabsContext.chapterLabSimulatorFeedback(scenario,diagnostic.answer).includes(scenario.why));
  const wrongFeedback=diagnostic.options.map((_,optionIndex)=>optionIndex).filter(optionIndex=>optionIndex!==diagnostic.answer).map(optionIndex=>allLabsContext.chapterLabSimulatorFeedback(scenario,optionIndex));
  assert.equal(new Set(wrongFeedback).size,wrongFeedback.length,`Scenario ${chapterIndex+1}:${scenarioIndex+1} needs distinct feedback for each wrong diagnostic choice`);
  for(const optionIndex of diagnostic.options.map((_,optionIndex)=>optionIndex).filter(optionIndex=>optionIndex!==diagnostic.answer)){
   const feedback=allLabsContext.chapterLabSimulatorFeedback(scenario,optionIndex);
   assert.ok(feedback.includes(scenario.title)&&feedback.includes(diagnostic.options[optionIndex]),`Scenario ${chapterIndex+1}:${scenarioIndex+1} feedback must identify the actual scenario and selected diagnostic`);
   assert.notEqual(feedback,allLabsContext.chapterLabSimulatorFeedback(scenario,diagnostic.answer));
  }
  scenarioCountChecked++;
 }
}
assert.equal(scenarioCountChecked,70,"All 70 practical scenarios must be checked by regression tests");
allLabsContext.state.labSimStep=2;
allLabsContext.state.labSimOutcome="fail";
allLabsContext.state.labSimAction=1;
const resultHtml=allLabsContext.chapterLabSimulatorHTML(groups[0][0]);
assert.ok(resultHtml.includes(allLabsContext.chapterLabEsc(allLabsContext.chapterLabSimulatorFeedback(groups[0][0],1))));
// Reset must clear all simulator selections and outcomes.
allLabsContext.resetLabSimulator();
assert.equal(allLabsContext.state.labSimStep,0);
assert.equal(allLabsContext.state.labSimOutcome,"");
assert.equal(allLabsContext.state.labSimAction,null);
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(inlineScripts.length>=2,"Expected both inline scripts in index.html");
inlineScripts.forEach((match,index)=>new vm.Script(match[1],{filename:"index.html:inline-script-"+(index+1)}));
console.log("Beginner labs checks passed: 14 chapters, 70 scenarios, distinct diagnostic simulator, answer saving and retry.");
