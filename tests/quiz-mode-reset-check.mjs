import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const line = (name) => {
  const found = html.split("\n").filter((item) => item.startsWith("function " + name + "("));
  assert.equal(found.length, 1, "Expected one function definition for " + name);
  return found[0];
};
const sandbox = {
  state: { progress: { done: [0], scores: { 0: 12 }, labs: { 0: 1 }, wrongQuestions: [null] }, quizQuestions: [], quizAnswers: {}, quizSubmitted: false, chapter: 0 },
  confirm: () => true,
  render: () => {}
};
vm.runInNewContext([line("normalizeProgress"), line("wrongQuestionKey"), line("resetProgress"), line("submitQuiz")].join("\n"), sandbox);
sandbox.saveProgress = () => { sandbox.state.progress = sandbox.normalizeProgress(sandbox.state.progress); };
sandbox.resetProgress();
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.state.progress.done)), []);
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.state.progress.scores)), {});
assert.ok(Array.isArray(sandbox.state.progress.wrongQuestions), "Reset must preserve normalized wrongQuestions");
assert.ok(Array.isArray(sandbox.state.progress.comprehensive) || sandbox.state.progress.comprehensive === null, "Reset must normalize comprehensive result");
sandbox.state.quizQuestions = [{ q: "سؤال آزمایشی معتبر برای آزمون", o: ["پاسخ صحیح", "گزینه دیگر"], a: 0, chapter: 0, qi: 0, tag: "آزمایشی", e: "توضیح آزمایشی معتبر برای آزمون پس از ثبت پاسخ." }];
sandbox.state.quizAnswers = {};
assert.doesNotThrow(() => sandbox.submitQuiz(false), "Submitting after reset must not throw");
assert.equal(sandbox.state.progress.wrongQuestions.length, 1, "An unanswered question should be safely recorded for review");
assert.equal(sandbox.state.progress.scores[0], 0, "The quiz score should be recorded after reset");
const imported = sandbox.normalizeProgress({ wrongQuestions: [null, "invalid", {}, []] });
assert.equal(imported.wrongQuestions.length, 1, "Invalid wrongQuestions entries must be filtered safely");
console.log(JSON.stringify({ status: "passed", resetThenSubmit: true, malformedWrongQuestions: true }, null, 2));
