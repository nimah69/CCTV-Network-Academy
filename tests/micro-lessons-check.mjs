import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root=process.cwd();
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const micro=fs.readFileSync(path.join(root,"js/micro-lessons.js"),"utf8");
const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const data=fs.readFileSync(path.join(root,"js/academy-data.js"),"utf8");
const appScript=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("const chapters = window.CCTVAcademyData.chapters;"));
assert.ok(appScript,"Main application script must exist");
new vm.Script(appScript,{filename:"index.html:inline-script"});
new vm.Script(micro,{filename:"js/micro-lessons.js"});
const sandbox={window:{}};
new vm.Script(data,{filename:"js/academy-data.js"}).runInNewContext(sandbox);
new vm.Script(micro,{filename:"js/micro-lessons.js"}).runInNewContext(sandbox);
const chapters=sandbox.window.CCTVAcademyData.chapters;
assert.equal(chapters.length,14,"All 14 chapters must remain available");
for(const chapter of chapters){
 const lessons=sandbox.window.CCTVMicroLessons.build(chapter);
 assert.ok(lessons.length>=3&&lessons.length<=5,"Chapter must have 3–5 micro lessons: "+chapter.title);
 for(const [i,lesson] of lessons.entries()){
  assert.ok(lesson.title&&lesson.definition&&lesson.why&&lesson.example&&lesson.tip,"Each micro lesson must have the required learning fields: "+chapter.title+" / "+i);
  assert.equal(lesson.minutes,4,"Each micro lesson should target a 3–5 minute duration");
  assert.ok(lesson.question&&chapter.quiz.includes(lesson.question),"Immediate question must come from this chapter's question bank");
 }
}
assert.match(html,/function microLessonHTML\(chapterIndex\)/,"Lesson page must render micro lessons");
assert.match(html,/function completeAndMoveMicroLesson/,"Micro lessons must track completion");
assert.match(html,/function answerMicroLesson/,"Immediate questions must save answers");
assert.match(html,/function skipMicroQuestion/,"Immediate questions must be skippable");
assert.match(html,/function toggleMicroBookmark/,"Micro lessons must support bookmarks");
assert.match(html,/function microBookmarksHTML/,"Bookmarks must be listed in continue learning");
assert.match(html,/microLessons:/,"New progress field must be normalized");
assert.match(html,/microBookmarks:/,"Bookmark progress field must be normalized");
assert.match(html,/const storeKey="cctvAcademyProgressV1"/,"Legacy progress key must remain unchanged");
assert.match(html,/micro-full-content/,"Original full chapter content must remain accessible");
assert.match(sw,/js\/micro-lessons\.js/,"Micro lessons script must be cached for offline use");
assert.match(sw,/cctv-academy-static-v2026-10-16-4/,"Cache version must change when adding a module");
console.log(JSON.stringify({status:"passed",chapters:chapters.length,features:["micro-lessons","optional-question","progress","bookmarks","offline-script","legacy-content-preserved"]},null,2));
