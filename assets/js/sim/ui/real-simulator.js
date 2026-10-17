import { listScenarios, createScenario } from "../scenarios.js";
import { evaluateNetwork } from "../engine.js";
import { runTool } from "../tools.js";
import { scoreAttempt, getHint, actionCost } from "../scoring.js";
import { createGraph } from "../graph.js";

const $=id=>document.getElementById(id);
const root=$("realSimulator");
if(root){
 const scenarioSelect=$("realScenario"),seedInput=$("realSeed"),toolSelect=$("realTool"),targetSelect=$("realTarget"),sourceSelect=$("realSource"),linkSelect=$("realLink"),actionSelect=$("realAction");
 const result=$("realToolResult"),stateView=$("realState"),hintView=$("realHint"),report=$("realReport"),diagnosisSelect=$("realDiagnosis");
 const names={camera:"دوربین", "poe-switch":"سوئیچ PoE",switch:"سوئیچ",nvr:"NVR",router:"روتر",firewall:"فایروال",ups:"UPS",monitor:"نمایشگر",laptop:"لپ‌تاپ سرویس","patch-panel":"پچ‌پنل","media-converter":"مبدل رسانه","disk-array":"آرایه دیسک"};
 const tools=[["ping","Ping / ARP"],["multimeter","مولتی‌متر"],["poe-tester","PoE tester"],["cable-tester","تستر کابل / Wiremap"],["switch-console","کنسول سوئیچ / show PoE"],["web-camera","رابط وب دوربین"],["nvr","رابط NVR"],["system-log","لاگ سیستم"],["replace-cable","تعویض کابل"],["reboot","Reboot تجهیز"]];
 const actions=[["enable-port","فعال‌سازی پورت / PoE"],["replace-cable","تعویض کابل معیوب"],["fix-ip","رفع IP تکراری"],["select-hdmi","انتخاب ورودی HDMI درست"],["free-storage","آزادسازی فضای ضبط"],["increase-budget","افزایش/تقسیم بودجه PoE"],["match-duplex","یکسان‌سازی Duplex"],["fix-vlan","اصلاح VLAN"],["fix-subnet","اصلاح ماسک IP"],["fix-clock","همگام‌سازی ساعت/NTP"],["break-loop","رفع Loop و فعال‌سازی RSTP"],["fix-acl","اصلاح ACL"],["upgrade-uplink","افزایش ظرفیت Uplink"],["adjust-ir","اصلاح بازتاب/نور IR"],["replace-disk","تعویض دیسک معیوب"],["rollback-firmware","بازگشت به Firmware سازگار"],["replace-battery","تعویض باتری UPS"],["reroute-cable","انتقال کابل از منبع EMI"]];
 let current=null,attempts=[],downtime=0,hintsUsed=0,startedAt=Date.now(),solved=false,seed=1;
 for(const s of listScenarios()){
  const o=document.createElement("option");o.value=s.id;o.textContent=s.level+" · "+s.customer;scenarioSelect.append(o);
  const d=createScenario(s.id,1).answerKey.rootCause;const opt=document.createElement("option");opt.value=d;opt.textContent=d;diagnosisSelect.append(opt);
 }
 for(const [v,l] of tools){const o=document.createElement("option");o.value=v;o.textContent=l;toolSelect.append(o)}
 for(const [v,l] of actions){const o=document.createElement("option");o.value=v;o.textContent=l;actionSelect.append(o)}
 const fill=(select,items,chosen)=>{select.replaceChildren();for(const item of items){const o=document.createElement("option");o.value=chosen(item);o.textContent=item.label;select.append(o)}};
 function populatePoints(){
  if(!current)return;
  const nodes=current.model.nodes;
  fill(targetSelect,nodes.map(n=>({value:n.id,label:(names[n.type]||n.type)+" · "+n.id})),x=>x.value);
  fill(sourceSelect,nodes.map(n=>({value:n.id,label:(names[n.type]||n.type)+" · "+n.id})),x=>x.value);
  fill(linkSelect,current.model.links.map(l=>({value:l.id,label:l.id+" · "+l.type+" · "+l.lengthM+" m"})),x=>x.value);
  const laptop=nodes.find(n=>n.type==="laptop");if(laptop)sourceSelect.value=laptop.id;
  const camera=nodes.find(n=>n.type==="camera");if(camera)targetSelect.value=camera.id;
 }
 function renderState(){
  const state=evaluateNetwork(current.model);
  stateView.replaceChildren();
  const summary=document.createElement("p");summary.textContent="وضعیت شبکه: "+(state.graphValid?"ساختار پایه معتبر":"خطای ساختاری")+"؛ توان PoE "+state.totalPoeDrawW.toFixed(1)+"/"+state.totalPoeBudgetW.toFixed(1)+" W"+(state.uplinkSaturated?"؛ هشدار اشباع Uplink":"");stateView.append(summary);
  const list=document.createElement("div");list.className="real-state-grid";
  for(const node of current.model.nodes){const s=state.nodes[node.id]||{};const card=document.createElement("div");card.className="real-state-item "+(s.online===false?"is-fail":s.streamAvailable===false&&node.type==="camera"?"is-warn":"is-ok");const title=document.createElement("b");title.textContent=(names[node.type]||node.type)+" · "+node.id;const status=document.createElement("span");status.textContent=s.online===false?"خاموش/دسترسی‌ناپذیر":node.type==="camera"?(s.recording?"تصویر و ضبط فعال":s.streamAvailable?"تصویر فعال؛ ضبط مشکل دارد":"جریان تصویر مشکل دارد"):node.type==="nvr"?(s.recording?"ضبط آماده":"ضبط/دیسک نیازمند بررسی"): "فعال";card.append(title,status);if(s.reasons?.length){const small=document.createElement("small");small.textContent=s.reasons.join("؛ ");card.append(small)}list.append(card)}
  stateView.append(list);
  const links=document.createElement("p");links.textContent="لینک‌ها: "+current.model.links.map(l=>l.id+" "+(state.links[l.id]?.up?"UP":"DOWN")+(state.links[l.id]?.reasons?.length?" ("+state.links[l.id].reasons.join("، ")+")":"")).join(" · ");stateView.append(links);
 }
 function load(id,chosenSeed){
  seed=Number(chosenSeed);if(!Number.isFinite(seed)||seed<0)seed=1;seed=Math.floor(seed)>>>0;seedInput.value=String(seed);
  current=createScenario(id,seed);attempts=[];downtime=0;hintsUsed=0;solved=false;startedAt=Date.now();
  $("realCustomer").textContent=current.customer;
  $("realMeta").textContent=current.level+" · بذر سناریو "+seed+" · زمان و هزینه در محیط مجازی محاسبه می‌شود.";
  $("realHint").textContent="برای شروع، ابزار را به نقطه و لینک مناسب متصل کن؛ علت ریشه‌ای عمداً نمایش داده نمی‌شود.";
  $("realToolResult").textContent="هنوز آزمونی اجرا نشده است.";
  $("realReport").textContent="";
  populatePoints();renderState();
 }
 function replaceGraph(patch){
  const nodes=current.model.nodes.map(n=>({...n,ports:n.ports.map(p=>({...p}))}));
  let links=current.model.links.map(l=>({...l,from:{...l.from},to:{...l.to}}));
  let acl=[...(current.model.acl||[])],trafficMbps=current.model.trafficMbps||0;
  const findNode=id=>nodes.find(n=>n.id===id),sw=findNode("sw"),cam=findNode("cam"),nvr=findNode("nvr");
  switch(patch){
   case "enable-port": if(sw)for(const p of sw.ports){p.adminUp=true;p.poeEnabled=true}break;
   case "replace-cable": links=links.map(l=>({...l,cableFault:"none",quality:"normal",cableMaterial:"copper",emi:false,active:true}));break;
   case "fix-ip": if(cam)cam.ip="192.168.10."+String(230+(seed%20));for(const n of nodes)if(n.id==="rogue")n.ip="192.168.10.249";break;
   case "select-hdmi": {const m=findNode("monitor");if(m){m.input="HDMI1";m.hdmiConnected=true}if(nvr)nvr.hdmiConnected=true;break}
   case "free-storage": if(nvr)nvr.freeStorageTB=2;break;
   case "increase-budget": if(sw){sw.poeBudgetW=180;for(const p of sw.ports)if(p.poeEnabled)p.poeDrawW=12}break;
   case "match-duplex": links=links.map(l=>({...l,duplexMismatch:false,crcErrors:0}));break;
   case "fix-vlan": for(const n of nodes)for(const p of n.ports)if(p.vlan!=null)p.vlan=10;break;
   case "fix-subnet": if(cam)cam.prefix=24;break;
   case "fix-clock": for(const n of nodes)if(n.type==="camera"||n.type==="nvr"){n.clockSynced=true;n.timezone="local"}break;
   case "break-loop": links=links.filter(l=>!l.loop);if(sw)sw.rstpEnabled=true;break;
   case "fix-acl": acl=[];break;
   case "upgrade-uplink": links=links.map(l=>({...l,speedMbps:10000}));trafficMbps=700;break;
   case "adjust-ir": if(cam){cam.irHealthy=true;cam.irReflection=false}break;
   case "replace-disk": if(nvr){nvr.diskHealthy=true;nvr.rebuilding=false}break;
   case "rollback-firmware": if(cam){cam.firmware="stable";cam.rtspEnabled=true}break;
   case "replace-battery": {const u=findNode("ups1");if(u){u.healthFactor=.9;u.chargePercent=100;u.capacityWh=600}break}
   case "reroute-cable": links=links.map(l=>({...l,emi:false,quality:"normal",lengthM:Math.min(l.lengthM,60)}));break;
  }
  current.model=createGraph({nodes,links,vlans:current.model.vlans,acl,trafficMbps});
 }
 $("loadRealScenario").addEventListener("click",()=>load(scenarioSelect.value,seedInput.value));
 $("nextRealScenario").addEventListener("click",()=>{const list=listScenarios(),i=list.findIndex(s=>s.id===scenarioSelect.value),next=list[(i+1)%list.length];scenarioSelect.value=next.id;load(next.id,(seed+1)>>>0)});
 $("retryRealScenario").addEventListener("click",()=>load(scenarioSelect.value,seed));
 $("runRealTool").addEventListener("click",()=>{
  const tool=toolSelect.value,target=targetSelect.value,source=sourceSelect.value,linkId=linkSelect.value;
  try{
   const response=runTool(current.model,{tool,target,source,linkId,seed,now:Math.round((Date.now()-startedAt)/1000)});
   const cost=actionCost(tool==="replace-cable"?"replaceCable":tool==="reboot"?"reboot":tool==="cable-tester"?"cableTest":tool==="switch-console"?"showPoe":"ping");
   downtime+=response.downtimeMinutes||0;attempts.push({tool,target,source,linkId,ok:response.ok,output:response.output,seconds:Math.round((Date.now()-startedAt)/1000)});
   result.textContent="["+tool+"] "+(response.output||JSON.stringify(response))+(response.voltageV!==undefined?" ولتاژ: "+response.voltageV+" V":"")+(response.deliveredW!==undefined?"؛ توان: "+response.deliveredW+" W":"");
   renderState();
  }catch(error){result.textContent="خطا: "+error.message}
 });
 $("applyRealAction").addEventListener("click",()=>{
  const action=actionSelect.value,cost=actionCost(action==="replace-cable"?"replaceCable":action==="replace-disk"?"replaceDevice":action==="enable-port"?"showPoe":"reboot");
  replaceGraph(action);attempts.push({tool:"action",target:targetSelect.value,action,ok:true,seconds:Math.round((Date.now()-startedAt)/1000)});downtime+=cost.minutes;
  result.textContent="اقدام مجازی «"+actionSelect.options[actionSelect.selectedIndex].text+"» اجرا شد؛ "+cost.minutes+" دقیقه توقف و "+cost.cost+" واحد هزینه مدل شد. وضعیت را دوباره تست کن.";
  populatePoints();renderState();
 });
 $("realHintButton").addEventListener("click",()=>{hintsUsed++;hintView.textContent="راهنمای سطح "+Math.min(3,hintsUsed)+" از ۳: "+getHint(current,Math.min(3,hintsUsed))});
 $("submitRealDiagnosis").addEventListener("click",()=>{
  const outcome=scoreAttempt({selectedCause:diagnosisSelect.value,rootCause:current.answerKey.rootCause,actions:attempts.map(a=>a.action||a.tool),optimalPath:current.optimalPath,downtimeMinutes:downtime,hintsUsed,unsafeActions:attempts.filter(a=>a.action==="factory-reset").map(a=>a.action)});
  solved=true;
  report.textContent=(outcome.correct?"تشخیص درست است.":"تشخیص نادرست است.")+" امتیاز: "+outcome.score+"/100.\nعلت ریشه‌ای: "+current.answerKey.rootCause+"\nمسیر بهینه: "+current.optimalPath.join(" ← ")+"\nاقدام‌های کاربر: "+attempts.map(a=>a.action||a.tool).join("، ")+"\nآزمون‌های غیرضروری: "+outcome.unnecessaryActions.join("، ")+"\nتوقف مجازی: "+downtime+" دقیقه.\nدرس: "+current.lesson+"\nپیشگیری: یک متغیر را هر بار تغییر بده، Backup بگیر و آزمون تحویل را ثبت کن.";
 });
 load(scenarioSelect.value||listScenarios()[0].id,1);
}
