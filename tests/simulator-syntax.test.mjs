import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const files=[
"assets/js/sim/constants.js","assets/js/sim/units.js","assets/js/sim/graph.js","assets/js/sim/devices.js","assets/js/sim/engine.js","assets/js/sim/tools.js","assets/js/sim/scenarios.js","assets/js/sim/scoring.js",
"assets/js/sim/calc/poe.js","assets/js/sim/calc/subnet.js","assets/js/sim/calc/storage.js","assets/js/sim/calc/cable.js","assets/js/sim/calc/security.js","assets/js/sim/calc/ups.js","assets/js/sim/calc/optics.js","assets/js/sim/calc/design.js","assets/js/sim/ui/real-simulator.js","assets/js/sim/ui/calculators.js","tests/scenarios.test.mjs","tests/simulator-engine.test.mjs","tests/simulator-calculators.test.mjs","tests/browser-smoke.test.mjs","tests/run-all.mjs"
];
test("all simulator JavaScript modules parse under the target Node runtime",()=>{for(const file of files){const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});assert.equal(result.status,0,file+" failed syntax check:\n"+result.stderr)}});
