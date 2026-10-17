import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("workshops.html", "utf8");
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((script) => script.trim());

assert.equal(inlineScripts.length, 1, "The interactive workshop should have one inline application script");
new vm.Script(inlineScripts[0], { filename: "workshops.html:inline-script" });

for (const id of [
  "faultSimulator", "faultType", "runFaultSimulation", "resetFaultSimulation",
  "faultResult", "equipmentChecks", "linkChecks", "camCount", "switchPorts",
  "checkTopology", "topologyResult", "topologyDiagram"
]) {
  assert.ok(html.includes('id="' + id + '"'), "Missing interactive control: " + id);
}

assert.match(html, /function renderTopologyDiagram\(\)/, "Topology must be rendered by a dedicated function");
assert.match(html, /const edges=valid\.map\(id=>/, "Topology edges must be rendered from selected links");
assert.match(html, /names\[ep\[id\]\[0\]\]/, "Rendered links must show the selected source endpoint");
assert.match(html, /names\[ep\[id\]\[1\]\]/, "Rendered links must show the selected destination endpoint");
assert.match(html, /cams>ports/, "Topology validation must check camera count against available switch ports");
assert.match(html, /if\(eq\.includes\("camera"\)&&!has\("switch-camera"\)\)/, "Topology validation must flag a missing camera-to-switch link");
assert.match(html, /"camera-power":\{/, "Fault simulation must include a camera power/PoE failure");
assert.match(html, /"camera-link":\{/, "Fault simulation must include a broken camera link");
assert.match(html, /"switch-nvr":\{/, "Fault simulation must include a switch-to-NVR failure");
assert.match(html, /"nvr-monitor":\{/, "Fault simulation must distinguish monitor output failure");
assert.match(html, /"ip-conflict":\{/, "Fault simulation must include an IP conflict scenario");
assert.match(html, /"poe-budget":\{/, "Fault simulation must include a PoE budget scenario");
assert.match(html, /fault-fail/, "Fault scenarios must visually identify failed equipment");
assert.match(html, /سناریوی آموزشی محلی است/, "The simulator must disclose that it does not connect to real equipment");
assert.doesNotMatch(html, /\$\("topologyDiagram"\)\.innerHTML=eq\.map\(x=>/, "Do not render topology as an arbitrary list in equipment selection order");

console.log(JSON.stringify({ status: "passed", inlineScripts: inlineScripts.length, controls: 12, faultScenarios: 6 }, null, 2));
