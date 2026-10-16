import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const activity = fs.readFileSync(path.join(root, "android/app/src/main/java/ir/nimah69/cctvnetworkacademy/MainActivity.java"), "utf8");

assert.match(html, /function routeHash\(/, "Route hash builder must exist");
for (const route of ['"#/lesson/"+n', '"#/lab/"+n', '"#/chapter-quiz/"+n', '"#/quiz"', '"#/tools"', '"#/saved"', '"#/chapters"']) {
  assert.ok(html.includes(route), "Missing route: " + route);
}
assert.match(html, /window\.addEventListener\("popstate"/, "Browser and Android Back must restore the prior route");
assert.match(html, /window\.CCTVAcademyHandleBack=function\(/, "Android Back bridge must distinguish dashboard from in-app routes");
assert.match(html, /studyPosition:/, "New study-position field must be preserved with existing progress");
assert.match(html, /function saveStudyPosition\(/, "Lesson scroll and section must be persisted");
assert.match(html, /function resumeStudy\(/, "Resume action must restore the saved lesson position");
const bottomNav = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
assert.equal((bottomNav.match(/<button data-view=/g)||[]).length, 3, "Bottom navigation must have three internal destinations");
assert.equal((bottomNav.match(/<a href="workshops\.html"/g)||[]).length, 1, "Bottom navigation must have one workshop destination");
assert.match(activity, /CCTVAcademyHandleBack/, "Android native Back must use the app route handler");
assert.ok(html.includes('const storeKey="cctvAcademyProgressV1"'), "Existing progress storage key must remain unchanged");

console.log(JSON.stringify({status:"passed",routes:7,bottomNavigationItems:4,storageKeyPreserved:true},null,2));
