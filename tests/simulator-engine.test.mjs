import test from "node:test";
import assert from "node:assert/strict";
import { createGraph, validateGraph } from "../assets/js/sim/graph.js";
import { evaluateNetwork, runDiagnostic } from "../assets/js/sim/engine.js";
import { normalizeDigits, mbpsToMBps, decimalTBToTiB, wattsToVA } from "../assets/js/sim/units.js";

function fixture(overrides = {}) {
  return createGraph({
    nodes: [
      { id:"sw", type:"poe-switch", poeBudgetW:60, ports:[{id:"p1",vlan:10,adminUp:true,speedMbps:1000,poeEnabled:true,poeBudgetW:30,poeDrawW:12},{id:"p2",vlan:10,adminUp:true,speedMbps:1000}] },
      { id:"cam", type:"camera", ip:"192.168.10.20",prefix:24,vlan:10,poeRequired:true,minPoeW:10,rtspEnabled:true,ports:[{id:"eth0",vlan:10}] },
      { id:"nvr", type:"nvr", ip:"192.168.10.10",prefix:24,vlan:10,recordingEnabled:true,diskHealthy:true,freeStorageTB:2,ports:[{id:"eth0",vlan:10}] }
    ],
    links:[{id:"l1",type:"poe",from:{node:"sw",port:"p1"},to:{node:"cam",port:"eth0"},lengthM:30},{id:"l2",type:"ethernet",from:{node:"sw",port:"p2"},to:{node:"nvr",port:"eth0"},lengthM:5}],
    vlans:[{id:10,name:"Cameras"}], ...overrides
  });
}
test("normalizes Persian and Arabic digits",()=>{assert.equal(normalizeDigits("۱۲۳٫۵"),"123.5");assert.equal(normalizeDigits("١٢٣"),"123");});
test("Mbps converts to MB/s",()=>assert.equal(mbpsToMBps(80),10));
test("decimal TB converts to binary TiB",()=>assert.ok(Math.abs(decimalTBToTiB(1)-0.9094947)<1e-6));
test("watts to VA respects power factor",()=>assert.equal(wattsToVA(400,0.8),500));
test("valid graph has no structural errors",()=>assert.equal(validateGraph(fixture()).valid,true));
test("unknown node in link is rejected",()=>assert.throws(()=>fixture({links:[{id:"bad",type:"ethernet",from:{node:"sw",port:"p1"},to:{node:"missing",port:"p1"}}]}),/تجهیز ناموجود/));
test("unknown port in link is rejected",()=>assert.throws(()=>fixture({links:[{id:"bad",type:"ethernet",from:{node:"sw",port:"no"},to:{node:"cam",port:"eth0"}}]}),/پورت ناموجود/));
test("duplicate node identifiers are rejected",()=>assert.throws(()=>fixture({nodes:[{id:"x",type:"camera"},{id:"x",type:"nvr"}],links:[]}),/تکراری/));
test("disabled port makes link down",()=>{const g=fixture();const nodes=g.nodes.map(n=>n.id==="sw"?{...n,ports:n.ports.map(p=>p.id==="p1"?{...p,adminUp:false}:p)}:n);const s=evaluateNetwork(createGraph({nodes,links:g.links,vlans:g.vlans}));assert.equal(s.links.l1.up,false);});
test("duplicate IPs produce an event",()=>{const g=fixture({nodes:[{id:"a",type:"camera",ip:"192.168.1.2",prefix:24,ports:[{id:"e"}]},{id:"b",type:"nvr",ip:"192.168.1.2",prefix:24,ports:[{id:"e"}]}],links:[]});assert.ok(evaluateNetwork(g).events.some(e=>e.type==="ip-conflict"));});
test("camera records when reachable, same subnet and disk healthy",()=>{const s=evaluateNetwork(fixture());assert.equal(s.nodes.cam.streamAvailable,true);assert.equal(s.nodes.cam.recording,true);});
test("ACL denial blocks stream",()=>{const g=fixture();const s=evaluateNetwork(g,{acl:[{from:"cam",to:"nvr",action:"deny"}]});assert.equal(s.nodes.cam.streamAvailable,false);});
test("ping tool returns computed state",()=>{const g=fixture();const result=runDiagnostic(g,"ping","cam");assert.equal(result.ok,true);assert.match(result.output,/پاسخ/);});
test("unknown diagnostic target is rejected",()=>assert.throws(()=>runDiagnostic(fixture(),"ping","missing"),/وجود ندارد/));
\ntest("ARP and traceroute derive results from the selected source path",()=>{const g=fixture();assert.equal(runDiagnostic(g,"arp","cam",{source:"nvr"}).ok,true);assert.equal(runDiagnostic(g,"traceroute","cam",{source:"nvr"}).ok,true);const broken=createGraph({nodes:g.nodes,links:g.links.map(l=>l.id==="l1"?{...l,active:false}:l),vlans:g.vlans});assert.equal(runDiagnostic(broken,"arp","cam",{source:"nvr"}).ok,false)});\n