import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const files = ["README.md", ...fs.readdirSync("docs").filter(name => name.endsWith(".md")).map(name => path.join("docs", name))];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  assert.ok(!content.includes("\\n"), `${file} contains a literal backslash-n sequence`);
}
console.log(`Documentation checks passed: ${files.length} Markdown files contain no literal backslash-n sequences.`);
