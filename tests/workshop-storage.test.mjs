import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("workshops.html", "utf8");
const start = html.indexOf("function readStorage(");
const end = html.indexOf("const storedScore=", start);
assert.ok(start >= 0 && end > start, "Safe workshop storage helpers must be defined before state initialization");
const helpers = html.slice(start, end);

const blockedStorage = {
  getItem() { throw new Error("storage blocked"); },
  setItem() { throw new Error("storage blocked"); },
  removeItem() { throw new Error("storage blocked"); }
};
const blocked = vm.runInNewContext(
  helpers + `
    JSON.stringify({
      fallback: readStorage("score", "0"),
      array: readStoredArray("progress"),
      saved: writeStorage("score", "10"),
      removed: (removeStorage("score"), true)
    })
  `,
  { localStorage: blockedStorage }
);
assert.deepEqual(JSON.parse(blocked), { fallback: "0", array: [], saved: false, removed: true });

const malformedStorage = {
  getItem(key) { return key === "progress" ? "{broken" : "Infinity"; },
  setItem() {},
  removeItem() {}
};
const malformed = vm.runInNewContext(
  helpers + `
    const storedScore = Number(readStorage("score", "0"));
    JSON.stringify({
      array: readStoredArray("progress"),
      score: Number.isFinite(storedScore) && storedScore >= 0 ? storedScore : 0
    })
  `,
  { localStorage: malformedStorage }
);
assert.deepEqual(JSON.parse(malformed), { array: [], score: 0 });

console.log(JSON.stringify({ status: "passed", blockedStorage: true, malformedData: true }, null, 2));
