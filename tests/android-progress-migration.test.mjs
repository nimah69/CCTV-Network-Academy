import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map(match => match[1]);
assert.ok(scripts.length, "Progress migration script must exist");
const migrationScript = scripts[0];

function run(script, bridge, localStorage) {
  const errors = [];
  vm.runInNewContext(script, {
    window: { AndroidBridge: bridge },
    localStorage,
    console: { error: (...args) => errors.push(args) }
  });
  return errors;
}

{
  const calls = [];
  const bridge = {
    isLegacyProgressMigrationNeeded: () => true,
    storeLegacyProgress: value => calls.push(["store", value]),
    finishLegacyProgressMigration: () => calls.push(["finish"])
  };
  const storage = {
    get length() { throw new Error("file-origin storage blocked"); },
    key() { throw new Error("unreachable"); },
    getItem() { throw new Error("unreachable"); }
  };
  run(migrationScript, bridge, storage);
  assert.deepEqual(calls, [["store", "[]"], ["finish"]], "Blocked legacy storage must not strand the app on the file origin");
}

{
  const calls = [];
  const entries = [["cctvAcademyProgressV1", "{\"score\":5}"], ["unrelated", "ignore"]];
  const bridge = {
    isLegacyProgressMigrationNeeded: () => true,
    storeLegacyProgress: value => calls.push(["store", JSON.parse(value)]),
    finishLegacyProgressMigration: () => calls.push(["finish"])
  };
  const storage = {
    length: 2,
    key: index => ["cctvAcademyProgressV1", "unrelated"][index],
    getItem: key => entries.find(entry => entry[0] === key)?.[1] ?? null
  };
  run(migrationScript, bridge, storage);
  assert.deepEqual(calls, [["store", [entries[0]]], ["finish"]], "Only academy progress keys should be migrated");
}

{
  const calls = [];
  const bridge = {
    isLegacyProgressMigrationNeeded: () => false,
    getPendingLegacyProgress: () => JSON.stringify([["cctvAcademyProgressV1", "saved"]]),
    clearPendingLegacyProgress: () => calls.push("clear")
  };
  const storage = {
    getItem: () => null,
    setItem() { throw new Error("secure-origin storage blocked"); }
  };
  run(migrationScript, bridge, storage);
  assert.deepEqual(calls, [], "Pending progress must be retained if importing into secure-origin storage fails");
}

console.log(JSON.stringify({ status: "passed", blockedLegacyStorage: true, allowlistedKeysOnly: true, pendingImportRetry: true }, null, 2));
