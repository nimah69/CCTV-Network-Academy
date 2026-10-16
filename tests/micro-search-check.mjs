import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root=process.cwd();
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const data=fs.readFileSync(path.join(root,"js/academy-data.js"),"utf8");
const micro=fs.readFileSync(path.join(root,"js/micro-lessons.js"),"utf8");
const app=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("const chapters = window.CCTVAcademyData.chapters;"));
new vm.Script(app,{filename:"index.html:inline-script"});
assert.match(html,/function openSearchMicroLesson\(chapterIndex,lessonIndex\)/);
assert.match(html,/function homeHTML\(showAll=false\)/);
for(const field of ["title","definition","expandedExplanation","why","example","commonMistake","systemConnection","tip"])assert.ok(html.includes("item.lesson."+field),"Search must include micro lesson field: "+field);
assert.match(html,/نتایج جست‌وجو در ریزدرس‌ها/);
const sandbox={window:{}};
vm.runInNewContext(data,sandbox);
vm.runInNewContext(micro,sandbox);
const chapters=sandbox.window.CCTVAcademyData.chapters;
const all=chapters.flatMap(ch=>sandbox.window.CCTVMicroLessons.build(ch).map(lesson=>({chapter:ch.title,lesson})));
for(const term of ["VLAN","PoE","RAID","سؤال چهارگزینه‌ای","مصاحبه فنی"]){
 assert.ok(all.some(item=>(item.chapter+" "+Object.values(item.lesson).filter(v=>typeof v==="string").join(" ")).toLowerCase().includes(term.toLowerCase())),"Search corpus should contain: "+term);
}
assert.match(html,/شماره صفحه PDF نیازمند تطبیق/,"Unverified PDF page references must remain cautious");
console.log(JSON.stringify({status:"passed",chapters:chapters.length,searchableMicroLessons:all.length,searches:["VLAN","PoE","RAID","سؤال چهارگزینه‌ای","مصاحبه فنی"]},null,2));
