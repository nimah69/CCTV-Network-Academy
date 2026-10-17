import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
const files = readdirSync(new URL(".", import.meta.url)).filter(name => name.endsWith(".test.mjs")).sort();
const targets = [...files.map(name => new URL(name, import.meta.url).pathname)];
targets.push(new URL("workshops-check.mjs", import.meta.url).pathname);
targets.push(new URL("quality-check.mjs", import.meta.url).pathname);
targets.push(new URL("dark-theme-check.mjs", import.meta.url).pathname);
let failed = false;
for (const file of targets) {
  const result = spawnSync(process.execPath, ["--test", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}
if (failed) process.exitCode = 1;
else console.log("All registered simulator and existing quality checks passed.");
