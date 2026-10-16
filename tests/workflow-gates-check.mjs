import assert from "node:assert/strict";
import fs from "node:fs";

const pages = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const quality = fs.readFileSync(".github/workflows/quality.yml", "utf8");
const apk = fs.readFileSync(".github/workflows/offline-apk-ci.yml", "utf8");

for (const [name, workflow] of [["Pages", pages], ["quality", quality], ["offline APK", apk]]) {
  assert.match(workflow, /for f in tests\/\*\.mjs/, name + " workflow must run every test file");
  assert.match(workflow, /set -e/, name + " workflow must stop at the first failing test");
}
assert.ok(pages.indexOf("Run all required quality checks") < pages.indexOf("actions/deploy-pages"), "Pages deployment must follow quality checks");
assert.ok(apk.indexOf("Run all academy quality checks") < apk.indexOf("Bundle local website files"), "APK packaging must follow quality checks");
assert.ok(apk.indexOf("Bundle local website files") < apk.indexOf("Build offline APK"), "APK must be built after local assets are bundled");
assert.ok(quality.includes("pull_request:") && quality.includes("push:"), "Quality workflow must run on pushes and pull requests");

console.log(JSON.stringify({ status: "passed", workflows: ["pages", "quality", "offline-apk-ci"], allTestsRequired: true, failFast: true }, null, 2));
