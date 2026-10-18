import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("js/academy-data.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/academy-data.js" });
const chapters = sandbox.window.CCTVAcademyData.chapters;
const chapterId = process.argv[2];
const selected = chapters.find((chapter) => chapter.id === chapterId);
assert.ok(selected, "Unknown chapter ID: " + chapterId);

const normalize = (value) => String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
const locations = new Map();
for (const chapter of chapters) {
  for (const question of chapter.quiz) {
    const key = normalize(question.q);
    const entries = locations.get(key) || [];
    entries.push({ chapterId: chapter.id, chapterTitle: chapter.title });
    locations.set(key, entries);
  }
}
const duplicates = [...locations.entries()]
  .filter(([, entries]) => entries.length > 1 && entries.some((entry) => entry.chapterId === chapterId))
  .map(([question, entries]) => ({ question, chapters: entries.map((entry) => entry.chapterId) }));
assert.deepEqual(duplicates, [], selected.title + " has duplicate question stems: " + JSON.stringify(duplicates));
console.log(JSON.stringify({ status: "passed", chapterId, questions: selected.quiz.length }, null, 2));
