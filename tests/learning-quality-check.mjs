import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("js/academy-data.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/academy-data.js" });
const chapters = sandbox.window.CCTVAcademyData.chapters;
assert.equal(chapters.length, 14, "Learning quality audit expects 14 chapters");

const questions = chapters.flatMap((chapter, chapterIndex) => {
  assert.equal(chapter.quiz.length, 25, chapter.title + " must contain 25 quiz questions");
  return chapter.quiz.map((question, questionIndex) => ({ ...question, chapterIndex, questionIndex, chapterTitle: chapter.title }));
});
assert.equal(questions.length, 350, "Learning quality audit expects 350 questions");

const normalize = (value) => String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
const questionKeys = questions.map((q) => normalize(q.q));
assert.equal(new Set(questionKeys).size, questionKeys.length, "Question stems must be unique after whitespace normalization");

const kindCounts = {};
const difficultyCounts = {};
const explanationCounts = new Map();
const templatePatterns = [
  /^(در بررسی «|کدام اقدام برای «|اگر با موضوع «|کدام نکته در تصمیم‌گیری درباره «|برای کاهش خطا در «|کدام گزینه رابطه درست‌تری با «|در سناریوی مرتبط با «|کدام توضیح، مفهوم «)/,
  /^(کدام گزینه|کدام مورد|چه چیزی|کدام اقدام|در چه شرایطی)/i
];
let missingKind = 0;
let shortExplanation = 0;
const shortExplanationSamples = [];
let templatedStems = 0;
let correctLongest = 0;
const answerPositions = [0, 0, 0, 0];
const perChapter = [];

for (const question of questions) {
  const kind = String(question.kind || "").trim() || "بدون برچسب";
  kindCounts[kind] = (kindCounts[kind] || 0) + 1;
  assert.ok(["پایه", "متوسط", "پیشرفته"].includes(question.difficulty), "Question must have a valid difficulty label: " + question.q);
  difficultyCounts[question.difficulty] = (difficultyCounts[question.difficulty] || 0) + 1;
  if (!question.kind) missingKind++;
  const explanation = normalize(question.e);
  explanationCounts.set(explanation, (explanationCounts.get(explanation) || 0) + 1);
  if (String(question.e || "").trim().length < 40) { shortExplanation++; shortExplanationSamples.push({ chapter: question.chapterTitle, question: question.q, explanation: question.e }); }
  if (templatePatterns[0].test(String(question.q || ""))) templatedStems++;
  const lengths = (question.o || []).map((option) => String(option).length);
  if (lengths.length === 4 && lengths[question.a] === Math.max(...lengths)) correctLongest++;
  if (Number.isInteger(question.a) && question.a >= 0 && question.a < 4) answerPositions[question.a]++;
}
for (const chapter of chapters) {
  const list = chapter.quiz;
  const kinds = {};
  for (const question of list) {
    const kind = String(question.kind || "بدون برچسب");
    kinds[kind] = (kinds[kind] || 0) + 1;
  }
  perChapter.push({ chapter: chapter.title, kinds });
}
const repeatedExplanations = [...explanationCounts.entries()]
  .filter(([text, count]) => text && count > 1)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([text, count]) => ({ count, sample: text.slice(0, 100) }));

console.log(JSON.stringify({
  status: "audit-complete",
  chapters: chapters.length,
  questions: questions.length,
  kindCounts,
  difficultyCounts,
  missingKind,
  repeatedExplanationGroups: [...explanationCounts.values()].filter((count) => count > 1).length,
  repeatedExplanations,
  explanationsUnder40Characters: shortExplanation,
  shortExplanationSamples,
  templatedSupplementalStemCount: templatedStems,
  correctOptionLongestCount: correctLongest,
  answerPositions,
  perChapter
}, null, 2));
