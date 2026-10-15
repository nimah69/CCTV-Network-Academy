import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
assert.ok(scripts.length > 0, "index.html must contain a JavaScript script");
const appScript = scripts.find((script) => script.includes("const chapters = window.CCTVAcademyData.chapters;"));
assert.ok(appScript, "Could not find the main application script");
new vm.Script(appScript, { filename: "index.html:inline-script" });
assert.ok(html.includes('<script src="js/calculations.js"></script>'), "Pure calculator module must be loaded by the page");
assert.ok(["poe(n,w,r)", "bandwidth(n,rate,r)", "storage(n,rate,days,10)", "link(load,speed,limit)"].every((call) => appScript.includes("window.CCTVCalculations." + call)), "UI calculators must call the pure calculation module");

const dataSource = fs.readFileSync("js/academy-data.js", "utf8");
new vm.Script(dataSource, { filename: "js/academy-data.js" });
const sandbox = { window: {} };
new vm.Script(dataSource, { filename: "js/academy-data.js" }).runInNewContext(sandbox);
const chapters = sandbox.window.CCTVAcademyData.chapters;

assert.equal(chapters.length, 14, "Expected exactly 14 learning chapters");
let total = 0;
let scenarioCount = 0;
let sourceQuestionCount = 0;
let longestCorrectOptions = 0;
const answerPositions = [0, 0, 0, 0];
const generatedStemPatterns = new Set();
const uniqueQuestionTexts = new Set();

for (const [chapterIndex, chapter] of chapters.entries()) {
  assert.ok(chapter.title && chapter.title.trim(), "Chapter " + (chapterIndex + 1) + " needs a title");
  assert.equal(chapter.quiz.length, 25, 'Chapter "' + chapter.title + '" must contain exactly 25 questions');
  total += chapter.quiz.length;

  for (const [questionIndex, question] of chapter.quiz.entries()) {
    const where = 'Chapter "' + chapter.title + '", question ' + (questionIndex + 1);
    assert.ok(typeof question.q === "string" && question.q.trim().length >= 15, where + ": question text is missing");
    const normalizedQuestion = question.q.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    assert.ok(!uniqueQuestionTexts.has(normalizedQuestion), where + ": duplicate question text: " + question.q);
    uniqueQuestionTexts.add(normalizedQuestion);
    assert.ok(Array.isArray(question.o) && question.o.length === 4, where + ": expected four options");
    assert.equal(new Set(question.o.map((option) => String(option).trim().toLocaleLowerCase())).size, 4, where + ": options must be unique");
    assert.ok(Number.isInteger(question.a) && question.a >= 0 && question.a < 4, where + ": answer index is invalid");
    assert.ok(typeof question.e === "string" && question.e.trim().length >= 25, where + ": explanation is missing or too short; question=" + question.q);
    assert.ok(!question.e.includes("\\n"), where + ": explanation contains a literal backslash-n sequence");
    answerPositions[question.a]++;
    const optionLengths = question.o.map((option) => String(option).length);
    if (optionLengths[question.a] === Math.max(...optionLengths)) longestCorrectOptions++;

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
assert.equal(sourceQuestionCount, 5, "All five questions from the PDF quiz section should be labeled as rewritten from the source");
assert.ok(generatedStemPatterns.size >= 6, "Supplemental questions should use varied stems, not one repeated template");
assert.ok(answerPositions.every((count) => count >= Math.ceil(total * 0.20) && count <= Math.floor(total * 0.30)), "Each correct-answer position must occur between 20% and 30% of the bank");
assert.ok(longestCorrectOptions <= Math.floor(total * 0.35), "The correct answer must not be the longest option in more than 35% of questions");

for (const chapterIndex of [0, 1, 2, 8]) {
  const chapter = chapters[chapterIndex];
  const supplemental = chapter.quiz.filter((question) => question.kind === "تمرین مفهومی تکمیلی");
  assert.equal(supplemental.length, 18, chapter.title + ": expected 18 rewritten supplemental questions");
  assert.equal(new Set(supplemental.map((question) => question.e)).size, supplemental.length, chapter.title + ": each supplemental question needs its own explanation");
  for (const question of supplemental) {
    assert.ok(!/^(در بررسی «|کدام اقدام برای «|اگر با موضوع «|کدام نکته در تصمیم‌گیری درباره «|برای کاهش خطا در «|کدام گزینه رابطه درست‌تری با «|در سناریوی مرتبط با «|کدام توضیح، مفهوم «)/.test(question.q), chapter.title + ": templated question stem remains");
    const lengths = question.o.map((option) => option.length);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 40, chapter.title + ": option lengths are too uneven for question: " + question.q);
  }
}

assert.ok(appScript.includes('const storeKey="cctvAcademyProgressV1";'), "Existing localStorage key must remain unchanged");
assert.ok(appScript.includes("function normalizeProgress"), "Legacy progress data must be normalized without discarding existing fields");
assert.ok(appScript.includes("function exportProgress") && appScript.includes("function importProgressFile"), "JSON progress export/import must be available");
assert.ok(appScript.includes("function buildComprehensiveQuiz") && appScript.includes("function shuffleQuestion"), "Randomized quiz generation must be available");
assert.ok(appScript.includes("state.progress.wrongQuestions"), "Incorrect answers must be persisted for review");
assert.ok(appScript.includes("ارجاع صفحه تأیید نشده"), "Unverified source page references must be labeled");

const calculatorSource = fs.readFileSync("js/calculations.js", "utf8");
new vm.Script(calculatorSource, { filename: "js/calculations.js" });
const calculatorModule = { exports: {} };
const calculatorSandbox = { window: {}, module: calculatorModule };
new vm.Script(calculatorSource, { filename: "js/calculations.js" }).runInNewContext(calculatorSandbox);
const calculations = calculatorModule.exports;
assert.ok(["poe", "bandwidth", "storage", "link"].every((name) => typeof calculations[name] === "function"), "All calculator functions must be pure exported functions");

const poe = calculations.poe(8, 12, 25);
assert.equal(poe.total, 120, "PoE reference case should be 120 W");
const bandwidth = calculations.bandwidth(16, 4, 30);
assert.ok(Math.abs(bandwidth.total - 83.2) < 1e-9, "Bandwidth reference case should be 83.2 Mbps");
const storage = calculations.storage(8, 4, 14, 10);
assert.ok(Math.abs(storage.tb - 4.8384) < 1e-9, "Storage reference case should be 4.8384 TB before headroom");
assert.ok(Math.abs(storage.withHeadroom - 5.32224) < 1e-9, "Storage reference case should be 5.32224 TB with 10% headroom");
const link = calculations.link(40, 100, 70);
assert.equal(link.percent, 40, "Link occupancy should be 40%");
assert.equal(link.remaining, 60, "Remaining nominal link capacity should be 60 Mbps");
assert.equal(link.status, "status-good", "Occupancy below the warning threshold should be marked good");
assert.equal(calculations.link(80, 100, 70).status, "status-bad", "Occupancy above the design limit should be marked bad");

console.log(JSON.stringify({
  status: "passed",
  chapters: chapters.length,
  questions: total,
  scenarios: scenarioCount,
  sourceQuestions: sourceQuestionCount,
  answerPositions,
  longestCorrectOptions,
  longestCorrectPercent: Number((longestCorrectOptions / total * 100).toFixed(2)),
  generatedStemPatterns: generatedStemPatterns.size,
  calculatorCases: 5
}, null, 2));
