import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const reviewModule = { exports: {} };
vm.runInNewContext(fs.readFileSync("js/spaced-review.js", "utf8"), { module: reviewModule, window: {} });
const review = reviewModule.exports;

const html = fs.readFileSync("index.html", "utf8");
assert.ok(html.includes('<script src="js/spaced-review.js"></script>'), "Spaced-review module must load locally");
assert.ok(html.includes("function gradeReviewQuestion") && html.includes("فراموش کردم") && html.includes("به‌خاطر آوردم"), "Saved progress must expose review grading controls");
assert.ok(html.includes('const storeKey="cctvAcademyProgressV1";'), "Existing progress key must remain unchanged");

const now = Date.parse("2026-10-16T00:00:00.000Z");
const initial = review.normalize(null, new Date(now).toISOString(), now);
assert.equal(initial.intervalDays, 0);
assert.equal(review.isDue(initial, null, now), true);

const firstGood = review.grade(initial, "good", now);
assert.equal(firstGood.repetitions, 1);
assert.equal(firstGood.intervalDays, 1);
assert.equal(review.isDue(firstGood, null, now), false);
assert.equal(review.isDue(firstGood, null, now + 86400000), true);

const secondGood = review.grade(firstGood, "good", now);
assert.equal(secondGood.repetitions, 2);
assert.equal(secondGood.intervalDays, 3);

const easy = review.grade(initial, "easy", now);
assert.equal(easy.intervalDays, 2);
assert.ok(easy.ease > initial.ease);

const hard = review.grade(initial, "hard", now);
assert.equal(hard.intervalDays, 1);
assert.ok(hard.ease < initial.ease);

const again = review.grade(secondGood, "again", now);
assert.equal(again.repetitions, 0);
assert.equal(again.intervalDays, 0);
assert.equal(review.isDue(again, null, now), true);
assert.throws(() => review.grade(initial, "unknown", now), /Unknown review grade/);

const malformed = review.normalize({ repetitions: -1, intervalDays: -3, ease: 99, dueAt: "bad" }, null, now);
assert.equal(malformed.repetitions, 0);
assert.equal(malformed.intervalDays, 0);
assert.equal(malformed.ease, 3.5);
assert.equal(review.isDue(malformed, null, now), true);

console.log(JSON.stringify({status:"passed",cases:12,grades:["again","hard","good","easy"],localOnly:true},null,2));
