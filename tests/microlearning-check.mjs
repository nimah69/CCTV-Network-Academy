import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const dataSource=fs.readFileSync("js/academy-data.js","utf8");
const sandbox={window:{}};
vm.runInNewContext(dataSource,sandbox,{timeout:1000});
const chapters=sandbox.window.CCTVAcademyData.chapters;

assert.equal(chapters.length,14,"The academy must keep all 14 chapters");
assert.match(html,/const storeKey="cctvAcademyProgressV1"/,"Existing progress storage key must not change");
assert.match(html,/microLessons:p\.microLessons&&typeof p\.microLessons==="object"/,"Old progress records must receive a safe default for new micro-lesson state");
assert.match(html,/function microLessonsFor\(chapter,chapterIndex\)/,"Micro-lessons must be derived from current chapter sections");
assert.match(html,/chapterIndex===12&&sections\.length<3/,"Question-focused chapter must get useful study-guide steps when source sections are short");
assert.match(html,/function answerMicroQuestion\(index,value\)/,"Immediate question responses must be stored");
assert.match(html,/function skipMicroQuestion\(index\)/,"Immediate questions must be skippable");
assert.match(html,/"needs-review"/,"Incorrect micro-lesson answers must be marked for review");
assert.match(html,/microWhyByChapter/,"Every chapter must have a why-it-matters explanation");
assert.match(html,/microExampleByChapter/,"Every chapter must include a practical CCTV/network example");
assert.match(html,/نکته کاربردی/,"Every micro-lesson must include an actionable tip");
assert.match(html,/function saveStudyPosition\(\).*microIndex:state\.microIndex/,"Current micro-lesson position must be saved");
assert.match(html,/function resumeStudy\(\).*Number\(p\.microIndex\)/,"Resume learning must restore the saved micro-lesson");
assert.match(html,/function routeHash\(view,chapter=state\.chapter,microIndex=state\.microIndex\)/,"Direct routes must support a micro-lesson index");
assert.match(html,/function moveMicroLesson\(direction\)/,"Previous and next micro-lesson navigation must exist");
assert.match(html,/function chapterLearningTemplate\(chapter,chapterIndex\).*<details class="chapter-learning-template"/,"Existing concept cards and chapter-one equipment cards must remain available");
assert.match(html,/micro-node\.needs-review/,"Needs-review nodes must have a distinct visual state");
assert.match(html,/min-height:44px/,"Touch targets must remain usable on phones");
assert.match(html,/go\("chapterLab",state\.chapter\)/,"Finishing micro-lessons must lead to the chapter lab");

const expected=chapters.map((chapter,index)=>({title:chapter.title,count:chapter.sections.length+(index===12&&chapter.sections.length<3?2:0),hasQuiz:Array.isArray(chapter.quiz)&&chapter.quiz.length>0}));
for(const item of expected){
 assert.ok(item.count>=3&&item.count<=5,item.title+" should have 3–5 micro-lessons, got "+item.count);
 assert.ok(item.hasQuiz,item.title+" must have a question bank for immediate practice");
}
console.log(JSON.stringify({status:"passed",chapters:expected.length,microLessons:expected.map(x=>({title:x.title,count:x.count})),progressKeyPreserved:true},null,2));
