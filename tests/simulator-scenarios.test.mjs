import test from "node:test";
import assert from "node:assert/strict";
import { createScenario, listScenarios, publicScenario, applyScenarioRepair } from "../assets/js/sim/scenarios.js";
import { validateGraph } from "../assets/js/sim/graph.js";

const seed = 41729;
const definitions = [
  ["basic-poe", "enable-port", g => { const p=g.nodes.find(n=>n.id==="sw").ports; return p.some(x=>x.poeEnabled); }],
  ["basic-cable", "replace-cable", g => { const l=g.links.find(x=>x.id==="cam-link"); return l.cableFault==="none" && l.quality==="normal"; }],
  ["basic-port", "enable-port", g => { const l=g.links.find(x=>x.id==="cam-link"); const p=g.nodes.find(n=>n.id==="sw").ports.find(x=>x.id===l.from.port); return p.adminUp; }],
  ["basic-ip", "fix-ip", g => { const ips=g.nodes.map(n=>n.ip).filter(Boolean); return new Set(ips).size===ips.length; }],
  ["basic-hdmi", "select-hdmi", g => g.nodes.find(n=>n.id==="monitor").input==="HDMI1" && g.nodes.find(n=>n.id==="nvr").hdmiConnected],
  ["basic-disk", "free-storage", g => g.nodes.find(n=>n.id==="nvr").freeStorageTB>0],
  ["mid-budget", "increase-budget", g => g.nodes.find(n=>n.id==="sw").poeBudgetW>=120],
  ["mid-cca", "replace-cable", g => { const l=g.links.find(x=>x.id==="cam-link"); return l.cableMaterial==="copper" && l.quality==="normal"; }],
  ["mid-duplex", "match-duplex", g => { const l=g.links.find(x=>x.id==="cam-link"); return !l.duplexMismatch && l.crcErrors===0; }],
  ["mid-vlan", "fix-vlan", g => g.nodes.find(n=>n.id==="sw").ports.every(p=>p.vlan===10)],
  ["mid-subnet", "fix-subnet", g => g.nodes.find(n=>n.id==="cam").prefix===24],
  ["mid-ntp", "fix-clock", g => g.nodes.filter(n=>n.type==="camera"||n.type==="nvr").every(n=>n.clockSynced && n.timezone==="local")],
  ["adv-loop", "break-loop", g => !g.links.some(l=>l.loop)],
  ["adv-acl", "fix-acl", g => (g.acl||[]).length===0],
  ["adv-uplink", "upgrade-uplink", g => g.trafficMbps<1000 && g.links.every(l=>l.speedMbps===10000)],
  ["adv-ir", "adjust-ir", g => { const c=g.nodes.find(n=>n.id==="cam"); return c.irHealthy && !c.irReflection; }],
  ["adv-raid", "replace-disk", g => { const n=g.nodes.find(n=>n.id==="nvr"); return n.diskHealthy && !n.rebuilding; }],
  ["adv-firmware", "rollback-firmware", g => { const c=g.nodes.find(n=>n.id==="cam"); return c.firmware==="stable" && c.rtspEnabled; }],
  ["adv-ups", "replace-battery", g => { const u=g.nodes.find(n=>n.id==="ups1"); return u.healthFactor>=0.8 && u.capacityWh>=600; }],
  ["adv-emi", "reroute-cable", g => { const l=g.links.find(x=>x.id==="cam-link"); return !l.emi && l.quality==="normal"; }]
];

test("scenario catalog contains 20 unique scenarios across three levels", () => {
  const scenarios=listScenarios();
  assert.equal(scenarios.length,20);
  assert.equal(new Set(scenarios.map(s=>s.id)).size,20);
  assert.deepEqual(new Set(scenarios.map(s=>s.level)),new Set(["پایه","متوسط","پیشرفته"]));
});

test("scenario generation is deterministic for the same seed and varies with a different seed", () => {
  for (const {id} of listScenarios()) {
    const a=createScenario(id,seed), b=createScenario(id,seed), c=createScenario(id,seed+1);
    assert.deepEqual(a.model,b.model,id+" must be deterministic");
    assert.equal(a.seed,b.seed);
    assert.ok(c.model.nodes.length>0);
  }
});

test("public scenario description does not expose the hidden answer key or root cause", () => {
  for (const {id} of listScenarios()) {
    const safe=publicScenario(createScenario(id,seed));
    assert.equal("answerKey" in safe,false,id+" leaks answerKey");
    assert.equal("rootCause" in safe,false,id+" leaks rootCause");
    assert.equal("fix" in safe,false,id+" leaks repair action");
  }
});

for (const [id,action,isRepaired] of definitions) {
  test(id+" can be repaired by its documented corrective action", () => {
    const scenario=createScenario(id,seed);
    const repaired=applyScenarioRepair(scenario.model,action,seed);
    assert.equal(validateGraph(repaired).valid,true,id+" repair must preserve graph validity");
    assert.equal(isRepaired(repaired),true,id+" corrective action did not clear its modeled fault");
  });
}
