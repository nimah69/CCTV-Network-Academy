import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("js/academy-data.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/academy-data.js" });
const chapters = sandbox.window.CCTVAcademyData.chapters;
const questions = chapters.flatMap((chapter) => chapter.quiz);
const answerPositions = [0, 0, 0, 0];
let longestCorrectOptions = 0;
for (const question of questions) {
  if (Number.isInteger(question.a) && question.a >= 0 && question.a < 4) answerPositions[question.a]++;
  const lengths = question.o.map((option) => String(option).length);
  if (lengths[question.a] === Math.max(...lengths)) longestCorrectOptions++;
}
const mode = process.argv[2] || "all";
if (mode === "all" || mode === "positions") {
  assert.ok(answerPositions.every((count) => count >= Math.ceil(questions.length * 0.20) && count <= Math.floor(questions.length * 0.30)),
    "Correct answer position distribution is outside 20–30%: " + JSON.stringify(answerPositions));
}
if (mode === "all" || mode === "longest") {
  assert.ok(longestCorrectOptions <= Math.floor(questions.length * 0.35),
    "Correct answer is the longest option too often: " + longestCorrectOptions + "/" + questions.length);
}
console.log(JSON.stringify({ status: "passed", mode, answerPositions, longestCorrectOptions, total: questions.length }, null, 2));
