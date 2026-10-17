import { evaluateNetwork, runDiagnostic } from "./engine.js";
import { findPort } from "./graph.js";
import { ENGINEERING } from "./constants.js";

const prng=seed=>{let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}};
export function seededNoise(seed,amplitude=ENGINEERING.tools.meterNoiseFraction){const random=prng(seed);return 1+(random()*2-1)*amplitude}
export function runTool(graph,request={}){
 const {tool,target,source,seed=1,linkId}=request;
 const state=evaluateNetwork(graph,{now:request.now||0});
 if(["ping","arp","traceroute","web-camera","nvr","show-poe"].includes(tool))return runDiagnostic(graph,tool,target,{source,now:request.now||0,acl:request.acl??graph.acl??[]});
 if(tool==="multimeter"||tool==="poe-tester"){
  const link=graph.links.find(l=>l.id===linkId);
  if(!link||!(link.from.node===target||link.to.node===target))return {tool,target,ok:false,output:"ابزار باید به یکی از دو سر کابل انتخاب‌شده متصل باشد."};
  const linkState=state.links[link.id],fromPort=findPort(graph,link.from.node,link.from.port),toPort=findPort(graph,link.to.node,link.to.port);
  const sourceNode=graph.nodes.find(n=>n.id===link.from.node),destNode=graph.nodes.find(n=>n.id===link.to.node);
  const sourcePort=sourceNode?.type==="poe-switch"?fromPort:destNode?.type==="poe-switch"?toPort:null;
  const pseVoltage=sourcePort?.poeEnabled?ENGINEERING.poe.nominalVoltageV*seededNoise(seed,ENGINEERING.tools.meterNoiseFraction):0;
  const pdVoltage=Math.max(0,pseVoltage-(linkState?.voltageDropV||0));
  const ok=Boolean(linkState?.up&&pseVoltage>0);
  return {tool,target,linkId:link.id,ok,pseVoltageV:Number(pseVoltage.toFixed(2)),voltageV:Number(pdVoltage.toFixed(2)),deliveredW:linkState?.poeDeliveredW||0,voltageDropV:linkState?.voltageDropV||0,output:!sourcePort?.poeEnabled?"PoE روی این لینک فعال نیست.":!linkState?.up?"لینک یا تحویل توان ناموفق است؛ علت را در وضعیت لینک/پورت پیدا کن.":"ولتاژ تخمینی سمت PSE: "+pseVoltage.toFixed(2)+" V؛ سمت PD: "+pdVoltage.toFixed(2)+" V؛ توان مدل‌شده رسیده به PD: "+(linkState?.poeDeliveredW||0)+" W. ابزار آموزشی است و جایگزین اندازه‌گیری واقعی نیست."};
 }
 if(tool==="cable-tester"){
  const link=graph.links.find(l=>l.id===linkId);
  if(!link||!(link.from.node===target||link.to.node===target))return {tool,target,ok:false,output:"تستر باید به کابل انتخاب‌شده و یکی از دو سر آن وصل باشد."};
  const fault=link.cableFault||"none",quality=link.quality||"normal",measuredLength=Math.round(link.lengthM*seededNoise(seed,ENGINEERING.tools.cableLengthNoiseFraction));
  const ok=fault==="none"&&quality==="normal"&&!link.emi;
  const wiremap=fault==="open"?"OPEN":fault==="short"?"SHORT":fault==="split-pair"?"SPLIT-PAIR":fault==="reversed"?"REVERSED":"PASS";
  return {tool,target,linkId:link.id,wiremap,lengthM:measuredLength,quality,ok,output:"Wiremap: "+wiremap+"؛ طول تخمینی "+measuredLength+" m؛ کیفیت "+quality+(link.emi?"؛ EMI محتمل است.":quality!=="normal"?"؛ حاشیه عملکرد پایین‌تر از کابل سالم است.":".")};
 }
 if(tool==="switch-console"){
  const node=graph.nodes.find(n=>n.id===target);
  if(!node||!["switch","poe-switch"].includes(node.type))return {tool,target,ok:false,output:"کنسول به سوئیچ متصل نیست."};
  const ports=node.ports.map(p=>({port:p.id,admin:p.adminUp?"up":"down",vlan:p.vlan,speedMbps:p.speedMbps,duplex:p.duplex||"auto",poe:p.poeEnabled?(p.poeDrawW<=p.poeBudgetW?"delivering":"denied"):"off"}));
  const links=graph.links.filter(l=>l.from.node===target||l.to.node===target).map(l=>({id:l.id,...state.links[l.id]}));
  const events=state.events.filter(e=>e.type==="broadcast-storm"||e.type==="poe-overload"||e.type==="uplink-saturation"||e.type==="interface-errors"||e.type==="rstp-blocked-loop"||e.type==="storm-control-active"||e.type==="multicast-flooding"||e.type==="igmp-snooping"||e.type==="qos-priority"||e.type==="qos-congestion");
  const output=ports.map(p=>p.port+" admin "+p.admin+" VLAN "+p.vlan+" "+p.speedMbps+" Mbps duplex "+p.duplex+" PoE "+p.poe).join("\n")+"\nلینک‌ها: "+links.map(l=>l.id+" "+(l.up?"UP":"DOWN")+" CRC="+l.crcErrors+(l.duplexMismatch?" Duplex mismatch":"")).join(", ")+"\nرخدادهای کلیدی: "+(events.map(e=>e.message).join("؛ ")||"موردی ثبت نشد");
  return {tool,target,ok:true,ports,links,events,output};
 }
 if(tool==="system-log"){
  const device=graph.nodes.find(n=>n.id===target),deviceEvents=[];
  if(device?.clockSynced===false)deviceEvents.push({time:request.now||0,type:"clock-drift",message:"اختلاف ساعت/NTP در "+target+" ثبت شده است"});
  if(device?.type==="ups"&&((device.chargePercent||0)<50||(device.healthFactor||1)<0.6))deviceEvents.push({time:request.now||0,type:"ups-battery",message:"شارژ یا سلامت باتری UPS پایین است"});
  if(device?.diskHealthy===false)deviceEvents.push({time:request.now||0,type:"disk-error",message:"خطای دیسک در NVR ثبت شده است"});
  const events=[...state.events,...deviceEvents,{time:(request.now||0)-120,type:"noise",message:"ورود موفق اپراتور به رابط مدیریت"},{time:(request.now||0)-30,type:"noise",message:"گزارش دوره‌ای سلامت سرویس"}].sort((a,b)=>a.time-b.time);
  return {tool,target,ok:true,events,output:events.map(e=>e.type+": "+e.message).join("\n")};
 }
 if(tool==="replace-cable"){
  const link=graph.links.find(l=>l.id===linkId);
  if(!link||!(link.from.node===target||link.to.node===target))return {tool,ok:false,output:"کابل برای تعویض انتخاب نشده یا ابزار به آن متصل نیست."};
  const links=graph.links.map(l=>l.id===linkId?{...l,cableFault:"none",quality:"normal",cableMaterial:"copper",emi:false,lengthM:Math.min(l.lengthM,60),active:true}:l);
  return {tool,ok:true,graph:{nodes:graph.nodes,links,vlans:graph.vlans,acl:graph.acl,trafficMbps:graph.trafficMbps},output:"کابل مجازی با مسیر کوتاه‌تر و هادی مسی جایگزین شد؛ دوباره آزمون بگیر.",cost:12,downtimeMinutes:15};
 }
 if(tool==="reboot"){
  const node=graph.nodes.find(n=>n.id===target);
  if(!node)return {tool,ok:false,output:"تجهیز انتخاب‌شده وجود ندارد."};
  return {tool,ok:true,graph:{nodes:graph.nodes.map(n=>n.id===target?{...n,rebootCount:(n.rebootCount||0)+1,adminUp:true}:n),links:graph.links,vlans:graph.vlans,acl:graph.acl,trafficMbps:graph.trafficMbps},cost:4,downtimeMinutes:8,output:"تجهیز مجازی راه‌اندازی مجدد شد؛ علت ریشه‌ای برطرف نشده باشد، خطا ممکن است برگردد."};
 }
 return {tool,target,ok:false,output:"ابزار ناشناخته است یا هنوز به نقطه معتبر متصل نشده است."};
}
export const TOOL_NAMES=Object.freeze(["multimeter","poe-tester","cable-tester","switch-console","ping","arp","traceroute","web-camera","nvr","system-log","replace-cable","reboot"]);
