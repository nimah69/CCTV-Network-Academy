import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const dataText=fs.readFileSync("js/academy-data.js","utf8");
const microText=fs.readFileSync("js/micro-lessons.js","utf8");
const sandbox={window:{}};
vm.runInNewContext(dataText,sandbox,{timeout:2000});
vm.runInNewContext(microText,sandbox,{timeout:1000});
const chapters=sandbox.window.CCTVAcademyData.chapters;
const build=sandbox.window.CCTVMicroLessons.build;

assert.equal(chapters.length,14,"All 14 chapters must remain present");
assert.equal(chapters.reduce((sum,c)=>sum+c.quiz.length,0),350,"All existing quiz questions must remain intact");
const mistakeBodies=[],systemBodies=[];
for(const chapter of chapters){
 const items=chapter.supplemental.items;
 const mistake=items.find(item=>String(item[0]).includes("اشتباه رایج — توضیح تکمیلی"));
 const connection=items.find(item=>String(item[0]).includes("ارتباط با سامانه کامل — توضیح تکمیلی"));
 assert.ok(mistake,chapter.title+": a clearly labelled common mistake must be added");
 assert.ok(connection,chapter.title+": the relationship to the complete CCTV system must be added");
 assert.ok(mistake[1].length>=100,chapter.title+": common mistake explanation is too short");
 assert.ok(connection[1].length>=100,chapter.title+": system connection explanation is too short");
 mistakeBodies.push(mistake[1]);systemBodies.push(connection[1]);
 const micros=build(chapter);
 assert.ok(micros.length>=3&&micros.length<=5,chapter.title+": expected 3–5 micro-lessons, got "+micros.length);
 for(const lesson of micros){
  assert.ok(lesson.title&&lesson.definition.length>=20,chapter.title+": micro-lesson needs a title and explanation");
  assert.ok(lesson.why.length>=30,chapter.title+": why-it-matters text is missing");
  assert.ok(lesson.example.length>=30,chapter.title+": practical example is missing");
  assert.ok(lesson.tip.length>=20,chapter.title+": practical tip is missing");
  assert.ok(lesson.question,chapter.title+": immediate question must come from the chapter bank");
 }
}
assert.equal(new Set(mistakeBodies).size,14,"Common mistakes must be chapter-specific");
assert.equal(new Set(systemBodies).size,14,"System connections must be chapter-specific");
const mcq=build(chapters[12]);
assert.ok(mcq.some(x=>x.title==="تحلیل صورت سؤال"),"Source-question chapter must teach question analysis");
assert.ok(mcq.some(x=>x.title==="تفکیک گزینه‌های نزدیک"),"Source-question chapter must teach distractor analysis");
const interview=build(chapters[13]);
assert.ok(interview.some(x=>x.title==="ساختار پاسخ فنی"),"Interview chapter must retain a practical answer structure");
assert.ok(chapters[12].quiz.some(q=>q.sourceId===145)&&chapters[12].quiz.some(q=>q.sourceId===160),"Source-question identifiers must remain intact");
console.log(JSON.stringify({status:"passed",chapters:chapters.length,questions:350,commonMistakes:mistakeBodies.length,systemConnections:systemBodies.length,questionStudyGuides:true},null,2));
