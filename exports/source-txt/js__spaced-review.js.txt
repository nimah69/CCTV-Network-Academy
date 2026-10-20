(function(root){
"use strict";
const DAY_MS = 86400000;
const GRADES = new Set(["again", "hard", "good", "easy"]);
function timestamp(value, fallback) {
  const parsed = value == null ? NaN : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function normalize(review, savedAt, now) {
  const current = review && typeof review === "object" && !Array.isArray(review) ? review : {};
  const currentTime = now == null ? Date.now() : (typeof now === "number" ? now : timestamp(now, Date.now()));
  const repetitions = Number.isInteger(current.repetitions) && current.repetitions >= 0 ? current.repetitions : 0;
  const intervalDays = Number.isFinite(Number(current.intervalDays)) && Number(current.intervalDays) >= 0 ? Number(current.intervalDays) : 0;
  const ease = Number.isFinite(Number(current.ease)) ? Math.min(3.5, Math.max(1.3, Number(current.ease))) : 2.5;
  const dueTime = timestamp(current.dueAt, timestamp(savedAt, currentTime));
  const reviewedTime = timestamp(current.reviewedAt, 0);
  return {
    repetitions,
    intervalDays,
    ease,
    dueAt: new Date(dueTime).toISOString(),
    reviewedAt: reviewedTime ? new Date(reviewedTime).toISOString() : null,
    lastGrade: GRADES.has(current.lastGrade) ? current.lastGrade : "new"
  };
}
function isDue(review, savedAt, now) {
  const currentTime = now == null ? Date.now() : (typeof now === "number" ? now : timestamp(now, Date.now()));
  return timestamp(normalize(review, savedAt, currentTime).dueAt, currentTime) <= currentTime;
}
function grade(review, gradeValue, now) {
  if (!GRADES.has(gradeValue)) throw new TypeError("Unknown review grade");
  const currentTime = now == null ? Date.now() : (typeof now === "number" ? now : timestamp(now, Date.now()));
  const current = normalize(review, null, currentTime);
  let repetitions = current.repetitions;
  let intervalDays = current.intervalDays;
  let ease = current.ease;
  if (gradeValue === "again") {
    repetitions = 0;
    intervalDays = 0;
  } else if (gradeValue === "hard") {
    repetitions += 1;
    intervalDays = Math.max(1, Math.ceil(intervalDays * 1.2));
    ease = Math.max(1.3, ease - 0.15);
  } else if (gradeValue === "good") {
    intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(1, Math.round(intervalDays * ease));
    repetitions += 1;
  } else {
    intervalDays = repetitions === 0 ? 2 : Math.max(2, Math.round(Math.max(1, intervalDays) * ease * 1.3));
    repetitions += 1;
    ease = Math.min(3.5, ease + 0.15);
  }
  const dueTime = currentTime + intervalDays * DAY_MS;
  return { repetitions, intervalDays, ease, dueAt: new Date(dueTime).toISOString(), reviewedAt: new Date(currentTime).toISOString(), lastGrade: gradeValue };
}
const api = { normalize, isDue, grade };
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (root) root.CCTVSpacedReview = api;
})(typeof window !== "undefined" ? window : null);
