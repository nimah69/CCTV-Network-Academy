import { evaluateNetwork, runDiagnostic } from "./engine.js";
import { findPort } from "./graph.js";
import { ENGINEERING } from "./constants.js";
const prng=(seed)=>{let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}};
export function seededNoise(seed,amplitude=0.02){const r=prng(seed);return (1+(r()*2-1)*amplitude)}
export function runTool(graph, request={}){
 const {tool,target,source,seed=1,linkId}=request, state=evaluateNetwork(graph,{now:request.now||0});
 if(tool==="ping"||tool==="web-camera"||tool==="nvr"||tool==="show-poe")return runDiagnostic(graph,tool,target,{source,now:request.now||0,acl:request.acl??graph.acl??[]});
 if(tool==="multimeter"||tool==="poe-tester"){
  const link=graph.links.find(l=>l.id===linkId)||graph.links.find(l=>l.from.node===target||l.to.node===target);
  if(!link)return {tool,target,ok:false,output:"پراب‌ها به یک لینک موجود متصل نشده‌اند."};
  const ls=state.links[link.id],a=findPort(graph,link.from.node,link.from.port),b=findPort(graph,link.to.node,link.to.port);
  const sourcePort=graph.nodes.find(n=>n.id===link.from.node)?.type==="poe-switch"?a:graph.nodes.find(n=>n.id===link.to.node)?.type==="poe-switch"?b:null;
  const voltage=sourcePort?.poeEnabled?48*seededNoise(seed,0.005):0;
  return {tool,target,linkId:link.id,ok:Boolean(ls?.up&&voltage>0),voltageV:Number(voltage.toFixed(2)),deliveredW:ls?.poeDeliveredW||0,output:!sourcePort?.poeEnabled?"PoE روی این لینک فعال نیست.":!ls?.up?"لینک یا تحویل توان ناموفق است.":"ولتاژ مدل‌شده در سمت PSE "+voltage.toFixed(1)+" V؛ توان برآوردی در سمت PD "+(ls?.poeDeliveredW||0)+" W. این ابزار آموزشی است و جایگزین اندازه‌گیری واقعی نیست."};
 }
 if(tool==="cable-tester"){
  const link=graph.links.find(l=>l.id===linkId)||graph.links.find(l=>l.from.node===target||l.to.node===target);
  if(!link)return {tool,target,ok:false,output:"تستر به لینک/کابل مشخصی وصل نشده است."};
  const fault=link.cableFault||"none",quality=link.quality||"normal";
  const ok=fault==="none"&&quality==="normal";
  return {tool,target,linkId:link.id,wiremap:fault==="open"?"open":fault==="short"?"short":fault==="split-pair"?"split-pair":fault==="reversed"?"reversed":"pass",lengthM:Math.round(link.lengthM*seededNoise(seed,0.04)),ok,output:"Wiremap: "+(fault==="none"?"PASS":fault)+"؛ طول تقریبی "+Math.round(link.lengthM*seededNoise(seed,0.04))+" m؛ کیفیت "+quality+(quality!=="normal"?"؛ حاشیه عملکرد پایین‌تر از کابل سالم است.":".")};
 }
 if(tool==="switch-console"){
  const node=graph.nodes.find(n=>n.id===target);
  if(!node||!["switch","poe-switch"].includes(node.type))return {tool,target,ok:false,output:"کنسول به سوئیچ متصل نیست."};
  const ports=node.ports.map(p=>({port:p.id,admin:p.adminUp?"up":"down",vlan:p.vlan,speedMbps:p.speedMbps,poe:p.poeEnabled?(p.poeDrawW<=p.poeBudgetW?"delivering":"denied"):"off"}));
  return {tool,target,ok:true,ports,output:ports.map(p=>p.port+" admin "+p.admin+" VLAN "+p.vlan+" "+p.speedMbps+" Mbps PoE "+p.poe).join("\n")};
 }
 if(tool==="system-log"){const device=graph.nodes.find(n=>n.id===target);const deviceEvents=[];if(device?.clockSynced===false)deviceEvents.push({time:request.now||0,type:"clock-drift",message:"اختلاف ساعت/NTP در "+target+" ثبت شده است"});if(device?.type==="ups"&&((device.chargePercent||0)<50||(device.healthFactor||1)<0.6))deviceEvents.push({time:request.now||0,type:"ups-battery",message:"شارژ یا سلامت باتری UPS پایین است"});if(device?.diskHealthy===false)deviceEvents.push({time:request.now||0,type:"disk-error",message:"خطای دیسک در NVR ثبت شده است"});const events=[...state.events,...deviceEvents,{time:(request.now||0)-120,type:"noise",message:"ورود موفق اپراتور به رابط مدیریت"},{time:(request.now||0)-30,type:"noise",message:"گزارش دوره‌ای سلامت سرویس"}].sort((a,b)=>a.time-b.time);return {tool,target,ok:true,events,output:events.map(e=>e.type+": "+e.message).join("\\n")};}
 if(tool==="replace-cable"){
  const link=graph.links.find(l=>l.id===linkId);if(!link)return {tool,ok:false,output:"کابل مشخص نشده است."};
  const links=graph.links.map(l=>l.id===linkId?{...l,cableFault:"none",quality:"normal",active:true}:l);
  return {tool,ok:true,graph:{nodes:graph.nodes,links,vlans:graph.vlans},output:"کابل در شبکه مجازی تعویض شد؛ دوباره ابزارهای تشخیصی را اجرا کن.",cost:15,downtimeMinutes:5};
 }
 if(tool==="reboot"){
  const node=graph.nodes.find(n=>n.id===target);if(!node)return {tool,ok:false,output:"تجهیز انتخاب‌شده وجود ندارد."};
  return {tool,ok:true,graph:{nodes:graph.nodes.map(n=>n.id===target?{...n,rebootCount:(n.rebootCount||0)+1,adminUp:true}:n),links:graph.links,vlans:graph.vlans},cost:5,downtimeMinutes:2,output:"تجهیز مجازی راه‌اندازی مجدد شد؛ علت ریشه‌ای احتمالی برطرف نشده باشد، خطا ممکن است برگردد."};
 }
 return {tool,target,ok:false,output:"ابزار ناشناخته است یا هنوز به نقطه معتبر متصل نشده است."};
}
export const TOOL_NAMES=Object.freeze(["multimeter","poe-tester","cable-tester","switch-console","ping","web-camera","nvr","system-log","replace-cable","reboot"]);
