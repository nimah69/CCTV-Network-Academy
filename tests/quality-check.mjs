import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
assert.ok(scripts.length > 0, "index.html must contain a JavaScript script");
const appScript = scripts.find((script) => script.includes("const chapters = ["));
assert.ok(appScript, "Could not find the embedded academy data and app script");
new vm.Script(appScript, { filename: "index.html:inline-script" });

const dataStart = appScript.indexOf("const chapters = [");
const dataEnd = appScript.indexOf("const icons=");
assert.ok(dataStart >= 0 && dataEnd > dataStart, "Could not isolate academy data");
const dataSource = appScript.slice(dataStart, dataEnd) + "\nchapters;";
const chapters = new vm.Script(dataSource, { filename: "academy-data-validation.js" }).runInNewContext();

assert.equal(chapters.length, 14, "Expected exactly 14 learning chapters");
let total = 0;
let scenarioCount = 0;
let sourceQuestionCount = 0;
const answerPositions = [0, 0, 0, 0];
const generatedStemPatterns = new Set();

for (const [chapterIndex, chapter] of chapters.entries()) {
  assert.ok(chapter.title && chapter.title.trim(), "Chapter " + (chapterIndex + 1) + " needs a title");
  assert.equal(chapter.quiz.length, 25, 'Chapter "' + chapter.title + '" must contain exactly 25 questions');
  total += chapter.quiz.length;

  for (const [questionIndex, question] of chapter.quiz.entries()) {
    const where = 'Chapter "' + chapter.title + '", question ' + (questionIndex + 1);
    assert.ok(typeof question.q === "string" && question.q.trim().length >= 15, where + ": question text is missing");
    assert.ok(Array.isArray(question.o) && question.o.length === 4, where + ": expected four options");
    assert.equal(new Set(question.o.map((option) => String(option).trim().toLocaleLowerCase())).size, 4, where + ": options must be unique");
    assert.ok(Number.isInteger(question.a) && question.a >= 0 && question.a < 4, where + ": answer index is invalid");
    assert.ok(typeof question.e === "string" && question.e.trim().length >= 25, where + ": explanation is missing or too short; question=" + question.q + "; explanation=" + String(question.e));
    answerPositions[question.a]++;

    if (question.kind === "سناریوی کاربردی" || question.kind === "سواد منبع") scenarioCount++;
    if (question.kind === "بازنویسی پرسش‌های جزوه") sourceQuestionCount++;
    if (question.kind === "تمرین مفهومی تکمیلی") {
      generatedStemPatterns.add(question.q.replace(/«.*?»/g, "«موضوع»"));
      assert.ok(!question.o.some((option) => option.includes("این موضوع فقط به نام‌گذاری تجهیزات مربوط است.")), where + ": fallback distractor found");
    }
  }
}

assert.equal(total, 350, "Expected 350 questions in total");
assert.ok(scenarioCount >= 28, "Expected at least 28 explicitly labeled applied scenarios");
assert.equal(sourceQuestionCount, 2, "Exactly two questions should be labeled as rewritten from the PDF quiz section");
assert.ok(generatedStemPatterns.size >= 6, "Supplemental questions should use varied stems, not one repeated template");
assert.ok(answerPositions.every((count) => count >= 20), "Correct answer positions should be reasonably distributed");
console.log(JSON.stringify({ status: "passed", chapters: chapters.length, questions: total, scenarios: scenarioCount, sourceQuestions: sourceQuestionCount, generatedStemPatterns: generatedStemPatterns.size, answerPositions }, null, 2));
