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
 assert.equal(s.options.length,4,"Every practical scenario must offer exactly four plausible actions");assert.ok(s.answer>=0&&s.answer<4);assert.equal(new Set(s.options).size,4,"Answer choices must be distinct");
 assert.equal(s.check,s.options[s.answer],`Scenario ${c+1}:${i+1} check text must match its keyed correct action`);
 const visibleText=[s.title,s.context,s.check,s.why,s.clue,...s.options,s.simulator.prompt,s.simulator.pass,s.simulator.fail,s.simulator.next].join(" ");
 assert.ok(!/…|\.{3,}|کدک(?:\s+کدک)+|پاسخ پاسخ شبکه|Fنور مادون‌قرمزmware/.test(visibleText),`Scenario ${c+1}:${i+1} contains truncated or corrupted text`);
 assert.ok(s.options.every(option=>option.length>=8&&option.length<=180),`Scenario ${c+1}:${i+1} has an implausibly short or long answer option`);
 });});
assert.ok(!uiSource.includes("chapterLabSimulatorHTML"),"The duplicate simulator UI must be removed");
assert.ok(!uiSource.includes("chapterLabSimulatorChoices"),"The duplicate diagnostic-choice logic must be removed");
assert.ok(!uiSource.includes("شبیه‌ساز تصمیم‌گیری"),"No duplicate simulator heading should remain in practical labs");
assert.ok(!uiSource.includes("شبیه‌ساز بالا را مرور کن"),"Action feedback must not refer to the removed simulator");
assert.ok(!uiSource.includes("runChapterLabSimulation"),"Removed simulator handlers must not remain");
const context={window:{CCTVChapterLabs:[]},state:{chapter:0,labScenario:0,labDraft:null,progress:{labs:{},done:[]}},chapters:[{title:"فصل آزمایشی"}],saveProgress(){},render(){},alert(){},console};
vm.createContext(context);vm.runInContext(uiSource,context,{filename:"js/chapter-lab-ui.js"});
context.window.CCTVChapterLabs=groups;
assert.ok(!context.chapterLabHTML().includes("شبیه‌ساز تصمیم‌گیری"),"The duplicate simulator must not render");
context.state.labDraft=groups[0][0].answer;context.runChapterLabScenario();assert.equal(context.state.progress.labs["0:0"].correct,true);
context.retryChapterLabScenario(0);assert.equal(context.state.progress.labs["0:0"],undefined);

// Verify that the single practical exercise remains usable for every scenario.
let scenarioCountChecked=0;
for(const [chapterIndex,scenarios] of groups.entries()){
 for(const [scenarioIndex,scenario] of scenarios.entries()){
  context.state.chapter=chapterIndex;
  context.state.labScenario=scenarioIndex;
  context.state.labDraft=null;
  const rendered=context.chapterLabHTML();
  assert.ok(rendered.includes(context.chapterLabEsc(scenario.context)),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must show its own situation`);
  assert.ok(rendered.includes(context.chapterLabEsc(scenario.options[0])),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must render the action choices`);
  assert.ok(!rendered.includes("cl-simulator"),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must not render the duplicate simulator`);
  assert.ok(!rendered.includes("بررسی تشخیصی و جمع‌آوری شواهد"),`Scenario ${chapterIndex+1}:${scenarioIndex+1} must not show the removed section`);
  assert.ok(!rendered.includes("شبیه‌ساز بالا را مرور کن"),`Scenario ${chapterIndex+1}:${scenarioIndex+1} feedback must not reference the removed simulator`);
  scenarioCountChecked++;
 }
}
assert.equal(scenarioCountChecked,70,"All 70 practical scenarios must be checked");
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(inlineScripts.length>=2,"Expected both inline scripts in index.html");
inlineScripts.forEach((match,index)=>new vm.Script(match[1],{filename:"index.html:inline-script-"+(index+1)}));
const answerPositionCounts=[0,0,0,0];groups.flat().forEach(s=>answerPositionCounts[s.answer]++);assert.ok(answerPositionCounts.every(n=>n>=10),"Correct answers must be distributed across all four positions");
console.log("Beginner labs checks passed: 14 chapters, 70 scenarios, four distinct action choices, varied answer positions, answer saving and retry.");

// UI regression: the shared "از صفر شروع کن" lab must keep Persian text RTL and wrap safely on mobile.
const labUi = (await import("node:fs")).readFileSync("js/chapter-lab-ui.js", "utf8");
assert.ok(labUi.includes("direction:rtl;text-align:right;unicode-bidi:plaintext"), "Chapter lab text must use explicit Persian RTL flow");
assert.ok(labUi.includes("overflow-wrap:anywhere;word-break:normal"), "Chapter lab text must wrap without clipping or breaking Persian words arbitrarily");
assert.ok(labUi.includes(".cl-lab *{box-sizing:border-box;min-width:0}"), "Chapter lab children must be constrained to prevent mobile overflow");
const embeddedStyle = labUi.match(/<style>([\s\S]*?)<\/style>/)?.[1] || "";
assert.ok(embeddedStyle, "The beginner-lab embedded stylesheet must exist");
assert.ok(!/\.{3,}/.test(embeddedStyle), "The beginner-lab stylesheet must not contain malformed ellipsis selectors");
assert.ok(embeddedStyle.includes(".cl-answers{border:0;padding:0;margin:16px 0}"), "Answer fieldset styles must be a valid CSS rule");
assert.ok(embeddedStyle.includes(".cl-progress-row{align-items:flex-start;flex-direction:column}"), "Mobile progress layout rule must be present and valid");
