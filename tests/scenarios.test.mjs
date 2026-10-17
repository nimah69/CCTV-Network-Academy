import test from "node:test";
import assert from "node:assert/strict";
import { listScenarios,createScenario,publicScenario,applyScenarioRepair } from "../assets/js/sim/scenarios.js";
import { runTool } from "../assets/js/sim/tools.js";
import { evaluateNetwork } from "../assets/js/sim/engine.js";
import { scoreAttempt,getHint } from "../assets/js/sim/scoring.js";
test("at least 18 scenarios in three difficulty levels",()=>{const all=listScenarios();assert.ok(all.length>=18);for(const level of ["پایه","متوسط","پیشرفته"])assert.ok(all.filter(s=>s.level===level).length>=6)});
test("every scenario has hidden root cause and discoverability metadata",()=>{for(const item of listScenarios()){const s=createScenario(item.id,1234);assert.ok(s.answerKey.rootCause);assert.ok(s.optimalPath.length>=2);assert.equal(publicScenario(s).answerKey,undefined);assert.ok(s.hints.length===3)}});
test("same seed reproduces same scenario parameters",()=>{assert.deepEqual(createScenario("basic-cable",987).model,createScenario("basic-cable",987).model)});
test("different seed can vary cable length or selected port",()=>{const a=createScenario("basic-cable",1),b=createScenario("basic-cable",2);assert.ok(a.meta.length!==b.meta.length||a.model.links[0].from.port!==b.model.links[0].from.port)});
test("attempt scoring rewards correct and penalizes unsafe action",()=>{const good=scoreAttempt({selectedCause:"x",rootCause:"x",actions:["inspect"],optimalPath:["inspect"]});const bad=scoreAttempt({selectedCause:"y",rootCause:"x",actions:["factoryReset"],optimalPath:["inspect"],unsafeActions:["factoryReset"]});assert.ok(good.score>bad.score)});
test("hint tiers remain bounded",()=>{const s=createScenario("basic-poe",1);assert.ok(getHint(s,1));assert.ok(getHint(s,2));assert.ok(getHint(s,3));assert.equal(getHint(s,99),getHint(s,3))});

test("every scenario exposes a diagnostic path but not its root cause",()=>{
 for(const item of listScenarios()){
  const s=createScenario(item.id,456),pub=publicScenario(s),tool=s.answerKey.firstTool;
  assert.ok(!JSON.stringify(pub).includes(s.answerKey.rootCause),item.id+" leaks root cause");
  const target=["show-poe","switch-console"].includes(tool)?"sw":["nvr"].includes(tool)?"nvr":tool==="system-log"&&item.id==="adv-ups"?"ups1":"cam";
  const response=runTool(s.model,{tool,target,source:"service-laptop",linkId:"cam-link",seed:s.seed});
  assert.ok(response.output||response.ports||response.events,item.id+" tool has no computed output");
 }
});
test("optimal repair action changes the modeled fault state",()=>{
 for(const item of listScenarios()){
  const s=createScenario(item.id,456),repaired=applyScenarioRepair(s.model,s.answerKey.fix,s.seed,"cam-link"),state=evaluateNetwork(repaired);
  const cam=repaired.nodes.find(n=>n.id==="cam"),nvr=repaired.nodes.find(n=>n.id==="nvr"),sw=repaired.nodes.find(n=>n.id==="sw");
  switch(item.id){
   case "basic-poe":case "basic-port":assert.equal(state.links["cam-link"].up,true,item.id);break;
   case "basic-cable":assert.equal(state.links["cam-link"].up,true,item.id);break;
   case "basic-ip":assert.equal(state.events.some(e=>e.type==="ip-conflict"),false,item.id);break;
   case "basic-hdmi":assert.equal(nvr.hdmiConnected,true,item.id);break;
   case "basic-disk":assert.ok(nvr.freeStorageTB>0,item.id);break;
   case "mid-budget":assert.ok(sw.poeBudgetW>=state.totalPoeDrawW,item.id);break;
   case "mid-cca":assert.equal(state.nodes.cam.online,true,item.id+" "+JSON.stringify({link:state.links["cam-link"],camera:state.nodes.cam,port:repaired.nodes.find(n=>n.id==="sw").ports.find(p=>p.id===repaired.links.find(l=>l.id==="cam-link").from.port)}));break;
   case "mid-duplex":assert.equal(repaired.links.find(l=>l.id==="cam-link").duplexMismatch,false,item.id);break;
   case "mid-vlan":assert.equal(state.links["cam-link"].up,true,item.id);break;
   case "mid-subnet":assert.equal(cam.prefix,24,item.id);break;
   case "mid-ntp":assert.equal(cam.clockSynced,true,item.id);break;
   case "adv-loop":assert.equal(repaired.links.some(l=>l.loop),false,item.id);break;
   case "adv-acl":assert.equal(repaired.acl.length,0,item.id);break;
   case "adv-uplink":assert.equal(state.uplinkSaturated,false,item.id);break;
   case "adv-ir":assert.equal(cam.irReflection,false,item.id);break;
   case "adv-raid":assert.equal(nvr.diskHealthy,true,item.id);break;
   case "adv-firmware":assert.equal(cam.firmware,"stable",item.id);break;
   case "adv-ups":assert.ok(repaired.nodes.find(n=>n.id==="ups1").healthFactor>.6,item.id);break;
   case "adv-emi":assert.equal(repaired.links.find(l=>l.id==="cam-link").emi,false,item.id);break;
  }
 }
});
