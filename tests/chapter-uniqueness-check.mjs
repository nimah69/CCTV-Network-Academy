import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("js/academy-data.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/academy-data.js" });
const chapters = sandbox.window.CCTVAcademyData.chapters;
const chapterId = process.argv[2];
const selectedChapters = chapterId ? chapters.filter((chapter) => chapter.id === chapterId) : chapters;
assert.ok(selectedChapters.length > 0, "Unknown chapter ID: " + chapterId);

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
const results = selectedChapters.map((selected) => {
  const duplicates = [...locations.entries()]
    .filter(([, entries]) => entries.length > 1 && entries.some((entry) => entry.chapterId === selected.id))
    .map(([question, entries]) => ({ question, chapters: entries.map((entry) => entry.chapterId) }));
  assert.deepEqual(duplicates, [], selected.title + " has duplicate question stems: " + JSON.stringify(duplicates));
  return { chapterId: selected.id, questions: selected.quiz.length };
});
console.log(JSON.stringify({ status: "passed", chaptersChecked: results.length, results }, null, 2));
